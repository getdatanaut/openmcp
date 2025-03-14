import { createOpenAI } from '@ai-sdk/openai';
import {
  convertToCoreMessages,
  createDataStreamResponse,
  experimental_createMCPClient,
  streamText,
  tool as createTool,
} from 'ai';
import { Hono } from 'hono';
import { inspect } from 'util';
import { z } from 'zod';

const app = new Hono<{ Bindings: Env }>()
  /**
   * Configure a new Manager instance
   *
   * @example GET /manager
   */
  .get('/', async c => {
    return c.json({
      message: 'Welcome to OpenMCP Manager!',
    });
  })
  /**
   * Create a new message in a thread
   *
   * @example POST /manager/123/threads/456/messages
   */
  .post('/:managerId/threads/:id/messages', async c => {
    const { messages } = await c.req.json();

    const openai = createOpenAI({
      apiKey: c.env['OPENAI_API_KEY'],
    });

    const dataStreamResponse = createDataStreamResponse({
      onError: error => {
        return String(error);
      },
      execute: async dataStream => {
        const coreMessages = convertToCoreMessages(messages);

        const result = streamText({
          model: openai('gpt-4o'),
          messages: coreMessages,
          maxSteps: 5,

          tools: {
            getOpenAPITools: createTool({
              description: 'Get the tools available for using with an OpenAPI spec',
              parameters: z.object({
                openapi: z
                  .string()
                  .describe('An URL to an OpenAPI document such as https://petstore3.swagger.io/api/v3/openapi.json'),
                baseUrl: z
                  .string()
                  .describe('The base URL for the API to call such as https://petstore3.swagger.io/api/v3')
                  .optional(),
              }),
              execute: async ({ openapi, baseUrl }) => {
                console.log('getOpenAPITools', { openapi, baseUrl });
                const url = new URL('http://localhost:8787/mcp/openapi/sse');
                url.searchParams.set('openapi', openapi);
                url.searchParams.set('baseUrl', baseUrl ?? '');

                const client = await experimental_createMCPClient({
                  transport: {
                    type: 'sse',
                    url: url.toString(),
                  },
                });

                const tools = await client.tools();

                return tools;
              },
            }),
            callOpenAPITool: createTool({
              description: 'Call one of the tools returned by getOpenAPITools.',
              parameters: z.object({
                openapi: z
                  .string()
                  .describe('An URL to an OpenAPI document, such as https://petstore3.swagger.io/api/v3/openapi.json'),
                baseUrl: z
                  .string()
                  .describe('The base URL for the API to call, such as https://petstore3.swagger.io/api/v3'),
                toolName: z.string().describe('The name of the tool to call, such as getPetById'),
                toolInput: z
                  .object({
                    headers: z.object({}).passthrough().optional(),
                    path: z.object({}).passthrough().optional(),
                    query: z.object({}).passthrough().optional(),
                    body: z.object({}).passthrough().optional(),
                  })
                  .describe('The input to provide when calling the tool, such as { path: { petId: 123 } }'),
              }),
              execute: async ({ openapi, baseUrl, toolName, toolInput }, rest) => {
                console.log(
                  'callOpenAPITool',
                  inspect({ openapi, baseUrl, toolName, toolInput }, { depth: 10, colors: true }),
                );
                const url = new URL('http://localhost:8787/mcp/openapi/sse');
                url.searchParams.set('openapi', openapi);
                url.searchParams.set('baseUrl', baseUrl);

                const client = await experimental_createMCPClient({
                  transport: {
                    type: 'sse',
                    url: url.toString(),
                  },
                });

                const tools = await client.tools();

                const tool = tools[toolName];

                if (!tool) {
                  throw new Error(`Tool ${toolName} not found`);
                }

                return tool.execute(toolInput, rest);
              },
            }),
          },
        });

        result.mergeIntoDataStream(dataStream);
      },
    });

    return dataStreamResponse;
  });

export default app;
