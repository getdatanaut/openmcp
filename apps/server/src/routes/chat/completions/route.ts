import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>()
  /**
   * Proxy requests to OpenAI compatible API
   *
   * @example POST /chat/completions
   */
  .post('/', async c => {
    let body;
    try {
      body = await c.req.json();
    } catch (error) {
      console.error('Failed to parse request body', error);
      return c.json({ error: 'Invalid JSON' }, 400);
    }

    const { baseUrl, ...requestBody } = body;

    // TODO(CL): do we even want to support allowing folks to pass a baseURL? This could just be done in the client Manger
    const url = new URL(baseUrl || c.env['OPENAI_API_BASE_URL']);
    // TODO(CL): is this the propery way to override the pathname or should we allow baseUrl to be a full URL?
    url.pathname = '/v1/chat/completions';

    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    // Don't expose our API key to their base URL
    const apiKey = baseUrl ? c.req.header('Authorization')?.replace('Bearer ', '') : c.env['OPENAI_API_KEY'];
    if (apiKey) {
      headers.set('Authorization', `Bearer ${apiKey}`);
    }

    try {
      return fetch(url.toString(), {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      console.error('Failed to fetch from OpenAI', error);
      return c.json({ error: 'Failed to fetch from OpenAI' }, 500);
    }
  });

export default app;
