import type { OpenMcpDurableObject } from './durable-object.ts';
import { SessionId } from './utils/session.ts';

export { OpenMcpDurableObject } from './durable-object.ts';
export { getOpenMcpOpenAPIConfig, OpenMcpOpenAPI } from './mcp/openapi.ts';

/**
 * Route a request to the appropriate OpenMcp Server
 * @param request Request to route
 * @param env Environment containing OpenMcp bindings
 * @param options Routing options
 * @returns Response from the OpenMcp Server or undefined if no route matched
 */
export async function routeOpenMcpRequest<Namespace>(
  request: Request,
  mcpServerMap: Record<
    string,
    {
      namespace: Namespace;
      getMcpConfig?: (request: Request) => unknown;
    }
  >,
) {
  const possibleServerIds = Object.keys(mcpServerMap);
  if (!possibleServerIds.length) {
    throw new Error('No OpenMcpDurableObjects are defined');
  }

  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId') as SessionId;

  if (sessionId) {
    const { doId, mcpServerId } = SessionId.decode(sessionId);
    const doNamespace = mcpServerMap[mcpServerId as keyof typeof mcpServerMap]
      ?.namespace as DurableObjectNamespace<OpenMcpDurableObject>;
    if (!doNamespace) {
      throw new Error(`No OpenMcpDurableObject found for "${mcpServerId}" on env`);
    }

    const doNamespaceId = doNamespace.idFromString(doId);
    return doNamespace.get(doNamespaceId).fetch(request);
  }

  const mcpServerId = url.pathname
    .split('/')
    .find(p => possibleServerIds.some(s => s.toLowerCase() === p.toLowerCase()));
  if (!mcpServerId) {
    return new Response('No MCP Server ID found', { status: 404 });
  }
  const mcpServer = mcpServerMap[mcpServerId as keyof typeof mcpServerMap];
  if (!mcpServer) {
    return new Response('No MCP Server found', { status: 404 });
  }
  const config = mcpServer.getMcpConfig ? mcpServer.getMcpConfig(request) : undefined;
  const doNamespace = mcpServer.namespace as DurableObjectNamespace<OpenMcpDurableObject>;
  const doId = config ? doNamespace.idFromName(JSON.stringify(config)) : doNamespace.newUniqueId();
  const stub = doNamespace.get(doId);

  await stub.setConfig(config);

  url.searchParams.set('sessionId', SessionId.encode({ doId, mcpServerId }));

  return stub.fetch(new Request(url.toString(), request));
}
