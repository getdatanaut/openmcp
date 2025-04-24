import { describe, expect, it } from 'vitest';

import { hexToUint8Array, uint8ArrayToHex } from '../utils.ts';

describe('hexToUint8Array', () => {
  it('should convert a valid hex string to Uint8Array', () => {
    expect(hexToUint8Array('deadbeef')).toEqual(new Uint8Array([222, 173, 190, 239]));
  });

  it('should return an empty Uint8Array for an empty string', () => {
    expect(hexToUint8Array('')).toEqual(new Uint8Array([]));
  });

  it('should throw an error for a hex string with an odd length', () => {
    expect(() => hexToUint8Array('abc')).toThrow();
  });

  it('should throw an error for a hex string with invalid characters', () => {
    expect(() => hexToUint8Array('zzzz')).toThrow();
  });
});

describe('uint8ArrayToHex', () => {
  it('should convert a Uint8Array to a valid hex string', () => {
    expect(uint8ArrayToHex(new Uint8Array([222, 173, 190, 239]))).toBe('deadbeef');
  });

  it('should return an empty string for an empty Uint8Array', () => {
    expect(uint8ArrayToHex(new Uint8Array([]))).toBe('');
  });

  it('should handle single-byte Uint8Array correctly', () => {
    expect(uint8ArrayToHex(new Uint8Array([15]))).toBe('0f');
  });
});
