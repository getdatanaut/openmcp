/**
 * Original credit to NextUI
 * https://github.com/nextui-org/nextui/blob/62d307117a4ef5464834289901fc8c7a87f59025/packages/core/system-rsc/src/utils.ts#L46
 *
 * Adjusted to solve for this issue: https://github.com/nextui-org/nextui/issues/1294#issuecomment-1725931575
 */

export const splitPropsVariants = <T extends {}, K extends keyof T>(
  props: T,
  variantKeys?: K[],
  defaultValues?: Partial<Pick<T, K>>,
  removeVariantProps = true,
): readonly [Omit<T, K>, Pick<T, K>] => {
  if (!variantKeys) {
    // @ts-expect-error ignore
    return [props, {}];
  }

  const picked = variantKeys.reduce((acc, key) => {
    return { ...acc, [key]: props[key] ?? defaultValues?.[key] };
  }, {});

  if (removeVariantProps) {
    const omitted = Object.keys(props)
      .filter(key => !variantKeys.includes(key as K))
      .reduce((acc, key) => ({ ...acc, [key]: props[key as keyof T] }), {});

    return [omitted, picked] as [Omit<T, K>, Pick<T, K>];
  } else {
    return [props, picked] as [T, Pick<T, K>];
  }
};
