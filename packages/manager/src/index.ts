declare global {
  interface ImportMetaEnv {
    readonly PLATFORM: 'node' | 'browser';
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export type { ClientServerId, ClientServerOptions, ClientServerStorageData, Tool } from './client-servers.ts';
export { ClientServer } from './client-servers.ts';
export type {
  McpConductorAnnotation,
  McpConductorReasoningFinishAnnotation,
  McpConductorReasoningStartAnnotation,
} from './conductor/annotations.ts';
export { isReasoningAnnotation, isUsageAnnotation } from './conductor/annotations.ts';
export type { McpConductor, McpConductorSettings } from './conductor/conductor.ts';
export { createMcpConductor } from './conductor/conductor.ts';
export type { McpManagerOptions, McpManagerStorage } from './manager.ts';
export { createMcpManager, McpManager } from './manager.ts';
export type { ServerOptions, ServerStorageData } from './servers.ts';
export { Server } from './servers.ts';
export type { Storage } from './storage/index.ts';
export type { AIResponseMessage, ThreadMessageStorageData, ThreadStorageData } from './threads.ts';
export { Thread } from './threads.ts';
export type { TransportConfig } from './transport.ts';
export type { ClientId, McpManagerId, ServerId, ThreadId, ThreadMessageId } from './types.ts';
