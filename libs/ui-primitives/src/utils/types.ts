import type React from 'react';

export interface SlotProp<T extends string> {
  /** CSS classes to be passed to the component slots. */
  classNames?: Omit<Partial<Record<T, string>>, 'base'>;
}

export type VariantSlots<V extends {}> = keyof V;

/**
 * Render prop type.
 * @template P Props
 * @example
 * const children: RenderProp = (props) => <div {...props} />;
 */
export type RenderProp<P = React.HTMLAttributes<any> & React.RefAttributes<any>> = (props: P) => React.ReactNode;

/**
 * The `wrapElement` prop.
 */
export type WrapElement = (element: React.ReactElement) => React.ReactElement;

/**
 * Custom props including the `render` prop.
 */
export interface Options {
  wrapElement?: WrapElement;
  /**
   * Allows the component to be rendered as a different HTML element or React
   * component. The value can be a React element or a function that takes in the
   * original component props and gives back a React element with the props
   * merged.
   *
   * Check out the [Composition](https://ariakit.org/guide/composition) guide
   * for more details.
   */
  render?: RenderProp | React.ReactElement<any> | keyof React.JSX.IntrinsicElements;
}
