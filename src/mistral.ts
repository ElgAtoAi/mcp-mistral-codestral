import axios, { AxiosError } from 'axios';
import { z } from 'zod';

const MISTRAL_API_BASE = 'https://api.mistral.ai/v1';

// Response schema validation
const CompletionResponseSchema = z.object({
  id: z.string(),
  object: z.string(),
  created: z.number(),
  model: z.string(),
  choices: z.array(z.object({
    index: z.number(),
    message: z.object({
      role: z.string(),
      content: z.string(),
    }),
    finish_reason: z.string().optional(),
  })),
  usage: z.object({
    prompt_tokens: z.number(),
    completion_tokens: z.number(),
    total_tokens: z.number(),
  }),
});

export type CompletionResponse = z.infer<typeof CompletionResponseSchema>;

export class MistralAPI {
  private apiKey: string;
  private client: ReturnType<typeof axios.create>;

  constructor(apiKey: string) {
    if (!apiKey || apiKey.trim().length === 0) {
      throw new Error('API key cannot be empty');
    }
    this.apiKey = apiKey.trim();
    this.client = axios.create({
      baseURL: MISTRAL_API_BASE,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    });
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const response = await this.client.get('/models');
      console.error('Models response:', response.data); // Debug log
      return true;
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('API Error details:', {
          status: error.response?.status,
          data: error.response?.data,
          headers: error.response?.headers
        });
        if (error.response?.status === 401) {
          throw new Error('Invalid API key. Please check your Mistral API key.');
        }
        throw new Error(`API validation failed: ${error.message}`);
      }
      throw error;
    }
  }

  async chatCompletion(messages: Array<{ role: string; content: string }>) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: 'mistral-medium',  // Using mistral-medium as default model
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      });

      const validatedResponse = CompletionResponseSchema.parse(response.data);
      return validatedResponse;
    } catch (error) {
      if (error instanceof AxiosError) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        switch (status) {
          case 401:
            throw new Error('Authentication failed. Please check your API key.');
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 500:
            throw new Error('Mistral API server error. Please try again later.');
          default:
            throw new Error(`Mistral API error (${status}): ${message}`);
        }
      }
      throw error;
    }
  }

  // Function for creating prompts based on task type
  createPrompt(code: string, language: string | undefined, task: 'complete' | 'fix' | 'test'): Array<{ role: string; content: string }> {
    const langStr = language ? ` ${language}` : '';

    const systemPrompts = {
      complete: "You are an expert programmer. Continue or complete the provided code according to best practices.",
      fix: "You are an expert programmer. Analyze the code for bugs and provide a corrected version with explanations of the fixes.",
      test: "You are an expert programmer. Generate comprehensive unit tests for the provided code using appropriate testing frameworks.",
    };

    return [
      {
        role: "system",
        content: systemPrompts[task],
      },
      {
        role: "user",
        content: `Here is the${langStr} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``,
      },
    ];
  }

  // Rate limiting helpers
  private lastRequestTime: number = 0;
  private readonly minRequestInterval: number = 100; // Minimum 100ms between requests

  private async enforceRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;

    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve =>
        setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest)
      );
    }

    this.lastRequestTime = Date.now();
  }
}

// Create a singleton instance
let instance: MistralAPI | null = null;

export const getMistralAPI = (apiKey: string): MistralAPI => {
  if (!instance) {
    instance = new MistralAPI(apiKey);
  }
  return instance;
};