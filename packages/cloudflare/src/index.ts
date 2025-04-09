import type { OpenMcpDurableObject } from './durable-object.ts';
import { type McpServerType, SessionId } from './utils/session.ts';

export { OpenMcpDurableObject } from './durable-object.ts';
export { getOpenMcpOpenAPIConfig, OpenMcpOpenAPI } from './mcp/openapi.ts';

export async function handleOpenMcpRequest<
  TNamespace extends DurableObjectNamespace<OpenMcpDurableObject<any, any, any>>,
>({
  request,
  serverType,
  namespace,
  getConfig,
}: {
  request: Request;
  serverType: McpServerType;
  namespace: TNamespace;
  getConfig?: (opts: {
    request: Request;
  }) => TNamespace extends DurableObjectNamespace<OpenMcpDurableObject<unknown, infer C, any>> ? C : never;
}) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get('sessionId') as SessionId;

  if (sessionId) {
    const session = SessionId.decode(sessionId);

    if (session.serverType !== serverType) {
      return new Response('This session is not valid for this MCP server', { status: 404 });
    }

    return namespace.get(namespace.idFromString(session.doId)).fetch(request);
  }

  const config = getConfig ? getConfig({ request }) : undefined;
  // @TODO stable stringify config
  const doId = config ? namespace.idFromName(JSON.stringify(config)) : namespace.newUniqueId();
  const stub = namespace.get(doId);

  await stub._init({ config });

  url.searchParams.set('sessionId', SessionId.encode({ doId, serverType }));

  return stub.fetch(new Request(url.toString(), request));
}
