import * as AK from '@ariakit/react';
import { useDialogDescription } from '@ariakit/react-core/dialog/dialog-description';
import { useDialogHeading } from '@ariakit/react-core/dialog/dialog-heading';
import { useEvent } from '@ariakit/react-core/utils/hooks';
import { type MouseEvent, type ReactElement, type Ref, useCallback, useMemo } from 'react';

import {
  type ContextValue,
  createContext,
  defaultSlot,
  GenericSlotContext,
  Provider,
  useContextProps,
} from '../../utils/context.tsx';
import { type ChildrenWithRenderProps, runIfFn } from '../../utils/function.ts';
import { splitPropsVariants } from '../../utils/split-props-variants.ts';
import { Button, type ButtonProps } from '../Button/button.tsx';
import { type DialogSlotProps, dialogStaticClass, dialogStyle, type DialogStyleProps } from './dialog.styles.ts';
import { DialogInternalContext } from './internal-context.tsx';

type AKProps = Omit<AK.DialogOptions, 'store' | 'onChange' | 'children' | 'backdrop' | 'onToggle'> &
  Pick<AK.DialogProps, 'className'>;

export interface DialogProps extends AKProps, DialogStyleProps, DialogSlotProps {
  isOpen?: AK.DialogStoreProps['open'];
  onToggle?: AK.DialogStoreProps['setOpen'];
  children?: ChildrenWithRenderProps<DialogRenderProps>;

  /**
   * The pressable element that will trigger the Dialog.
   * Should be a button in most cases.
   */
  triggerElem?: ReactElement;

  /**
   * Whether to enable the focus trap region.
   * @default true
   */
  enableFocusTrap?: boolean;

  ref?: Ref<HTMLDivElement>;
}

export interface DialogRenderProps {
  close: () => void;
}

export const [DialogContext, useDialogContext] = createContext<ContextValue<DialogProps, HTMLDivElement>>({
  name: 'DialogContext',
  strict: false,
});

export const DialogSlot = {
  title: 'title',
  description: 'description',
} as const;

export function Dialog({ ref, ...originalProps }: DialogProps) {
  [originalProps, ref] = useContextProps(originalProps, DialogContext, ref, { unmountOnHide: true, modal: true });

  const { triggerElem, isOpen, onToggle, ...props } = originalProps;

  const dialog = AK.useDialogStore({
    open: isOpen,
    setOpen: onToggle,
  });

  const renderDialog = AK.useStoreState(dialog, state => state.open || state.animating);

  return (
    <AK.DialogProvider store={dialog}>
      {triggerElem ? <AK.DialogDisclosure render={triggerElem} /> : null}
      {renderDialog && <DialogContent {...props} />}
    </AK.DialogProvider>
  );
}

function DialogContent({ ref, ...originalProps }: DialogProps) {
  const dialog = AK.useDialogContext()!;

  const [{ className, classNames, children, onToggle, enableFocusTrap = true, ...props }, variantProps] =
    splitPropsVariants(originalProps, dialogStyle.variantKeys);

  const close = useCallback(() => dialog.setOpen(false), [dialog]);

  const slots = useMemo(() => dialogStyle(variantProps), Object.values(variantProps));
  const baseTw = slots.base({ class: [dialogStaticClass('base'), className] });
  const wrapperTw = slots.wrapper({ class: [dialogStaticClass('wrapper'), classNames?.wrapper] });
  const backdropTw = slots.backdrop({ class: [dialogStaticClass('backdrop'), classNames?.backdrop] });

  return (
    <DialogInternalContext.Provider value={{ slots, classNames }}>
      <AK.Dialog
        {...props}
        // @ts-expect-error ignore
        onToggle={onToggle}
        ref={ref}
        className={baseTw}
        backdrop={<div className={backdropTw} />}
        render={props => (
          <div className={wrapperTw}>
            <div {...props} />
          </div>
        )}
      >
        <AK.FocusTrapRegion enabled={enableFocusTrap}>
          <DialogInner close={close}>{children}</DialogInner>
        </AK.FocusTrapRegion>
      </AK.Dialog>
    </DialogInternalContext.Provider>
  );
}

function DialogInner({ children, close }: Pick<DialogProps, 'children'> & DialogRenderProps) {
  const {
    // @ts-expect-error pull render prop out, not needed

    render: _render1,
    ...headingProps
  } = useDialogHeading();

  const {
    // @ts-expect-error pull render prop out, not needed

    render: _render2,
    ...descriptionProps
  } = useDialogDescription();

  return (
    <Provider
      values={[
        [
          GenericSlotContext,
          {
            slots: {
              [defaultSlot]: {},
              [DialogSlot.title]: headingProps,
              [DialogSlot.description]: descriptionProps,
            },
          },
        ],
      ]}
    >
      {runIfFn(children, { close })}
    </Provider>
  );
}

export interface DialogDismissProps extends ButtonProps {}

/**
 * Supports passing props to the button when the form is valid or submitting.
 *
 * By default, will disable the button when the form is submitting.
 *
 * By default, will set accessibleWhenDisabled=true if the button type is "submit".
 */
export function DialogDismiss(props: DialogDismissProps) {
  const dialog = AK.useDialogContext();
  if (!dialog) throw new Error('DialogDismissButton must be used within a Dialog');

  const onClickProp = props.onClick;

  const onClick = useEvent((event: MouseEvent<HTMLButtonElement>) => {
    onClickProp?.(event);
    if (event.defaultPrevented) return;
    dialog.hide();
  });

  return <Button data-dialog-dismiss="" {...props} onClick={onClick} />;
}
