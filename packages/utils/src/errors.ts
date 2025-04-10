import { APICallError, type LanguageModelV1 } from 'ai';

export type ClientServerNotFound = ReturnType<typeof clientServerNotFound>;
export const clientServerNotFound = ({ serverId }: { serverId: string }) => ({
  type: 'ClientServerNotFound' as const,
  serverId,
  toString() {
    return `Client server "${this.serverId}" not found`;
  },
});

export type ServerNotFound = ReturnType<typeof serverNotFound>;
export const serverNotFound = ({ serverId }: { serverId: string }) => ({
  type: 'ServerNotFound' as const,
  serverId,
  toString() {
    return `Server "${this.serverId}" not found`;
  },
});

export type ToolNotFound = ReturnType<typeof toolNotFound>;
export const toolNotFound = ({ toolName, serverId }: { toolName: string; serverId: string }) => ({
  type: 'ToolNotFound' as const,
  toolName,
  serverId,
  toString() {
    return `Tool "${this.toolName}" not found for server "${this.serverId}"`;
  },
});

export type JsonParse = ReturnType<typeof jsonParse>;
export const jsonParse = ({ message, error }: { message?: string; error: unknown }) => ({
  type: 'JsonParse' as const,
  message,
  error,
  toString() {
    return this.message ?? 'Failed to parse JSON';
  },
});

export type JsonPath = ReturnType<typeof jsonPath>;
export const jsonPath = ({ paths, error }: { paths: string[]; error: unknown }) => ({
  type: 'JsonPath' as const,
  paths,
  error,
  toString() {
    return `JSON path parsing failed for paths ${JSON.stringify(this.paths)}: ${this.error}`;
  },
});

export type LlmOutputParse = ReturnType<typeof llmOutputParse>;
export const llmOutputParse = ({ text }: { text: string }) => ({
  type: 'LlmOutputParse' as const,
  text,
  toString() {
    return `Failed to parse LLM output: ${this.text}`;
  },
});

export type Stream = ReturnType<typeof stream>;
export const stream = ({ message, error }: { message: string; error: unknown }) => ({
  type: 'Stream' as const,
  message,
  error,
  toString() {
    return this.message;
  },
});

const llmErrorCodes = {
  400: 'invalid',
  401: 'auth',
  403: 'permission',
  413: 'request-too-large',
  429: 'rate-limited',
  500: 'other',
  // 503 is openai
  503: 'overloaded',
  // 529 is anthropic
  529: 'overloaded',
} as const;

export type LlmApiCall = ReturnType<typeof llmApiCall>;
export const llmApiCall = ({ provider, error }: { provider: string; error: APICallError }) => {
  const cause: 'invalid' | 'auth' | 'permission' | 'request-too-large' | 'rate-limited' | 'other' | 'overloaded' =
    llmErrorCodes[error.statusCode || 500] ?? 'other';

  return {
    type: 'LlmApiCall' as const,
    cause,
    provider,
    error,
    toString() {
      switch (cause) {
        case 'invalid':
          return `Invalid request to the ${this.provider} api: ${error.message}`;
        case 'auth':
          return `Authentication error for ${this.provider}`;
        case 'permission':
          return `Permission error for ${this.provider}`;
        case 'request-too-large':
          return `Request too large for ${this.provider}`;
        case 'rate-limited':
          return `Rate limited error for ${this.provider}`;
        case 'overloaded':
          return `The ${this.provider} is currently overloaded. Please try again later.`;
        case 'other':
          return `There was an error with the ${this.provider}. Please try again later.`;
      }
    },
  };
};

export type Other = ReturnType<typeof other>;
export const other = ({ message, error }: { message: string; error: unknown }) => ({
  type: 'Other' as const,
  message,
  error,
  toString() {
    return this.message;
  },
});

export type AiSdk = LlmApiCall | Stream;
export const handleAiSdkError = ({ error, model }: { error: unknown; model: LanguageModelV1 }) => {
  if (APICallError.isInstance(error)) {
    return llmApiCall({ provider: model.provider, error });
  }

  return stream({ message: `Stream error in with ${model.provider}`, error });
};
