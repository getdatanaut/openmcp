import { zValidator } from '@hono/zod-validator';
import { Hono } from 'hono';
import { proxy } from 'hono/proxy';
import { z } from 'zod';

const pathSchema = z.object({
  provider: z.enum(['openai', 'anthropic']),
  path: z.string(),
});

const app = new Hono<{ Bindings: Env }>()
  /**
   * Proxy requests to supported LLM provider API
   *
   * @example POST /llm/openai/v1/chat/completions
   */
  .post('/:provider/:path{(.*)}', zValidator('param', pathSchema), async c => {
    const path = c.req.param('path');
    const provider = c.req.param('provider') as z.infer<typeof pathSchema>['provider'];

    const providerConfig = getProviderConfig(provider);
    if (!providerConfig) {
      return c.json({ error: `Environment variables for provider ${provider} are not correctly set up.` }, 400);
    }

    const originalHeaders = c.req.header();
    const headers = {
      'content-type': originalHeaders['content-type'],
    };

    switch (provider) {
      case 'openai':
        headers['Authorization'] = `Bearer ${providerConfig.apiKey}`;
        break;
      case 'anthropic':
        headers['anthropic-version'] = originalHeaders['anthropic-version'];
        headers['x-api-key'] = providerConfig.apiKey;
        break;
    }

    return proxy(getProxyUrl(providerConfig.baseURL, path), {
      method: 'POST',
      headers,
      body: c.req.raw.body,
    });
  });

const DEFAULT_API_URLS = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com/v1',
};

/**
 * Get provider config from environment variables
 *
 * `process.env[{providerId}_API_URL]`
 *
 * `process.env[{providerId}_API_KEY]`
 */
function getProviderConfig(provider: z.infer<typeof pathSchema>['provider']) {
  const baseURL = process.env[`${provider.toUpperCase()}_API_URL`] ?? DEFAULT_API_URLS[provider];
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];

  if (!baseURL || !apiKey) {
    return null;
  }

  return { baseURL, apiKey };
}

function getProxyUrl(baseURL: string, path: string) {
  return `${baseURL.replace(/\/$/, '')}/${path}`;
}

export default app;
