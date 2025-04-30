import { faCheckCircle, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { type ExternalToast, toast as sonnerToast } from 'sonner';

import { Icon } from '../Icon/icon.tsx';
import { Toast, type ToastCompProps } from './toast.tsx';

export interface ToastProps extends Omit<ToastCompProps, 'id' | 'title'> {
  onDismiss?: ExternalToast['onDismiss'];
  onAutoClose?: ExternalToast['onAutoClose'];
}

export function toast(title: string, { onAutoClose, onDismiss, ...toast }: ToastProps = {}) {
  return sonnerToast.custom(id => <Toast id={id} title={title} {...toast} />, { onAutoClose, onDismiss });
}

function toastSuccess(title: string, props?: ToastProps) {
  return toast(title, { icon: <Icon icon={faCheckCircle} className="ak-text-secondary" />, ...props });
}

function toastError(title: string, props?: ToastProps) {
  return toast(title, { icon: <Icon icon={faExclamationTriangle} className="ak-text-danger" />, ...props });
}

toast.success = toastSuccess;
toast.error = toastError;
