import type { TAgentId } from '@libs/db-ids';
import type { AgentDetailedSelect } from '@libs/db-pg';
import { isDefinedError, ORPCError } from '@orpc/client';

import consola from '../../consola/index.ts';
import { login } from '../datanaut/auth.ts';
import { rpcClient } from '../sdk.ts';

type Opts = {
  /**
   * @defaultValue true
   */
  login?: boolean;
};

export async function getAgentById(
  id: TAgentId,
  { login: shouldLogin = true }: Opts = {},
): Promise<AgentDetailedSelect> {
  let agent: AgentDetailedSelect;
  try {
    agent = await rpcClient.agents.getAgent({ agentId: id });
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
