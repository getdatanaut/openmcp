import type { APICallError } from 'ai';

export type ConductorError =
  | { type: 'ClientServerNotFound'; serverId: string; toString(): string }
  | { type: 'ServerNotFound'; serverId: string; toString(): string }
  | { type: 'ToolNotFound'; toolName: string; serverId: string; toString(): string }
  | { type: 'JsonParse'; message?: string; error: unknown; toString(): string }
  | { type: 'LlmOutputParse'; text: string; toString(): string }
  | { type: 'Stream'; message: string; error: unknown; toString(): string }
  | {
      type: 'LlmApiCall';
      cause: 'invalid' | 'auth' | 'permission' | 'request-too-large' | 'rate-limited' | 'other' | 'overloaded';
      provider: string;
      error: APICallError;
      toString(): string;
    }
  | { type: 'Other'; message: string; error: unknown; toString(): string };

export type PickError<T extends { type: string }, K extends T['type']> = Extract<T, { type: K }>;

export const clientServerNotFound = ({ serverId }: { serverId: string }) =>
  ({
    type: 'ClientServerNotFound',
    serverId,
    toString() {
      return `Client server "${this.serverId}" not found`;
    },
  }) satisfies ConductorError;

export const serverNotFound = ({ serverId }: { serverId: string }) =>
  ({
    type: 'ServerNotFound',
    serverId,
    toString() {
      return `Server "${this.serverId}" not found`;
    },
  }) satisfies ConductorError;

export const toolNotFound = ({ toolName, serverId }: { toolName: string; serverId: string }) =>
  ({
    type: 'ToolNotFound',
    toolName,
    serverId,
    toString() {
      return `Tool "${this.toolName}" not found for server "${this.serverId}"`;
    },
  }) satisfies ConductorError;

export const jsonParse = ({ message, error }: { message?: string; error: unknown }) =>
  ({
    type: 'JsonParse',
    message,
    error,
    toString() {
      return this.message ?? 'Failed to parse JSON';
    },
  }) satisfies ConductorError;

export const llmOutputParse = ({ text }: { text: string }) =>
  ({
    type: 'LlmOutputParse',
    text,
    toString() {
      return `Failed to parse LLM output: ${this.text}`;
    },
  }) satisfies ConductorError;

export const stream = ({ message, error }: { message: string; error: unknown }) =>
  ({
    type: 'Stream',
    message,
    error,
    toString() {
      return this.message;
    },
  }) satisfies ConductorError;

export const llmApiCall = ({ provider, error }: { provider: string; error: APICallError }) => {
  return {
    type: 'LlmApiCall',
    cause: llmErrorCodes[error.statusCode || 500] ?? 'other',
    provider,
    error,
    toString() {
      switch (this.cause) {
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
  } satisfies ConductorError;
};

export const other = ({ message, error }: { message: string; error: unknown }) =>
  ({
    type: 'Other',
    message,
    error,
    toString() {
      return this.message;
    },
  }) satisfies ConductorError;

// LLM API Call Errors

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
