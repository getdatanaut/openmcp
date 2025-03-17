export interface SlotProp<T extends string> {
  /** CSS classes to be passed to the component slots. */
  classNames?: Omit<Partial<Record<T, string>>, 'base'>;
}

export type VariantSlots<V extends {}> = keyof V;
