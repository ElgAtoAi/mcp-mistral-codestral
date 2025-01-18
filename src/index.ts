import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { config } from "dotenv";
import { z } from "zod";
import { getMistralAPI, CompletionResponse } from './mistral.js';

// Load environment variables
config();

// Validate required environment variables
const envSchema = z.object({
  MISTRAL_API_KEY: z.string().min(1),
});

const env = envSchema.parse(process.env);

// Initialize Mistral API
let mistralApi: ReturnType<typeof getMistralAPI>;

try {
  mistralApi = getMistralAPI(env.MISTRAL_API_KEY);
  // Validate API key on startup
  await mistralApi.validateApiKey();
  console.error("Successfully connected to Mistral API");
} catch (error) {
  console.error("Failed to initialize Mistral API:", error instanceof Error ? error.message : error);
  process.exit(1);
}

// Define server configuration
const server = new Server(
  {
    name: "mcp-codestral",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  }
);

// Validate tool input schemas
const CodeCompletionSchema = z.object({
  code: z.string(),
  language: z.string().optional(),
  task: z.enum(['complete', 'fix', 'test']),
});

// Format Mistral API response
function formatResponse(completion: CompletionResponse): string {
  if (!completion.choices || completion.choices.length === 0) {
    throw new Error('Invalid completion response');
  }

  const content = completion.choices[0].message.content;

  // Extract code from markdown code blocks if present
  const codeBlockRegex = /```[\w]*\n([\s\S]*?)```/g;
  const matches = [...content.matchAll(codeBlockRegex)];

  if (matches.length > 0) {
    return matches.map(match => match[1].trim()).join('\n\n');
  }

  return content;
}

// Tool Implementation
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "code_completion",
        description: "Complete code, fix bugs, or generate tests using Mistral Codestral",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description: "The code to process",
            },
            language: {
              type: "string",
              description: "Programming language (optional)",
            },
            task: {
              type: "string",
              enum: ["complete", "fix", "test"],
              description: "Type of task: 'complete' for code completion, 'fix' for bug fixing, 'test' for test generation",
            },
          },
          required: ["code", "task"],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "code_completion") {
    try {
      const params = CodeCompletionSchema.parse(args);

      // Get formatted messages for the task
      const messages = mistralApi.createPrompt(
        params.code,
        params.language,
        params.task
      );

      // Make API call to Mistral
      const completion = await mistralApi.chatCompletion(messages);
      const formattedResponse = formatResponse(completion);

      // Return the formatted response
      return {
        content: [
          {
            type: "text",
            text: formattedResponse,
          },
        ],
      };
    } catch (error) {
      console.error("Error processing code completion request:", error);

      // Return a more user-friendly error message
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Add some basic resource handlers for code files
server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: "file://code",
        name: "Code Files",
        description: "Access to code files in the workspace"
      }
    ]
  };
});

// Start the server
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Mistral Codestral MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();