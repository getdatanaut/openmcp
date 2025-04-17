export type ServerDefinition = {
  iconUrl?: string;
  developer?: string;
  developerUrl?: string;
  sourceUrl?: string;
} & (
  | {
      type: 'sse' | 'streamable-http';
      headers?: [string, string][];
      url: URL;
    }
  | {
      type: 'openapi';
      serverUrl?: string;
      uri: string;
    }
  | {
      type: 'stdio';
      input: string;
    }
);
