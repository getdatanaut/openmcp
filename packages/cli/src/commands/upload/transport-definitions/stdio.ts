import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

import type ParsedCommand from '../utils/parse-cmd/parsed-command.ts';
import type { TransportDefinition } from './types.ts';

export type StdioTransportDefinition = TransportDefinition<'stdio'>;

export default function getStdioTransportDefinition(command: ParsedCommand, cwd: string): StdioTransportDefinition {
  return {
    transport: new StdioClientTransport(command.getStdioServerParameters(cwd)),
    transportConfig: command.getTransportConfig(),
    configSchema: command.configSchema.serialize(),
    externalId: command.externalId,
  };
}
