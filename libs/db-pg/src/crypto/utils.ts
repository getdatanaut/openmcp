export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error('Invalid hex string length');
  }

  const length = hex.length / 2;
  const array = new Uint8Array(length);
  for (let i = 0; i < length; i++) {
    const number = Number.parseInt(hex.substr(i * 2, 2), 16);
    if (Number.isNaN(number)) {
      throw new Error('Invalid hex string');
    }
    array[i] = number;
  }
  return array;
}

export function uint8ArrayToHex(array: Uint8Array): string {
  return Array.from(array).map(toHexString).join('');
}

function toHexString(byte: Uint8Array[number]): string {
  return byte.toString(16).padStart(2, '0');
}
