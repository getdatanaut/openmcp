import { getOpenMcpOpenAPIConfig, handleOpenMcpRequest } from '@openmcp/cloudflare';
import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>().all('/openapi/*', async c => {
  return handleOpenMcpRequest({
    request: c.req.raw,
    serverType: 'openapi',
    namespace: c.env.OpenMcpOpenAPI,
    getConfig: getOpenMcpOpenAPIConfig({ openAiApiKey: c.env.OPENAI_API_KEY }),
  });
});

export default app;
