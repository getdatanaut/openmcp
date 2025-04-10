import { useMemo } from 'react';

import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import { ButtonContext } from './button.context.ts';
import { buttonGroupStaticClass, buttonGroupStyle, type ButtonGroupStyleProps } from './button.styles.ts';
import { type ButtonProps } from './button.tsx';

export interface ButtonGroupProps
  extends Pick<ButtonProps, 'size' | 'variant' | 'intent' | 'disabled' | 'className' | 'children'>,
    ButtonGroupStyleProps {}

export function ButtonGroup(props: ButtonGroupProps) {
  const [local, variantProps] = splitPropsVariants(props, buttonGroupStyle.variantKeys);

  const { className, children, size, variant, intent, disabled, ...others } = local;

  const slots = useMemo(() => buttonGroupStyle(variantProps), [variantProps]);

  const baseTw = slots.base({ class: [buttonGroupStaticClass('base'), className] });

  return (
    <div className={baseTw} {...others}>
      <ButtonContext.Provider value={{ size, variant, intent, disabled }}>{children}</ButtonContext.Provider>
    </div>
  );
}
