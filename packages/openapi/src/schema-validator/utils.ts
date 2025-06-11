export function getValueType(value: string): 'string';
export function getValueType(value: number): 'number';
export function getValueType(value: boolean): 'boolean';
export function getValueType(value: null): 'null';
export function getValueType(value: undefined): 'undefined';
export function getValueType(value: object): 'object';
export function getValueType(value: Array<unknown>): 'array';
export function getValueType(value: unknown): string;
export function getValueType(value: unknown): string {
  if (value === null) {
    return 'null';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  return typeof value;
}

export function stringifyValue(value: unknown): string {
  switch (getValueType(value)) {
    case 'object':
      return '{}Object';
    case 'array':
      return '[]Array';
    case 'string':
    case 'number':
    case 'boolean':
    case 'null':
      return JSON.stringify(value, null, 2);
    case 'undefined':
      return 'undefined';
    default:
      throw new Error('Invalid value type');
  }
}
