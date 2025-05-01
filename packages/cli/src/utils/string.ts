import snakeCase from 'lodash-es/snakeCase.js';

export { default as slugify } from '@sindresorhus/slugify';

export function interpolable(value: string): string {
  return `{{${value}}}`;
}

export const screamCase = (value: string) => snakeCase(value).toUpperCase();
export { default as camelCase } from 'lodash-es/camelCase.js';

export function replaceWhitespaces(value: string, replacement = '-'): string {
  return value.replace(/\s+/g, replacement);
}
