import { Toaster as BaseToaster, type ToasterProps as BaseToasterProps } from 'sonner';

import { twMerge } from '../../utils/tw.ts';

export interface ToasterProps extends Pick<BaseToasterProps, 'duration' | 'position' | 'className'> {}

export function Toaster({ className, ...props }: ToasterProps) {
  return (
    <BaseToaster
      duration={5000}
      position="bottom-center"
      className={twMerge('flex justify-center', className)}
      {...props}
    />
  );
}
