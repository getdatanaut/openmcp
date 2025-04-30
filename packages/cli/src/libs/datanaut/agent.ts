import { isDefinedError, ORPCError } from '@orpc/client';

import { login } from '#libs/datanaut-auth-cli';

import consola from '../../consola/index.ts';
import type { Agent } from '../../rpc/agents.ts';
import { rpcClient } from './sdk/sdk.ts';

type Opts = {
  /**
   * @defaultValue true
   */
  login?: boolean;
};

export async function getAgentById(id: string, { login: shouldLogin = true }: Opts = {}): Promise<Agent> {
  let agent: Agent;
  try {
    agent = await rpcClient.cli.agents.getAgent({ agentId: id });
  } catch (error) {
    if (!(error instanceof ORPCError) || !isDefinedError(error)) {
      throw error;
    }

    if (error.status !== 401 || !shouldLogin) {
      throw new Error(error.message, { cause: error });
    }

    const res = await consola.prompt(`You do not seem to be logged in. Would you like to log in?`, {
      type: 'confirm',
    });

    if (res) {
      await login();
      // let's retry once logged in
      return getAgentById(id, { login: false });
    } else {
      throw new Error('Login cancelled. Please execute `login` to log in.');
    }
  }

  return agent;
}
