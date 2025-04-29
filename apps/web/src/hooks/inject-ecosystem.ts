import type { QueryClient } from '@tanstack/react-query';
import type { RegisteredRouter } from '@tanstack/react-router';
import { type Ecosystem as BaseEcosystem, injectEcosystem as baseInjectEcosystem } from '@zedux/react';

export interface EcosystemContext {
  router: RegisteredRouter;
  queryClient: QueryClient;
}

export type Ecosystem = BaseEcosystem<EcosystemContext>;

export const injectEcosystem = () => {
  const ecosystem = baseInjectEcosystem();

  if (!isValidEcosystem(ecosystem)) {
    throw new Error('Invalid ecosystem. Expected Ecosystem<EcosystemContext>.');
  }

  return ecosystem as Ecosystem;
};

function isValidEcosystem(ecosystem: BaseEcosystem<any>): ecosystem is Ecosystem {
  return 'router' in ecosystem.context && 'queryClient' in ecosystem.context;
}
