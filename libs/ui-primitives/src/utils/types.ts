import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

export interface SlotProp<T extends string> {
  /** CSS classes to be passed to the component slots. */
  classNames?: Omit<Partial<Record<T, string>>, 'base'>;
}

export type VariantSlots<V extends {}> = keyof V;

type As<Props = any> = ElementType<Props>;

type PropsOf<T extends As> = ComponentPropsWithoutRef<T>;

export type HTMLProps<T extends As, K extends object = object> = Omit<
  Omit<PropsOf<T>, 'ref' | 'color' | 'slot' | 'dir' | 'size'>,
  keyof K
> &
  K;

export type MaybeRenderProp<P, R = ReactNode> = R | ((props: P) => R);
