import type { IntegrationName } from './integrations/index.ts';
import generateServerName from './integrations/utils/generate-server-name.ts';
import generateTransport from './integrations/utils/generate-transport.ts';
import type { Remix } from './types.ts';

type ShellCommandHint = {
  readonly type: 'command';
  readonly value: string;
};

type LinkCommandHint = {
  readonly type: 'url';
  readonly value: string;
};

type Hint = ShellCommandHint | LinkCommandHint;

function generateVsCodeTransport(remix: Remix) {
  return serializeTransport({
    name: generateServerName([], remix),
    type: 'stdio',
    ...generateTransport(remix),
  });
}

function serializeTransport(transport: Record<string, unknown>) {
  return encodeURIComponent(JSON.stringify(transport));
}

export default function getInstallHints(
  remix: Remix,
  integrationName: IntegrationName,
): [ShellCommandHint] | [ShellCommandHint, LinkCommandHint] {
  const hints: [ShellCommandHint, ...Hint[]] = [
    {
      type: 'command',
      value: `npx openmcp@latest install ${remix.id} --client ${integrationName}`,
    },
  ];

  if (integrationName === 'vscode') {
    hints.push({
      type: 'url',
      value: `vscode:mcp/install?${generateVsCodeTransport(remix)}`,
    });
  } else if (integrationName === 'vscode-insiders') {
    hints.push({
      type: 'url',
      value: `vscode-insiders:mcp/install?${generateVsCodeTransport(remix)}`,
    });
  }

  return hints as [ShellCommandHint] | [ShellCommandHint, LinkCommandHint];
}
