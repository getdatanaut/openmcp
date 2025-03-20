import { createContext } from '@libs/ui-primitives';
import { type MpcManager } from '@openmcp/manager';
import { useLiveQuery } from 'dexie-react-hooks';
import { type ReactNode, useEffect, useState } from 'react';

import { useRootStore } from './use-root-store.tsx';

export const [CurrentManagerContext, useCurrentManager] = createContext<MpcManager>({
  name: 'CurrentManagerContext',
  strict: true,
});

/**
 * @TODO clean this up.. so ugly
 */
export const CurrentManagerProvider = ({ children }: { children: ReactNode }) => {
  const { mcpManagers } = useRootStore();
  const { db } = useRootStore();

  const [currentManager, setCurrentManager] = useState<MpcManager | null>(null);

  // https://stackoverflow.com/a/73528448
  const [config, configLoaded] = useLiveQuery(
    () => db.mpcManagers.get('default').then(m => [m, true]),
    [], // deps...
    [], // default result: makes 'loaded' undefined while loading
  );

  useEffect(() => {
    if (!currentManager) return;

    return () => {
      void currentManager.close();
    };
  }, [currentManager]);

  useEffect(() => {
    if (!configLoaded) return;

    if (!config) {
      void mcpManagers.insert({ id: 'default' });
      return;
    }

    const manager = mcpManagers.add({ id: config.id, conductor: config.conductor });

    setCurrentManager(prevManager => {
      if (prevManager) {
        void prevManager.close();
      }

      return manager;
    });
  }, [configLoaded, config, mcpManagers]);

  if (!currentManager) {
    // Should be basically instant, so just rendering nothing rather than a flash of text
    return null;
  }

  return <CurrentManagerContext.Provider value={currentManager}>{children}</CurrentManagerContext.Provider>;
};
