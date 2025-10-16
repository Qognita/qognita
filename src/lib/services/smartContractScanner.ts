import { Connection, PublicKey } from '@solana/web3.js';

export interface SecurityVulnerability {
  type:
    | 'REENTRANCY'
    | 'INTEGER_OVERFLOW'
    | 'MISSING_SIGNER_CHECK'
    | 'ACCESS_CONTROL'
    | 'DESERIALIZATION_ERROR'
    | 'AUTHORITY_ABUSE'
    | 'UNINITIALIZED_ACCOUNT';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location?: string;
  recommendation: string;
  cweId?: string;
}

export interface SmartContractAnalysis {
  programId: string;
  sourceCodeAvailable: boolean;
  isVerified: boolean;
  vulnerabilities: SecurityVulnerability[];
  securityScore: number;
  riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  analysisTimestamp: string;
  codeMetrics?: {
    linesOfCode: number;
    complexity: number;
    dependencies: string[];
  };
}

export class SmartContractScanner {
  private connection: Connection;
  private solscanApiKey: string;

  constructor(rpcUrl: string = 'https://api.mainnet-beta.solana.com') {
    this.connection = new Connection(rpcUrl, 'confirmed');
    this.solscanApiKey =
      process.env.SOLSCAN_API_KEY ||
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjcmVhdGVkQXQiOjE3NTg2NjI5ODg2MTMsImVtYWlsIjoiYWtpbnRvbGFoYXJyeUBnbWFpbC5jb20iLCJhY3Rpb24iOiJ0b2tlbi1hcGkiLCJhcGlWZXJzaW9uIjoidjIiLCJpYXQiOjE3NTg2NjI5ODh9.7EV2QRVCc_-Sobo4Vv1YTuA18OPlmLvsmrsdbMRPCmE';
  }

  async scanProgram(programId: string): Promise<SmartContractAnalysis> {
    console.log(`🔍 Starting comprehensive security scan for program: ${programId}`);

    const vulnerabilities: SecurityVulnerability[] = [];
    let sourceCodeAvailable = false;
    let isVerified = false;

    try {
      // Step 1: Check if program exists and get basic info
      const accountInfo = await this.connection.getAccountInfo(new PublicKey(programId));

      if (!accountInfo) {
        throw new Error('Program not found on-chain');
      }

      // Step 2: Try to get verified source code
      const sourceCodeInfo = await this.getVerifiedSourceCode(programId);
      sourceCodeAvailable = sourceCodeInfo.available;
      isVerified = sourceCodeInfo.verified;

      // Step 3: Perform on-chain behavioral analysis (always possible)
      const behavioralVulns = await this.performBehavioralAnalysis(programId, accountInfo);
      vulnerabilities.push(...behavioralVulns);

      // Step 4: If source code is available, perform static analysis
      if (sourceCodeAvailable && sourceCodeInfo.code) {
        console.log('📋 Source code available - performing static analysis...');
        const staticVulns = await this.performStaticAnalysis(sourceCodeInfo.code);
        vulnerabilities.push(...staticVulns);
      } else {
        console.log('⚠️ Source code not available - using heuristic analysis...');
        const heuristicVulns = await this.performHeuristicAnalysis(programId, accountInfo);
        vulnerabilities.push(...heuristicVulns);
      }

      // Step 5: Calculate security score
      const securityScore = this.calculateSecurityScore(vulnerabilities);
      const riskLevel = this.determineRiskLevel(securityScore, vulnerabilities);

      return {
        programId,
        sourceCodeAvailable,
        isVerified,
        vulnerabilities,
        securityScore,
        riskLevel,
        analysisTimestamp: new Date().toISOString(),
        codeMetrics: sourceCodeInfo.metrics,
      };
    } catch (error) {
      console.error('Smart contract scan failed:', error);

      return {
        programId,
        sourceCodeAvailable: false,
        isVerified: false,
        vulnerabilities: [
          {
            type: 'ACCESS_CONTROL',
            severity: 'MEDIUM',
            description:
              'Could not complete security analysis - program may have restricted access',
            recommendation: 'Verify program source code manually before interacting',
          },
        ],
        securityScore: 50,
        riskLevel: 'MEDIUM',
        analysisTimestamp: new Date().toISOString(),
      };
    }
  }

  private async getVerifiedSourceCode(programId: string): Promise<{
    available: boolean;
    verified: boolean;
    code?: string;
    metrics?: any;
  }> {
    try {
      // Try Solscan API for verified source code
      const response = await fetch(`https://pro-api.solscan.io/v2.0/account/${programId}/source`, {
        headers: {
          token: this.solscanApiKey,
          'User-Agent': 'Qognita-Security-Scanner/1.0',
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          available: true,
          verified: data.verified || false,
          code: data.source_code,
          metrics: data.metrics,
        };
      }

      // Try alternative sources (GitHub, etc.)
      const githubInfo = await this.tryGitHubSource(programId);
      if (githubInfo.found) {
        return {
          available: true,
          verified: false, // Not officially verified but available
          code: githubInfo.code,
          metrics: githubInfo.metrics,
        };
      }

      return { available: false, verified: false };
    } catch (error) {
      console.warn('Could not fetch source code:', error);
      return { available: false, verified: false };
    }
  }

  private async performBehavioralAnalysis(
    programId: string,
    accountInfo: any
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Check if program is upgradeable
    if (accountInfo.owner.toString() === 'BPFLoaderUpgradeab1e11111111111111111111111') {
      vulnerabilities.push({
        type: 'AUTHORITY_ABUSE',
        severity: 'HIGH',
        description:
          'Program is upgradeable - code can be changed by program authority without notice',
        recommendation: 'Verify upgrade authority is renounced or controlled by governance',
        cweId: 'CWE-269',
      });
    }

    // Check program age and activity
    try {
      const programHistory = await this.analyzeProgramHistory(programId);

      if (programHistory.ageInDays < 7) {
        vulnerabilities.push({
          type: 'ACCESS_CONTROL',
          severity: 'MEDIUM',
          description: 'Program deployed recently - insufficient time for community audit',
          recommendation: 'Wait for community audit or proceed with extreme caution',
        });
      }

      if (programHistory.hasRecentUpgrades) {
        vulnerabilities.push({
          type: 'AUTHORITY_ABUSE',
          severity: 'MEDIUM',
          description: 'Program has been upgraded recently - code changes may introduce new risks',
          recommendation: 'Review recent changes and upgrade authority',
        });
      }
    } catch (error) {
      console.warn('Could not analyze program history:', error);
    }

    return vulnerabilities;
  }

  private async performStaticAnalysis(sourceCode: string): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Reentrancy Detection
    const reentrancyVulns = this.detectReentrancy(sourceCode);
    vulnerabilities.push(...reentrancyVulns);

    // Integer Overflow/Underflow Detection
    const overflowVulns = this.detectIntegerOverflow(sourceCode);
    vulnerabilities.push(...overflowVulns);

    // Missing Signer Checks
    const signerVulns = this.detectMissingSignerChecks(sourceCode);
    vulnerabilities.push(...signerVulns);

    // Access Control Issues
    const accessVulns = this.detectAccessControlIssues(sourceCode);
    vulnerabilities.push(...accessVulns);

    // Deserialization Errors
    const deserializationVulns = this.detectDeserializationErrors(sourceCode);
    vulnerabilities.push(...deserializationVulns);

    // Uninitialized Account Issues
    const uninitializedVulns = this.detectUninitializedAccounts(sourceCode);
    vulnerabilities.push(...uninitializedVulns);

    return vulnerabilities;
  }

  private detectReentrancy(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Look for external calls before state updates
    const reentrancyPatterns = [
      /invoke\s*\([^)]*\)[\s\S]*?(?=\w+\s*=|\w+\.\w+\s*=)/g,
      /cross_program_invocation[\s\S]*?(?=\w+\s*=|\w+\.\w+\s*=)/g,
      /solana_program::program::invoke[\s\S]*?(?=\w+\s*=|\w+\.\w+\s*=)/g,
    ];

    reentrancyPatterns.forEach((pattern, index) => {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        vulnerabilities.push({
          type: 'REENTRANCY',
          severity: 'CRITICAL',
          description:
            'Potential reentrancy vulnerability detected - external call made before state update',
          location: `Pattern ${index + 1} found in code`,
          recommendation:
            'Use checks-effects-interactions pattern: update state before external calls',
          cweId: 'CWE-362',
        });
      }
    });

    return vulnerabilities;
  }

  private detectIntegerOverflow(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Look for arithmetic operations without safe math
    const overflowPatterns = [
      /\w+\s*\+\s*\w+(?!\s*\.checked_)/g,
      /\w+\s*\-\s*\w+(?!\s*\.checked_)/g,
      /\w+\s*\*\s*\w+(?!\s*\.checked_)/g,
      /\w+\s*\/\s*\w+(?!\s*\.checked_)/g,
    ];

    overflowPatterns.forEach((pattern, index) => {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        vulnerabilities.push({
          type: 'INTEGER_OVERFLOW',
          severity: 'HIGH',
          description: 'Arithmetic operations without overflow protection detected',
          location: `${matches.length} unsafe operations found`,
          recommendation: 'Use checked arithmetic methods (.checked_add(), .checked_sub(), etc.)',
          cweId: 'CWE-190',
        });
      }
    });

    return vulnerabilities;
  }

  private detectMissingSignerChecks(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Look for functions that modify state without signer checks
    const signerPatterns = [
      /fn\s+\w+[^{]*{[^}]*(?:transfer|mint|burn|close)[^}]*}(?![^{]*is_signer)/g,
      /AccountInfo[^{]*{[^}]*(?:transfer|mint|burn)[^}]*}(?![^{]*is_signer)/g,
    ];

    signerPatterns.forEach((pattern, index) => {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        vulnerabilities.push({
          type: 'MISSING_SIGNER_CHECK',
          severity: 'CRITICAL',
          description:
            'Functions performing sensitive operations without proper signer verification',
          location: `${matches.length} functions missing signer checks`,
          recommendation: 'Add is_signer checks for all accounts performing sensitive operations',
          cweId: 'CWE-306',
        });
      }
    });

    return vulnerabilities;
  }

  private detectAccessControlIssues(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Look for missing ownership checks
    const accessPatterns = [
      /AccountInfo.*owner(?![^{]*==.*expected_owner)/g,
      /fn\s+\w+[^{]*{[^}]*(?:authority|admin|owner)[^}]*}(?![^{]*==)/g,
    ];

    accessPatterns.forEach((pattern, index) => {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        vulnerabilities.push({
          type: 'ACCESS_CONTROL',
          severity: 'HIGH',
          description: 'Insufficient access control - missing ownership or authority checks',
          location: `Pattern ${index + 1} detected`,
          recommendation: 'Implement proper ownership verification for privileged operations',
          cweId: 'CWE-284',
        });
      }
    });

    return vulnerabilities;
  }

  private detectDeserializationErrors(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Look for unsafe deserialization
    const deserializationPatterns = [
      /from_account_info.*unwrap\(\)/g,
      /try_from_slice.*unwrap\(\)/g,
      /deserialize.*unwrap\(\)/g,
    ];

    deserializationPatterns.forEach((pattern, index) => {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        vulnerabilities.push({
          type: 'DESERIALIZATION_ERROR',
          severity: 'MEDIUM',
          description:
            'Unsafe deserialization detected - using unwrap() without proper error handling',
          location: `${matches.length} unsafe deserializations found`,
          recommendation: 'Use proper error handling instead of unwrap() for deserialization',
          cweId: 'CWE-502',
        });
      }
    });

    return vulnerabilities;
  }

  private detectUninitializedAccounts(code: string): SecurityVulnerability[] {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Look for operations on potentially uninitialized accounts
    const uninitializedPatterns = [
      /AccountInfo.*data(?![^{]*is_initialized)/g,
      /from_account_info(?![^{]*initialized)/g,
    ];

    uninitializedPatterns.forEach((pattern, index) => {
      const matches = code.match(pattern);
      if (matches && matches.length > 0) {
        vulnerabilities.push({
          type: 'UNINITIALIZED_ACCOUNT',
          severity: 'MEDIUM',
          description: 'Operations on potentially uninitialized accounts detected',
          location: `Pattern ${index + 1} found`,
          recommendation: 'Always check account initialization status before operations',
          cweId: 'CWE-665',
        });
      }
    });

    return vulnerabilities;
  }

  private async performHeuristicAnalysis(
    programId: string,
    accountInfo: any
  ): Promise<SecurityVulnerability[]> {
    const vulnerabilities: SecurityVulnerability[] = [];

    // Without source code, we can only do behavioral analysis
    vulnerabilities.push({
      type: 'ACCESS_CONTROL',
      severity: 'MEDIUM',
      description:
        'Source code not available for static analysis - security cannot be fully verified',
      recommendation: 'Request source code verification from program developers',
      cweId: 'CWE-656',
    });

    return vulnerabilities;
  }

  private async tryGitHubSource(
    programId: string
  ): Promise<{ found: boolean; code?: string; metrics?: any }> {
    // This would implement GitHub API search for program source code
    // For now, return not found
    return { found: false };
  }

  private async analyzeProgramHistory(
    programId: string
  ): Promise<{ ageInDays: number; hasRecentUpgrades: boolean }> {
    // Simplified program history analysis
    return {
      ageInDays: 30, // Default to 30 days
      hasRecentUpgrades: false,
    };
  }

  private calculateSecurityScore(vulnerabilities: SecurityVulnerability[]): number {
    let score = 100;

    vulnerabilities.forEach((vuln) => {
      switch (vuln.severity) {
        case 'CRITICAL':
          score -= 25;
          break;
        case 'HIGH':
          score -= 15;
          break;
        case 'MEDIUM':
          score -= 8;
          break;
        case 'LOW':
          score -= 3;
          break;
      }
    });

    return Math.max(0, score);
  }

  private determineRiskLevel(
    score: number,
    vulnerabilities: SecurityVulnerability[]
  ): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    const hasCritical = vulnerabilities.some((v) => v.severity === 'CRITICAL');
    const hasHigh = vulnerabilities.some((v) => v.severity === 'HIGH');

    if (hasCritical || score < 30) {
      return 'CRITICAL';
    }
    if (hasHigh || score < 50) {
      return 'HIGH';
    }
    if (score < 70) {
      return 'MEDIUM';
    }
    return 'LOW';
  }
}
