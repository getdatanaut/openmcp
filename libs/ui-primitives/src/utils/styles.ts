import { tn } from './tw.ts';

export const focusStyles = tn('focus-visible:outline-[1.5px] focus-visible:outline-offset-[1.5px]');

export const inputFocusStyles = tn(
  `focus-visible:ak-outline-primary-2 focus-visible:outline-[1.5px] focus-visible:-outline-offset-1`,
);

export const focusWithinStyles = tn(
  'focus-visible-within:relative focus-visible-within:z-10',
  `focus-visible-within:ak-outline-primary focus-visible-within:outline-2 focus-visible-within:-outline-offset-1`,
);

export const formSpacing = {
  xs: tn('gap-1 px-1.5'),
  sm: tn('gap-1 px-2.5'),
  md: tn('gap-1.5 px-3.5'),
  lg: tn('gap-2 px-5'),
};

export const formSizes = {
  xs: tn('h-block-xs rounded-xs text-sm', formSpacing.xs),
  sm: tn('h-block-sm rounded-xs text-sm', formSpacing.sm),
  md: tn('h-block-md rounded-xs text-base', formSpacing.md),
  lg: tn('h-block-lg rounded-xs text-base', formSpacing.lg),
};
