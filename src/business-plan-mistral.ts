import { MistralAPI, getMistralAPI } from './mistral.js';

export interface BusinessPlanData {
  businessName: string;
  businessIdea: string;
  targetCustomers: string;
  marketingChannels: string;
  businessStage: string;
  investment: string;
  teamStructure: string;
  location: string;
  needsFunding: string;
  fundingTypes?: string[];
}

export interface EconomicData {
  gdpGrowth: number;
  inflationRate: number;
  unemploymentRate: number;
  wageGrowth: number;
  employmentGrowth: number;
  industryData?: any;
}

export class BusinessPlanMistralAPI {
  private mistralAPI: MistralAPI;

  constructor(apiKey: string) {
    this.mistralAPI = getMistralAPI(apiKey);
  }

  /**
   * Generate strategic executive summary using Mistral AI
   */
  async generateExecutiveSummary(
    businessData: BusinessPlanData,
    economicData: EconomicData
  ): Promise<string> {
    const prompt = this.createExecutiveSummaryPrompt(businessData, economicData);
    
    const response = await this.mistralAPI.chatCompletion(prompt, {
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate market analysis with real economic data
   */
  async generateMarketAnalysis(
    businessData: BusinessPlanData,
    economicData: EconomicData,
    marketData?: any
  ): Promise<string> {
    const prompt = this.createMarketAnalysisPrompt(businessData, economicData, marketData);
    
    const response = await this.mistralAPI.chatCompletion(prompt, {
      temperature: 0.6,
      max_tokens: 2500
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate financial projections with sophisticated calculations
   */
  async generateFinancialProjections(
    businessData: BusinessPlanData,
    economicData: EconomicData,
    projectionYears: number = 5
  ): Promise<string> {
    const prompt = this.createFinancialProjectionsPrompt(businessData, economicData, projectionYears);
    
    const response = await this.mistralAPI.chatCompletion(prompt, {
      temperature: 0.4, // Lower temperature for more precise financial calculations
      max_tokens: 3000
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate competitive analysis
   */
  async generateCompetitiveAnalysis(
    businessData: BusinessPlanData,
    competitors: any[]
  ): Promise<string> {
    const prompt = this.createCompetitiveAnalysisPrompt(businessData, competitors);
    
    const response = await this.mistralAPI.chatCompletion(prompt, {
      temperature: 0.6,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate marketing strategy
   */
  async generateMarketingStrategy(
    businessData: BusinessPlanData,
    economicData: EconomicData
  ): Promise<string> {
    const prompt = this.createMarketingStrategyPrompt(businessData, economicData);
    
    const response = await this.mistralAPI.chatCompletion(prompt, {
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  }

  /**
   * Generate risk analysis with real economic scenarios
   */
  async generateRiskAnalysis(
    businessData: BusinessPlanData,
    economicData: EconomicData
  ): Promise<string> {
    const prompt = this.createRiskAnalysisPrompt(businessData, economicData);
    
    const response = await this.mistralAPI.chatCompletion(prompt, {
      temperature: 0.5,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  }

  /**
   * Search for real funding opportunities
   */
  async searchFundingOpportunities(
    businessData: BusinessPlanData,
    fundingTypes: string[],
    location: string
  ): Promise<any> {
    const prompt = this.createFundingSearchPrompt(businessData, fundingTypes, location);
    
    const response = await this.mistralAPI.chatCompletion(prompt, {
      temperature: 0.3, // Very precise for factual information
      max_tokens: 2000
    });

    return {
      fundingOpportunities: response.choices[0].message.content,
      location,
      businessType: businessData.businessIdea,
      fundingTypesSearched: fundingTypes,
      searchDate: new Date().toISOString()
    };
  }

  // ========================================
  // PROMPT CREATION METHODS
  // ========================================

  private createExecutiveSummaryPrompt(
    businessData: BusinessPlanData,
    economicData: EconomicData
  ): Array<{ role: string; content: string }> {
    return [
      {
        role: "system",
        content: `You are a senior business consultant and strategic advisor with 20+ years of experience helping entrepreneurs create successful business plans. You specialize in creating compelling executive summaries that attract investors and guide strategic decision-making.

Your task is to create a professional, strategic executive summary that:
1. Clearly articulates the business opportunity and value proposition
2. Incorporates real economic data and market conditions
3. Provides specific, actionable insights rather than generic statements
4. Demonstrates deep understanding of the industry and market dynamics
5. Includes realistic financial projections based on current economic conditions

Use a professional, confident tone that inspires confidence while being realistic about challenges and opportunities.`
      },
      {
        role: "user",
        content: `Create a strategic executive summary for the following business:

**Business Information:**
- Company: ${businessData.businessName}
- Business Concept: ${businessData.businessIdea}
- Target Market: ${businessData.targetCustomers}
- Location: ${businessData.location}
- Investment: ${businessData.investment}
- Business Stage: ${businessData.businessStage}
- Team: ${businessData.teamStructure}

**Current Economic Conditions:**
- GDP Growth: ${economicData.gdpGrowth}%
- Inflation Rate: ${economicData.inflationRate}%
- Unemployment Rate: ${economicData.unemploymentRate}%
- Wage Growth: ${economicData.wageGrowth}%
- Employment Growth: ${economicData.employmentGrowth}%

**Requirements:**
1. Write a compelling business overview that clearly explains what the business does and why it matters
2. Analyze the market opportunity in the context of current economic conditions
3. Explain how economic factors (GDP growth, inflation, employment trends) impact this specific business
4. Provide realistic financial highlights based on the investment amount and economic conditions
5. Identify key success factors and competitive advantages
6. Address potential risks and mitigation strategies
7. Keep the tone professional and investor-ready

Focus on strategic insights rather than generic business plan language. Make specific references to the economic data provided.`
      }
    ];
  }

  private createMarketAnalysisPrompt(
    businessData: BusinessPlanData,
    economicData: EconomicData,
    marketData?: any
  ): Array<{ role: string; content: string }> {
    return [
      {
        role: "system",
        content: `You are a market research analyst and business strategist with expertise in economic analysis and market sizing. Your role is to provide data-driven market analysis that helps businesses understand their competitive landscape and growth opportunities.

Create a comprehensive market analysis that:
1. Analyzes the industry in the context of current economic conditions
2. Provides realistic market sizing and growth projections
3. Identifies key market trends and their business implications
4. Explains how economic factors affect customer behavior and market dynamics
5. Offers strategic recommendations based on market conditions`
      },
      {
        role: "user",
        content: `Analyze the market for this business using current economic data:

**Business Details:**
- Business: ${businessData.businessIdea}
- Target Customers: ${businessData.targetCustomers}
- Location: ${businessData.location}
- Marketing Channels: ${businessData.marketingChannels}

**Economic Context:**
- GDP Growth: ${economicData.gdpGrowth}% (${economicData.gdpGrowth > 3 ? 'Strong' : economicData.gdpGrowth > 2 ? 'Moderate' : 'Weak'} growth)
- Inflation: ${economicData.inflationRate}% (${economicData.inflationRate > 4 ? 'High' : economicData.inflationRate < 2 ? 'Low' : 'Moderate'})
- Unemployment: ${economicData.unemploymentRate}% (${economicData.unemploymentRate < 4 ? 'Low' : economicData.unemploymentRate > 6 ? 'High' : 'Moderate'})
- Wage Growth: ${economicData.wageGrowth}%
- Employment Growth: ${economicData.employmentGrowth}%

**Analysis Requirements:**
1. Industry overview with economic impact assessment
2. Target market analysis considering current economic conditions
3. Market size estimation and growth projections
4. Economic factors affecting customer purchasing power and behavior
5. Competitive landscape analysis
6. Market trends and opportunities
7. Strategic recommendations for market entry/expansion

Provide specific, actionable insights based on the economic data. Explain how each economic indicator affects this particular business and market.`
      }
    ];
  }

  private createFinancialProjectionsPrompt(
    businessData: BusinessPlanData,
    economicData: EconomicData,
    projectionYears: number
  ): Array<{ role: string; content: string }> {
    return [
      {
        role: "system",
        content: `You are a financial analyst and business planning expert specializing in creating realistic financial projections. You understand how macroeconomic conditions affect business performance and can create sophisticated financial models.

Your task is to create detailed financial projections that:
1. Incorporate real economic data into revenue and cost projections
2. Provide realistic growth assumptions based on economic conditions
3. Include detailed break-even analysis
4. Calculate key financial metrics (CAC, LTV, margins, ROI)
5. Provide scenario analysis (optimistic, realistic, pessimistic)
6. Explain the reasoning behind all assumptions`
      },
      {
        role: "user",
        content: `Create detailed ${projectionYears}-year financial projections for:

**Business:**
- ${businessData.businessName}: ${businessData.businessIdea}
- Initial Investment: ${businessData.investment}
- Target Market: ${businessData.targetCustomers}
- Location: ${businessData.location}

**Economic Environment:**
- GDP Growth: ${economicData.gdpGrowth}% (affects overall market demand)
- Inflation: ${economicData.inflationRate}% (affects costs and pricing)
- Unemployment: ${economicData.unemploymentRate}% (affects consumer spending)
- Wage Growth: ${economicData.wageGrowth}% (affects customer purchasing power)

**Required Analysis:**
1. Revenue projections with economic adjustments
2. Cost structure analysis with inflation impact
3. Break-even analysis and timeline
4. Customer acquisition cost (CAC) calculations
5. Customer lifetime value (LTV) projections
6. Profit margin analysis
7. Cash flow projections
8. Key financial ratios and metrics
9. Scenario analysis (best/realistic/worst case)
10. Economic sensitivity analysis

Provide specific numbers, calculations, and detailed explanations for all assumptions. Show how economic factors influence each projection.`
      }
    ];
  }

  private createCompetitiveAnalysisPrompt(
    businessData: BusinessPlanData,
    competitors: any[]
  ): Array<{ role: string; content: string }> {
    return [
      {
        role: "system",
        content: `You are a competitive intelligence analyst with expertise in market positioning and strategic analysis. Create a comprehensive competitive analysis that identifies opportunities for differentiation and market positioning.`
      },
      {
        role: "user",
        content: `Analyze the competitive landscape for ${businessData.businessName} (${businessData.businessIdea}) targeting ${businessData.targetCustomers}.

**Competitor Information:**
${competitors.map((comp, i) => `${i + 1}. ${comp.name || 'Competitor'}: ${comp.description || 'No description available'}`).join('\n')}

**Analysis Requirements:**
1. Direct and indirect competitor analysis
2. Competitive positioning map
3. Strengths and weaknesses assessment
4. Market share analysis
5. Pricing strategy comparison
6. Differentiation opportunities
7. Competitive advantages and threats
8. Strategic recommendations for market positioning

Provide actionable insights for competitive advantage.`
      }
    ];
  }

  private createMarketingStrategyPrompt(
    businessData: BusinessPlanData,
    economicData: EconomicData
  ): Array<{ role: string; content: string }> {
    return [
      {
        role: "system",
        content: `You are a marketing strategist with expertise in customer acquisition and brand positioning. Create a comprehensive marketing strategy that considers economic conditions and customer behavior.`
      },
      {
        role: "user",
        content: `Develop a marketing strategy for ${businessData.businessName}:

**Business Details:**
- Product/Service: ${businessData.businessIdea}
- Target Customers: ${businessData.targetCustomers}
- Preferred Channels: ${businessData.marketingChannels}
- Location: ${businessData.location}
- Investment: ${businessData.investment}

**Economic Context:**
- Consumer spending affected by ${economicData.unemploymentRate}% unemployment
- Purchasing power influenced by ${economicData.wageGrowth}% wage growth
- Economic confidence: ${economicData.gdpGrowth > 3 ? 'High' : economicData.gdpGrowth > 2 ? 'Moderate' : 'Low'}

**Strategy Requirements:**
1. Target audience segmentation and personas
2. Brand positioning and value proposition
3. Marketing channel strategy and budget allocation
4. Customer acquisition strategy with CAC targets
5. Content marketing and messaging strategy
6. Digital marketing tactics
7. Traditional marketing approaches
8. Marketing metrics and KPIs
9. Economic-adjusted marketing budget recommendations

Consider how economic conditions affect marketing effectiveness and customer behavior.`
      }
    ];
  }

  private createRiskAnalysisPrompt(
    businessData: BusinessPlanData,
    economicData: EconomicData
  ): Array<{ role: string; content: string }> {
    return [
      {
        role: "system",
        content: `You are a risk management consultant specializing in business risk assessment and mitigation strategies. Analyze potential risks and provide practical mitigation strategies.`
      },
      {
        role: "user",
        content: `Conduct a comprehensive risk analysis for ${businessData.businessName}:

**Business Context:**
- Business: ${businessData.businessIdea}
- Investment: ${businessData.investment}
- Stage: ${businessData.businessStage}
- Location: ${businessData.location}

**Economic Risk Factors:**
- GDP Growth: ${economicData.gdpGrowth}% (recession risk: ${economicData.gdpGrowth < 1 ? 'High' : economicData.gdpGrowth < 2 ? 'Moderate' : 'Low'})
- Inflation: ${economicData.inflationRate}% (cost pressure: ${economicData.inflationRate > 4 ? 'High' : 'Moderate'})
- Unemployment: ${economicData.unemploymentRate}% (demand risk: ${economicData.unemploymentRate > 6 ? 'High' : 'Low'})

**Risk Analysis Requirements:**
1. Market and economic risks
2. Operational risks
3. Financial risks
4. Competitive risks
5. Regulatory and compliance risks
6. Technology and cybersecurity risks
7. Risk probability and impact assessment
8. Mitigation strategies for each risk category
9. Contingency planning recommendations
10. Risk monitoring and early warning indicators

Provide specific, actionable risk mitigation strategies.`
      }
    ];
  }

  private createFundingSearchPrompt(
    businessData: BusinessPlanData,
    fundingTypes: string[],
    location: string
  ): Array<{ role: string; content: string }> {
    return [
      {
        role: "system",
        content: `You are a funding specialist with extensive knowledge of grants, loans, and investment opportunities. Provide specific, actionable funding recommendations based on business type and location.`
      },
      {
        role: "user",
        content: `Find specific funding opportunities for:

**Business:**
- ${businessData.businessName}: ${businessData.businessIdea}
- Location: ${location}
- Investment Needed: ${businessData.investment}
- Business Stage: ${businessData.businessStage}

**Funding Types Requested:**
${fundingTypes.join(', ')}

**Requirements:**
1. Specific grant programs (federal, state, local)
2. SBA loan programs and requirements
3. Industry-specific funding opportunities
4. Location-based incentives and programs
5. Angel investor and VC opportunities
6. Crowdfunding platforms suitable for this business
7. Application requirements and deadlines
8. Funding amounts and terms
9. Eligibility criteria
10. Contact information and next steps

Provide real, specific funding sources with details, not generic advice.`
      }
    ];
  }
}

export const getBusinessPlanMistralAPI = (apiKey: string): BusinessPlanMistralAPI => {
  return new BusinessPlanMistralAPI(apiKey);
};
