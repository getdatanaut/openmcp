export { SessionDO } from './session-do';

export default {
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		const url = new URL(request.url);

		const sessionId = url.searchParams.get('sessionId');
		const sessionDOId = sessionId ? env.SESSION_DO.idFromString(sessionId) : env.SESSION_DO.newUniqueId();
		const session = env.SESSION_DO.get(sessionDOId);

		return session.fetch(request);
	},
} satisfies ExportedHandler<Env>;
