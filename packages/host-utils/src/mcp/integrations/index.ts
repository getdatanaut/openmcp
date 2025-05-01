import createGenericClient from './generic.ts';
import createGooseClient from './goose.ts';
import createVSCodeClient from './vscode.ts';

export const integrations = {
  boltai: createGenericClient('boltai', '$HOME/.boltai/mcp.json'),
  claude: createGenericClient('claude', '$CONFIG/Claude/claude_desktop_config.json'),
  cline: createGenericClient('cline', '$VSCODE/saoudrizwan.claude-dev/settings/cline_mcp_settings.json'),
  cursor: createGenericClient('cursor', '$HOME/.cursor/mcp.json'),
  goose: createGooseClient(),
  roocode: createGenericClient('roocode', '$VSCODE/rooveterinaryinc.roo-cline/settings/mcp_settings.json'),
  vscode: createVSCodeClient('vscode', '$VSCODE/settings.json'),
  'vscode-insiders': createVSCodeClient('vscode-insiders', '$CONFIG/Code - Insiders/User/settings.json'),
  windsurf: createGenericClient('windsurf', '$HOME/.codeium/windsurf/mcp_config.json'),
  witsy: createGenericClient('witsy', '$CONFIG/Witsy/settings.json'),
} as const;

export { default as generateRemixName } from './utils/generate-remix-name.ts';

export type IntegrationName = keyof typeof integrations;
