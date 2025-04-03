import { type AnthropicProviderOptions, type AnthropicProviderSettings, createAnthropic } from '@ai-sdk/anthropic';
import { createOpenAI, type OpenAIProviderSettings } from '@ai-sdk/openai';
import { customProvider, defaultSettingsMiddleware, wrapLanguageModel } from 'ai';

export type MpcConductorProvider = ReturnType<typeof createProvider>;

export interface MpcConductorProviderSettings {
  llmProxyUrl?: string | ((opts: { provider: SupportedProvider }) => string);
  providers?: {
    openai?: OpenAIProviderSettings;
    anthropic?: AnthropicProviderSettings;
  };
}

export type SupportedProvider = keyof NonNullable<MpcConductorProviderSettings['providers']>;

export const createProvider = (opts: MpcConductorProviderSettings) => {
  const providerSettings = ({
    provider,
    settings,
  }: {
    provider: SupportedProvider;
    settings?: OpenAIProviderSettings;
  }) => {
    const llmProxyUrl = typeof opts.llmProxyUrl === 'function' ? opts.llmProxyUrl({ provider }) : opts.llmProxyUrl;

    // Prefer their baseURL if provided, otherwise use the proxy if no apiKey is provided
    const baseURL = settings?.baseURL ?? (settings?.apiKey ? undefined : llmProxyUrl);

    return {
      // ai-sdk does not send requests if apiKey is not provided, so if
      // using a proxy, set to empty string by default
      apiKey: baseURL ? '' : undefined,
      ...settings,
      baseURL,
      compatibility: 'strict',
    } as const;
  };

  const openai = createOpenAI(providerSettings({ provider: 'openai', settings: opts.providers?.openai }));
  const anthropic = createAnthropic(providerSettings({ provider: 'anthropic', settings: opts.providers?.anthropic }));

  return customProvider({
    languageModels: {
      'text-simple': openai('gpt-4o-mini'),
      text: openai('gpt-4o'),
      structure: openai('gpt-4o'),
      // planning: openai('o3-mini', { reasoningEffort: 'low' }),
      planning: wrapLanguageModel({
        model: anthropic('claude-3-7-sonnet-20250219'),
        // model: openai('o3-mini'),
        middleware: defaultSettingsMiddleware({
          settings: {
            providerMetadata: {
              anthropic: {
                thinking: { type: 'enabled', budgetTokens: 2000 }, // must be greater than 1024 tokens
              } satisfies AnthropicProviderOptions,
            },
          },
        }),
      }),
    },
  });
};
