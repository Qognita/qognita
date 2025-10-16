import { getTokenInfo, getTokenHolders } from './solana-tools';

/**
 * Check for common honeypot and rug pull patterns in a Solana token
 */
export async function checkForHoneypotPatterns(address: string): Promise<{
  isHoneypot: boolean;
  riskScore: number;
  riskFactors: Array<{
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    message: string;
    impact: string;
  }>;
  summary: string;
}> {
  console.log(`🔍 Checking for honeypot patterns on token: ${address}`);

  const riskFactors: Array<{
    level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
    message: string;
    impact: string;
  }> = [];

  try {
    // Get token information
    const tokenInfo = await getTokenInfo(address);

    // Check 1: Mint Authority Still Active
    if (tokenInfo.mintAuthority && tokenInfo.mintAuthority !== '11111111111111111111111111111111') {
      riskFactors.push({
        level: 'CRITICAL',
        category: 'Mint Authority',
        message: 'Mint authority is still active',
        impact:
          'The creator can mint unlimited new tokens at any time, potentially devaluing your holdings to zero',
      });
    }

    // Check 2: Freeze Authority Still Active
    if (
      tokenInfo.freezeAuthority &&
      tokenInfo.freezeAuthority !== '11111111111111111111111111111111'
    ) {
      riskFactors.push({
        level: 'CRITICAL',
        category: 'Freeze Authority',
        message: 'Freeze authority is still active',
        impact:
          'The creator can freeze your tokens, making them completely unsellable and untransferable',
      });
    }

    // Check 3: Very Low Liquidity
    const liquidity = tokenInfo.marketData?.liquidity;
    if (liquidity && liquidity < 10000) {
      riskFactors.push({
        level: 'HIGH',
        category: 'Liquidity Risk',
        message: `Very low liquidity: $${liquidity.toLocaleString()}`,
        impact:
          'Low liquidity makes it difficult to sell tokens and increases price manipulation risk',
      });
    }

    // Check 4: Suspicious Supply
    if (tokenInfo.supply) {
      const supply = tokenInfo.supply;
      // Check for round numbers that might indicate lazy tokenomics
      if (supply === 1000000000 || supply === 100000000000 || supply.toString().match(/^10+$/)) {
        riskFactors.push({
          level: 'MEDIUM',
          category: 'Tokenomics',
          message: 'Suspicious round number total supply',
          impact: 'May indicate rushed or low-effort tokenomics design',
        });
      }
    }

    // Check 5: High Concentration (if we can get holder data)
    try {
      const holdersData = await getTokenHolders(address, 10);
      if (holdersData && Array.isArray(holdersData.holders) && holdersData.holders.length > 0) {
        const totalSupply = tokenInfo.supply || 0;
        const top10Holdings = holdersData.holders
          .slice(0, 10)
          .reduce((sum: number, holder: any) => sum + (holder.amount || 0), 0);
        const concentration = totalSupply > 0 ? (top10Holdings / totalSupply) * 100 : 0;

        if (concentration > 80) {
          riskFactors.push({
            level: 'HIGH',
            category: 'Concentration Risk',
            message: `Top 10 holders control ${concentration.toFixed(1)}% of supply`,
            impact: 'High concentration increases risk of coordinated dumps and price manipulation',
          });
        } else if (concentration > 60) {
          riskFactors.push({
            level: 'MEDIUM',
            category: 'Concentration Risk',
            message: `Top 10 holders control ${concentration.toFixed(1)}% of supply`,
            impact: 'Moderate concentration risk - watch for large holder movements',
          });
        }
      }
    } catch (error) {
      console.log('Could not analyze holder concentration:', error);
    }

    // Check 6: Recent Creation with High Price Movement
    const priceChange24h = tokenInfo.marketData?.priceChange24h;
    if (priceChange24h && Math.abs(priceChange24h) > 500) {
      riskFactors.push({
        level: 'HIGH',
        category: 'Price Volatility',
        message: `Extreme 24h price change: ${priceChange24h > 0 ? '+' : ''}${priceChange24h}%`,
        impact: 'Extreme price movements may indicate pump and dump activity',
      });
    }

    // Calculate overall risk score
    let riskScore = 0;
    riskFactors.forEach((factor) => {
      switch (factor.level) {
        case 'CRITICAL':
          riskScore += 4;
          break;
        case 'HIGH':
          riskScore += 3;
          break;
        case 'MEDIUM':
          riskScore += 2;
          break;
        case 'LOW':
          riskScore += 1;
          break;
      }
    });

    // Normalize to 0-10 scale
    const normalizedRiskScore = Math.min(10, riskScore);
    const isHoneypot = normalizedRiskScore >= 6;

    // Generate summary
    let summary = '';
    if (riskFactors.length === 0) {
      summary =
        'No obvious honeypot patterns detected. However, always do your own research before investing.';
    } else {
      const criticalCount = riskFactors.filter((f) => f.level === 'CRITICAL').length;
      const highCount = riskFactors.filter((f) => f.level === 'HIGH').length;

      if (criticalCount > 0) {
        summary = `⚠️ CRITICAL RISKS DETECTED: This token has ${criticalCount} critical risk factor(s) and ${highCount} high risk factor(s). Exercise extreme caution.`;
      } else if (highCount > 0) {
        summary = `⚠️ HIGH RISKS DETECTED: This token has ${highCount} high risk factor(s). Proceed with caution and only invest what you can afford to lose.`;
      } else {
        summary = `⚠️ MODERATE RISKS: This token has some risk factors but no critical issues. Still recommend caution and research.`;
      }
    }

    return {
      isHoneypot,
      riskScore: normalizedRiskScore,
      riskFactors,
      summary,
    };
  } catch (error) {
    console.error('Error analyzing honeypot patterns:', error);

    return {
      isHoneypot: false,
      riskScore: 0,
      riskFactors: [
        {
          level: 'MEDIUM',
          category: 'Analysis Error',
          message: 'Could not complete full security analysis',
          impact: 'Unable to verify all security aspects - proceed with extra caution',
        },
      ],
      summary:
        'Security analysis incomplete due to technical issues. Please verify token safety through other means.',
    };
  }
}

/**
 * Quick security check for a token address
 */
export async function quickSecurityCheck(address: string): Promise<{
  isSafe: boolean;
  warnings: string[];
  recommendations: string[];
}> {
  try {
    const tokenInfo = await getTokenInfo(address);
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Quick checks
    if (tokenInfo.mintAuthority && tokenInfo.mintAuthority !== '11111111111111111111111111111111') {
      warnings.push('Mint authority is still active - creator can mint new tokens');
    }

    if (
      tokenInfo.freezeAuthority &&
      tokenInfo.freezeAuthority !== '11111111111111111111111111111111'
    ) {
      warnings.push('Freeze authority is still active - creator can freeze your tokens');
    }

    const liquidity = tokenInfo.marketData?.liquidity;
    if (liquidity && liquidity < 5000) {
      warnings.push('Very low liquidity - may be difficult to sell');
    }

    // Recommendations
    if (warnings.length > 0) {
      recommendations.push('Research the project team and roadmap thoroughly');
      recommendations.push('Only invest amounts you can afford to lose completely');
      recommendations.push('Consider waiting for authorities to be revoked');
    }

    return {
      isSafe: warnings.length === 0,
      warnings,
      recommendations,
    };
  } catch (error) {
    return {
      isSafe: false,
      warnings: ['Could not analyze token security'],
      recommendations: ['Verify token safety through other tools before investing'],
    };
  }
}
