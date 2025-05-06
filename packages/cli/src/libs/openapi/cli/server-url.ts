import type { IHttpService } from '@stoplight/types';

import * as prompt from '#libs/console/prompts';

import { resolveServers } from '../server/index.ts';

export default async function negotiateServerUrl(service: IHttpService): Promise<string> {
  const resolvedServers = resolveServers(service);

  if (resolvedServers.length === 0) {
    return prompt.url('No servers found. Please provide a server URL:');
  }

  const validServers = resolvedServers.filter(server => server.valid);

  if (validServers.length === 0) {
    return prompt.url(
      `We found ${service.servers?.length ?? 0} servers, but could not construct a valid URL. Please provide a server URL:`,
    );
  }

  if (validServers.length === 1) {
    return validServers[0]!.value;
  }

  const options: { label: string; hint: string; value: string }[] = [];
  let initial: string | undefined;

  for (const [i, server] of validServers.entries()) {
    options.push({
      label: server.name ?? `Server #${i + 1}`,
      hint: server.value,
      value: server.value,
    });

    if (!initial && server.name?.toLowerCase().includes('production')) {
      initial = server.value;
    }
  }

  return prompt.select({
    message: 'Please select a server:',
    initialValue: initial,
    options,
  });
}
