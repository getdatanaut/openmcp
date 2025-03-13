import { type ClassNameValue, extendTailwindMerge, twJoin } from 'tailwind-merge';

type ClassValue = ClassArray | ClassDictionary | string | number | bigint | null | boolean | undefined;
type ClassDictionary = Record<string, any>;
type ClassArray = ClassValue[];

export type TW_STR = 'TW_STR';

/**
 * Use when you need cx style merging, but for non-tailwind classes, since eslint and vscode
 * are configured to check / autocomplete the `tn` function.
 */
const cn = twJoin;

const tn = twJoin as (...classLists: ClassNameValue[]) => TW_STR;

/**
 * Optionally customize the twMerge config. Use this everywhere!
 * Do not use the default twMerge from `tailwind-merge` directly.
 *
 * Named txMerge rather than twMerge to clarify.
 *
 * https://github.com/dcastil/tailwind-merge/blob/v2.0.0/docs/configuration.md
 */
const twMergeConfig: Partial<Parameters<typeof extendTailwindMerge>[0]> = {
  extend: {
    // ↓ Add values to existing theme scale or create a new one
    // spacing: ['sm', 'md', 'lg'],
    // theme: {
    //   spacing: ['form-sm', 'form-md', 'form-lg', 'form-xl', 'form-2xl'],
    // },
    // // ↓ Add values to existing class groups or define new ones
    // classGroups: {
    //     foo: ['foo', 'foo-2', { 'bar-baz': ['', '1', '2'] }],
    //     bar: [{ qux: ['auto', (value) => Number(value) >= 1000] }],
    //     baz: ['baz-sm', 'baz-md', 'baz-lg'],
    // },
    // classGroups: {
    //   shadow: [{ shadow: ['border'] }],
    // },
    // // ↓ Here you can define additional conflicts across class groups
    // conflictingClassGroups: {
    //     foo: ['bar'],
    // },
    // // ↓ Define conflicts between postfix modifiers and class groups
    // conflictingClassGroupModifiers: {
    //     baz: ['bar'],
    // },
  },
};
const twMerge = extendTailwindMerge(twMergeConfig);

export type { ClassNameValue };
export { cn, tn, twMerge, twMergeConfig };
