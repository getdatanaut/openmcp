import type { RegisteredRouter } from '@tanstack/react-router';
import { api, atom, injectEcosystem, injectEffect, injectSignal } from '@zedux/react';

/**
 * Updates internal state immediately, but delays updating the query param in the URL.
 * Helpful when query param is tied to fast changing state like a search input.
 *
 * @example
 * const [qServers, setQServers] = useAtomState(debouncedSearchParamAtom, [{ searchParam: 'qServers' }]);
 */
export const debouncedSearchParamAtom = atom(
  'debouncedSearchParam',
  ({ searchParam }: { searchParam: keyof RegisteredRouter['latestLocation']['search'] }) => {
    const { router } = injectEcosystem().context;

    const signal = injectSignal<string>(router.latestLocation.search[searchParam] ?? '');
    const currentVal = signal.get();

    injectEffect(() => {
      const handle = setTimeout(() => {
        void router.navigate({ to: '.', search: prev => ({ ...prev, [searchParam]: currentVal ?? undefined }) });
      }, 500);

      return () => clearTimeout(handle);
    }, [currentVal]);

    return api(signal);
  },
);
