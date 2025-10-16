import { morpheus } from '@/lib/openai';

export interface TokenDistribution {
  category: string;
  percentage: number;
  amount: number;
  vestingSchedule: string;
  description: string;
  color?: string;
}

export interface VestingDataPoint {
  month: number;
  [key: string]: number; // Dynamic keys for each category
}

export interface StakingTier {
  period: string;
  apy: number;
  lockDays: number;
}

export interface BurnProjection {
  quarter: string;
  supply: number;
  burned: number;
  circulatingSupply: number;
}

export interface TokenomicsChartData {
  distribution: TokenDistribution[];
  vestingTimeline: VestingDataPoint[];
  stakingTiers: StakingTier[];
  burnProjections: BurnProjection[];
}

/**
 * Generate comprehensive tokenomics for a Solana project
 */
export async function generateTokenomics(projectDetails: {
  name: string;
  description: string;
  useCase: string;
  targetMarket?: string;
  totalSupply?: number;
}): Promise<{
  tokenomics: {
    totalSupply: number;
    distribution: TokenDistribution[];
    utilities: string[];
    governance: string;
    staking: {
      enabled: boolean;
      apy: string;
      lockPeriods: string[];
    };
    deflationary: {
      enabled: boolean;
      burnMechanism: string;
      burnRate: string;
    };
  };
  analysis: string;
  risks: string[];
  recommendations: string[];
  chartData: TokenomicsChartData;
}> {
  console.log(`🪙 Generating tokenomics for: ${projectDetails.name}`);

  try {
    const prompt = `You are an expert tokenomics designer for Solana projects. Generate comprehensive tokenomics for the following project:

Project Name: ${projectDetails.name}
Description: ${projectDetails.description}
Use Case: ${projectDetails.useCase}
Target Market: ${projectDetails.targetMarket || 'General Web3 users'}
Preferred Total Supply: ${projectDetails.totalSupply || 'Suggest optimal amount'}

Generate a detailed tokenomics structure including:

1. TOTAL SUPPLY & DISTRIBUTION
- Optimal total supply with reasoning
- Detailed allocation breakdown (Team, Community, Treasury, Liquidity, etc.)
- Vesting schedules for each category
- Clear rationale for each allocation

2. TOKEN UTILITIES
- Primary use cases within the ecosystem
- Governance rights and voting mechanisms
- Staking rewards and incentives
- Fee structures and discounts

3. ECONOMIC MECHANISMS
- Inflation/deflation mechanisms
- Burn mechanisms if applicable
- Staking rewards structure
- Liquidity incentives

4. GOVERNANCE STRUCTURE
- Voting power distribution
- Proposal mechanisms
- Implementation timelines

5. RISK ANALYSIS
- Potential economic risks
- Mitigation strategies
- Market dynamics considerations

6. LAUNCH STRATEGY
- Initial distribution method
- Liquidity provision strategy
- Community incentives

Respond in JSON format with structured data that can be easily parsed and displayed.`;

    console.log('🤖 Calling Morpheus API for tokenomics generation...');
    console.log('Model:', process.env.MORPHEUS_MODEL_ID || 'mistral-31-24b');

    const response = await morpheus.chat.completions.create({
      model: process.env.MORPHEUS_MODEL_ID || 'mistral-31-24b',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const content = response.choices[0].message.content;
    console.log('📝 Morpheus response:', content?.substring(0, 200) + '...');

    if (!content) {
      console.error('❌ No response from Morpheus API');
      throw new Error('No response from Morpheus API');
    }

    // Try to parse JSON response
    let tokenomicsData;
    try {
      tokenomicsData = JSON.parse(content);
    } catch {
      // If not JSON, structure the response manually
      tokenomicsData = {
        tokenomics: {
          totalSupply: projectDetails.totalSupply || 1000000000,
          distribution: [
            {
              category: 'Community',
              percentage: 40,
              amount: 400000000,
              vestingSchedule: 'No vesting',
              description: 'Community rewards and airdrops',
            },
            {
              category: 'Team',
              percentage: 20,
              amount: 200000000,
              vestingSchedule: '4 years linear',
              description: 'Core team allocation',
            },
            {
              category: 'Treasury',
              percentage: 25,
              amount: 250000000,
              vestingSchedule: 'Controlled release',
              description: 'Development and operations',
            },
            {
              category: 'Liquidity',
              percentage: 15,
              amount: 150000000,
              vestingSchedule: 'Immediate',
              description: 'DEX liquidity provision',
            },
          ],
          utilities: ['Governance voting', 'Staking rewards', 'Fee discounts', 'Platform access'],
          governance: 'Token holders vote on protocol upgrades and treasury allocation',
          staking: {
            enabled: true,
            apy: '8-15% APY',
            lockPeriods: ['30 days', '90 days', '1 year'],
          },
          deflationary: {
            enabled: true,
            burnMechanism: 'Transaction fee burns',
            burnRate: '2% of fees burned quarterly',
          },
        },
        analysis: content,
        risks: ['Market volatility', 'Regulatory changes', 'Competition'],
        recommendations: [
          'Gradual token release',
          'Strong community engagement',
          'Clear utility implementation',
        ],
      };
    }

    // Generate chart data from tokenomics
    const chartData = generateChartData(tokenomicsData.tokenomics);

    return {
      ...tokenomicsData,
      chartData,
    };
  } catch (error) {
    console.error('Tokenomics generation failed:', error);

    // Fallback tokenomics structure
    return {
      tokenomics: {
        totalSupply: projectDetails.totalSupply || 1000000000,
        distribution: [
          {
            category: 'Community',
            percentage: 40,
            amount: (projectDetails.totalSupply || 1000000000) * 0.4,
            vestingSchedule: 'No vesting',
            description: 'Community rewards and airdrops',
          },
          {
            category: 'Team',
            percentage: 20,
            amount: (projectDetails.totalSupply || 1000000000) * 0.2,
            vestingSchedule: '4 years linear',
            description: 'Core team allocation',
          },
          {
            category: 'Treasury',
            percentage: 25,
            amount: (projectDetails.totalSupply || 1000000000) * 0.25,
            vestingSchedule: 'Controlled release',
            description: 'Development and operations',
          },
          {
            category: 'Liquidity',
            percentage: 15,
            amount: (projectDetails.totalSupply || 1000000000) * 0.15,
            vestingSchedule: 'Immediate',
            description: 'DEX liquidity provision',
          },
        ],
        utilities: ['Governance voting', 'Staking rewards', 'Fee discounts'],
        governance: 'Token-based governance with proposal and voting mechanisms',
        staking: {
          enabled: true,
          apy: '8-12% APY',
          lockPeriods: ['30 days', '90 days', '1 year'],
        },
        deflationary: {
          enabled: true,
          burnMechanism: 'Transaction fee burns',
          burnRate: '2% of transaction fees',
        },
      },
      analysis: `Generated fallback tokenomics for ${projectDetails.name}. This is a standard Web3 tokenomics structure with community focus.`,
      risks: ['Market volatility', 'Regulatory uncertainty', 'Token distribution concentration'],
      recommendations: [
        'Implement gradual vesting',
        'Build strong utility',
        'Engage community early',
      ],
      chartData: generateChartData({
        totalSupply: projectDetails.totalSupply || 1000000000,
        distribution: [
          {
            category: 'Community',
            percentage: 40,
            amount: (projectDetails.totalSupply || 1000000000) * 0.4,
            vestingSchedule: 'No vesting',
            description: 'Community rewards and airdrops',
          },
          {
            category: 'Team',
            percentage: 20,
            amount: (projectDetails.totalSupply || 1000000000) * 0.2,
            vestingSchedule: '4 years linear',
            description: 'Core team allocation',
          },
          {
            category: 'Treasury',
            percentage: 25,
            amount: (projectDetails.totalSupply || 1000000000) * 0.25,
            vestingSchedule: 'Controlled release',
            description: 'Development and operations',
          },
          {
            category: 'Liquidity',
            percentage: 15,
            amount: (projectDetails.totalSupply || 1000000000) * 0.15,
            vestingSchedule: 'Immediate',
            description: 'DEX liquidity provision',
          },
        ],
        utilities: ['Governance voting', 'Staking rewards', 'Fee discounts'],
        governance: 'Token-based governance with proposal and voting mechanisms',
        staking: {
          enabled: true,
          apy: '8-12% APY',
          lockPeriods: ['30 days', '90 days', '1 year'],
        },
        deflationary: {
          enabled: true,
          burnMechanism: 'Transaction fee burns',
          burnRate: '2% of transaction fees',
        },
      }),
    };
  }
}

/**
 * Generate chart-ready data from tokenomics structure
 */
function generateChartData(tokenomics: any): TokenomicsChartData {
  const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

  // 1. Distribution data with colors
  const distribution: TokenDistribution[] = tokenomics.distribution.map(
    (item: any, index: number) => ({
      ...item,
      color: colors[index % colors.length],
    })
  );

  // 2. Vesting timeline (48 months)
  const vestingTimeline: VestingDataPoint[] = [];
  for (let month = 0; month <= 48; month++) {
    const dataPoint: VestingDataPoint = { month };

    tokenomics.distribution.forEach((dist: TokenDistribution) => {
      const schedule = dist.vestingSchedule.toLowerCase();
      let vestedAmount = 0;

      if (schedule.includes('no vesting') || schedule.includes('immediate')) {
        vestedAmount = dist.amount;
      } else if (schedule.includes('4 years') || schedule.includes('48 months')) {
        vestedAmount = (dist.amount / 48) * month;
      } else if (schedule.includes('2 years') || schedule.includes('24 months')) {
        vestedAmount = month <= 24 ? (dist.amount / 24) * month : dist.amount;
      } else if (schedule.includes('1 year') || schedule.includes('12 months')) {
        vestedAmount = month <= 12 ? (dist.amount / 12) * month : dist.amount;
      } else if (schedule.includes('controlled')) {
        // Gradual release over 36 months
        vestedAmount = month <= 36 ? (dist.amount / 36) * month : dist.amount;
      } else {
        // Default to linear over 24 months
        vestedAmount = month <= 24 ? (dist.amount / 24) * month : dist.amount;
      }

      dataPoint[dist.category] = Math.round(vestedAmount);
    });

    vestingTimeline.push(dataPoint);
  }

  // 3. Staking tiers
  const stakingTiers: StakingTier[] = [];
  if (tokenomics.staking?.enabled && tokenomics.staking.lockPeriods) {
    tokenomics.staking.lockPeriods.forEach((period: string, index: number) => {
      const days = parseLockPeriod(period);
      const baseAPY = parseAPY(tokenomics.staking.apy);
      const apy = baseAPY + index * 2; // Higher APY for longer locks

      stakingTiers.push({
        period,
        apy,
        lockDays: days,
      });
    });
  }

  // 4. Burn projections (8 quarters)
  const burnProjections: BurnProjection[] = [];
  const totalSupply = tokenomics.totalSupply;
  const burnRate = parseBurnRate(tokenomics.deflationary?.burnRate || '0%');

  for (let quarter = 0; quarter <= 8; quarter++) {
    const burned = totalSupply * (burnRate / 100) * quarter;
    const circulatingSupply = totalSupply - burned;

    burnProjections.push({
      quarter: `Q${quarter}`,
      supply: totalSupply,
      burned: Math.round(burned),
      circulatingSupply: Math.round(circulatingSupply),
    });
  }

  return {
    distribution,
    vestingTimeline,
    stakingTiers,
    burnProjections,
  };
}

/**
 * Parse lock period string to days
 */
function parseLockPeriod(period: string): number {
  const lower = period.toLowerCase();
  if (lower.includes('30 days') || lower.includes('1 month')) {
    return 30;
  }
  if (lower.includes('90 days') || lower.includes('3 months')) {
    return 90;
  }
  if (lower.includes('180 days') || lower.includes('6 months')) {
    return 180;
  }
  if (lower.includes('1 year') || lower.includes('365 days')) {
    return 365;
  }
  return 30; // default
}

/**
 * Parse APY string to number
 */
function parseAPY(apy: string): number {
  const match = apy.match(/(\d+)/);
  return match ? parseInt(match[1]) : 10;
}

/**
 * Parse burn rate string to percentage
 */
function parseBurnRate(rate: string): number {
  const match = rate.match(/(\d+\.?\d*)/);
  return match ? parseFloat(match[1]) : 2;
}

/**
 * Analyze existing tokenomics for potential improvements
 */
export async function analyzeTokenomics(tokenAddress: string): Promise<{
  analysis: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  riskScore: number;
}> {
  console.log(`📊 Analyzing tokenomics for: ${tokenAddress}`);

  try {
    // This would integrate with your existing token analysis tools
    // For now, return a structured analysis
    return {
      analysis: 'Tokenomics analysis requires integration with on-chain data and market metrics.',
      strengths: ['Decentralized distribution', 'Clear utility'],
      weaknesses: ['High concentration risk', 'Limited burn mechanisms'],
      recommendations: [
        'Implement staking rewards',
        'Add deflationary mechanisms',
        'Improve governance',
      ],
      riskScore: 6.5,
    };
  } catch (error) {
    console.error('Tokenomics analysis failed:', error);
    throw error;
  }
}
