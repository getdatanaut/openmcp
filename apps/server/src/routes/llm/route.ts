import { Hono } from 'hono';

const app = new Hono<{ Bindings: Env }>()
  /**
   * Proxy requests to supported LLM provider API
   *
   * @example POST /llm/openai/v1/chat/completions
   */
  .post('/:providerId/:path{(.*)}', async c => {
    const path = c.req.param('path');
    if (!path) {
      return c.json({ error: 'Path is required' }, 400);
    }

    const providerId = c.req.param('providerId');
    const provider = getProvider(providerId);
    if (!provider) {
      return c.json({ error: `Provider ${providerId} not supported` }, 400);
    }

    return fetch(getProxyUrl(provider.baseURL, path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${provider.apiKey}`,
      },
      body: c.req.raw.body,
    });
  });

/**
 * Get provider config from environment variables
 *
 * `process.env[{providerId}_LLM_API_URL]`
 *
 * `process.env[{providerId}_LLM_API_KEY]`
 */
function getProvider(providerId: string) {
  const baseURL = process.env[`${providerId.toUpperCase()}_LLM_API_URL`];
  const apiKey = process.env[`${providerId.toUpperCase()}_LLM_API_KEY`];

  if (!baseURL || !apiKey) {
    return null;
  }

  return { baseURL, apiKey };
}

function getProxyUrl(baseURL: string, path: string) {
  return `${baseURL.replace(/\/$/, '')}/${path}`;
}

export default app;
