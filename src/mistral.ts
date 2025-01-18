import axios, { AxiosError } from 'axios';
import { z } from 'zod';

const MISTRAL_API_BASE = 'https://api.mistral.ai/v1';

export const MISTRAL_MODELS = {
  CODESTRAL: 'codestral-latest',
  CODESTRAL_MAMBA: 'codestral-mamba-latest'
} as const;

export type MistralModel = typeof MISTRAL_MODELS[keyof typeof MISTRAL_MODELS];

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

  async chatCompletion(
    messages: Array<{ role: string; content: string }>,
    options: {
      model?: MistralModel;
      temperature?: number;
      top_p?: number;
      max_tokens?: number;
      stop?: string[];
    } = {}
  ) {
    try {
      const response = await this.client.post('/chat/completions', {
        model: options.model || MISTRAL_MODELS.CODESTRAL,
        messages,
        temperature: options.temperature ?? 0.7,
        top_p: options.top_p ?? 1,
        max_tokens: options.max_tokens ?? 1000,
        stop: options.stop,
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

  // FIM (Fill-in-the-middle) completion
  async fimCompletion(
    prompt: string,
    options: {
      suffix?: string;
      temperature?: number;
      top_p?: number;
      max_tokens?: number;
      stop?: string[];
    } = {}
  ) {
    try {
      console.error('FIM Request:', {
        prompt,
        options,
      });

      const requestBody = {
        model: MISTRAL_MODELS.CODESTRAL,
        prompt,
        suffix: options.suffix,
        temperature: options.temperature ?? 0,
        top_p: options.top_p ?? 1,
        max_tokens: options.max_tokens ?? 1000,
        stop: options.stop,
      };

      console.error('FIM Request Body:', JSON.stringify(requestBody, null, 2));

      const response = await this.client.post('/fim/completions', requestBody);

      console.error('FIM Response:', {
        status: response.status,
        headers: response.headers,
        data: response.data,
      });

      const validatedResponse = CompletionResponseSchema.parse(response.data);
      return validatedResponse;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('FIM Error:', {
        name: err.name,
        message: err.message,
        stack: err.stack,
      });

      if (error instanceof AxiosError) {
        console.error('API Error Details:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          headers: error.response?.headers,
        });

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
            throw new Error(`Mistral API error (${status}): ${message}\nResponse: ${JSON.stringify(error.response?.data)}`);
        }
      }
      throw new Error(`Unexpected error during FIM completion: ${err.message}`);
    }
  }

  // Function for creating prompts based on task type
  createPrompt(
    code: string,
    language: string | undefined,
    task: 'complete' | 'fix' | 'test' | 'fim',
    suffix?: string
  ): Array<{ role: string; content: string }> {
    const langStr = language ? ` ${language}` : '';

    const systemPrompts = {
      complete: "You are an expert programmer. Continue or complete the provided code according to best practices.",
      fix: "You are an expert programmer. Analyze the code for bugs and provide a corrected version with explanations of the fixes.",
      test: "You are an expert programmer. Generate comprehensive unit tests for the provided code using appropriate testing frameworks.",
      fim: "You are an expert programmer. Complete the code between the given start and end sections, ensuring it flows naturally.",
    };

    let userContent = `Here is the${langStr} code:\n\n\`\`\`${language || ''}\n${code}\n\`\`\``;

    if (task === 'fim' && suffix) {
      userContent += `\n\nThe code should end with:\n\n\`\`\`${language || ''}\n${suffix}\n\`\`\``;
    }

    return [
      {
        role: "system",
        content: systemPrompts[task],
      },
      {
        role: "user",
        content: userContent,
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
