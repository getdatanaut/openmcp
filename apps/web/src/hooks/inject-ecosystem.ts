import type { QueryClient } from '@tanstack/react-query';
import type { RegisteredRouter } from '@tanstack/react-router';
import { type Ecosystem, injectEcosystem as baseInjectEcosystem } from '@zedux/react';

export interface EcosystemContext {
  router: RegisteredRouter;
  queryClient: QueryClient;
}

export const injectEcosystem = () => {
  const ecosystem = baseInjectEcosystem();

  if (!isValidEcosystem(ecosystem)) {
    throw new Error('Invalid ecosystem. Expected Ecosystem<EcosystemContext>.');
  }

  return ecosystem as Ecosystem<EcosystemContext>;
};

function isValidEcosystem(ecosystem: Ecosystem<any>): ecosystem is Ecosystem<EcosystemContext> {
  return 'router' in ecosystem.context && 'queryClient' in ecosystem.context;
}
