type ProviderValue<T> = [React.Context<T>, T];
type ProviderValues<A, B, C, D, E, F, G, H, I, J, K> =
  | [ProviderValue<A>]
  | [ProviderValue<A>, ProviderValue<B>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>]
  | [ProviderValue<A>, ProviderValue<B>, ProviderValue<C>, ProviderValue<D>, ProviderValue<E>, ProviderValue<F>]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
    ]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
      ProviderValue<H>,
    ]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
      ProviderValue<H>,
      ProviderValue<I>,
    ]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
      ProviderValue<H>,
      ProviderValue<I>,
      ProviderValue<J>,
    ]
  | [
      ProviderValue<A>,
      ProviderValue<B>,
      ProviderValue<C>,
      ProviderValue<D>,
      ProviderValue<E>,
      ProviderValue<F>,
      ProviderValue<G>,
      ProviderValue<H>,
      ProviderValue<I>,
      ProviderValue<J>,
      ProviderValue<K>,
    ];

interface ProviderProps<A, B, C, D, E, F, G, H, I, J, K> {
  values: ProviderValues<A, B, C, D, E, F, G, H, I, J, K>;
  children: React.ReactNode;
}

export function Provider<A, B, C, D, E, F, G, H, I, J, K>({
  values,
  children,
}: ProviderProps<A, B, C, D, E, F, G, H, I, J, K>): React.ReactNode {
  for (const [Context, value] of values) {
    // @ts-expect-error ignore
    children = <Context.Provider value={value}>{children}</Context.Provider>;
  }

  return children;
}
