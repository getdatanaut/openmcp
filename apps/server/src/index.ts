export { McpOpenAPI } from './mcp-openapi';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    const sessionId = url.searchParams.get('sessionId');
    const openapi = url.searchParams.get('openapi');
    const baseUrl = url.searchParams.get('baseUrl');

    if (!sessionId && !openapi) {
      return new Response(JSON.stringify({ error: '"sessionId" or "openapi" query parameter is required' }), {
        status: 400,
      });
    }

    const sessionDOId = sessionId
      ? env.McpOpenAPI.idFromString(sessionId)
      : // TODO(CL): SSE DO is only setup to stream to one client at at time right now, so currently creating a unique DO per session
        env.McpOpenAPI.idFromName(JSON.stringify({ openapi, baseUrl, id: crypto.randomUUID() }));
    const session = env.McpOpenAPI.get(sessionDOId);

    if (!sessionId) {
      await session.setConfig({ openapi, baseUrl });
    }

    return session.fetch(request);
  },
} satisfies ExportedHandler<Env>;
