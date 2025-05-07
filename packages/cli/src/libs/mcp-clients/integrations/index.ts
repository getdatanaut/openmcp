import createCursorClient from './cursor.ts';
import createGenericClient from './generic.ts';
import createGooseClient from './goose.ts';
import createVSCodeClient from './vscode.ts';

export const integrations = {
  boltai: createGenericClient('boltai', {
    // https://docs.boltai.com/docs/plugins/mcp-servers#faqs
    global: '$HOME/.boltai/mcp.json',
    local: null,
  }),
  claude: createGenericClient('claude', {
    // https://modelcontextprotocol.io/quickstart/user#2-add-the-filesystem-mcp-server
    global: '$CONFIG/Claude/claude_desktop_config.json',
    local: null,
  }),
  cline: createGenericClient('cline', {
    global: '$VSCODE/saoudrizwan.claude-dev/settings/cline_mcp_settings.json',
    local: null,
  }),
  cursor: createCursorClient(),
  goose: createGooseClient(),
  roocode: createGenericClient('roocode', {
    global: '$VSCODE/rooveterinaryinc.roo-cline/settings/mcp_settings.json',
    local: null,
  }),
  vscode: createVSCodeClient('vscode', {
    global: '$VSCODE/settings.json',
    // https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server
    local: '$CWD/.vscode/mcp.json',
  }),
  'vscode-insiders': createVSCodeClient('vscode-insiders', {
    global: '$CONFIG/Code - Insiders/User/settings.json',
    // https://code.visualstudio.com/docs/copilot/chat/mcp-servers#_add-an-mcp-server
    local: '$CWD/.vscode/mcp.json',
  }),
  windsurf: createGenericClient('windsurf', {
    // https://docs.windsurf.com/windsurf/mcp#mcp-config-json
    global: '$HOME/.codeium/windsurf/mcp_config.json',
    local: null,
  }),
  witsy: createGenericClient('witsy', {
    global: '$CONFIG/Witsy/settings.json',
    local: null,
  }),
} as const;

export { default as generateRemixName } from './utils/generate-server-name.ts';

export type IntegrationName = keyof typeof integrations;
