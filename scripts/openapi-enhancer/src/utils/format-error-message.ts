import { AssertionError } from 'node:assert/strict';

export default function formatErrorMessage(error: unknown): string {
  if (error instanceof AssertionError) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && error['message']) {
    return String((error as { message: unknown }).message);
  }

  return String(error);
}
