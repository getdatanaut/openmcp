import { safeStringify } from '@stoplight/yaml';

export default function prettyStringify(value: unknown): string {
  return safeStringify(value, {
    indent: 2,
    lineWidth: -1,
    skipInvalid: true,
  });
}
