// an unused import to verify type stripping & resolving works properly
import { createMcpManager } from '@openmcp/manager';

type Input = {
  readonly server: string;
  readonly secret?: string;
};

createMcpManager();
export default async function handler(_input: Input): Promise<void> {}
