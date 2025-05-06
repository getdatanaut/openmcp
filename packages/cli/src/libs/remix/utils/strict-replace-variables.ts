import { replaceVariables } from '@openmcp/utils';

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export default function strictReplaceVariables(input: string, values: unknown): string {
  const obj = isPlainObject(values) ? values : {};
  return replaceVariables(
    input,
    new Proxy(obj, {
      get(target, p, recv) {
        if (typeof p === 'symbol') {
          return Reflect.get(target, p, recv);
        }

        if (!Reflect.has(target, p)) {
          throw new Error(`Missing variable: ${String(p)}`);
        }

        return Reflect.get(target, p, recv);
      },
    }),
  );
}
