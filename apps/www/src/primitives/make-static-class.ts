export function makeStaticClass<T extends string>(component: string) {
  return function (slot: 'base' | T) {
    if (slot === 'base') return toKebabCase(`ui-${component}`);

    return toKebabCase(`ui-${component}-${slot}`);
  };
}

function toKebabCase(value: string) {
  return value
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\s+/g, '-')
    .toLowerCase();
}
