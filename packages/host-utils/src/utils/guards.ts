export function isEnoentError(error: unknown): error is NodeJS.ErrnoException {
  return (
    typeof error === 'object' && error !== null && 'code' in error && (error as { code?: string }).code === 'ENOENT'
  );
}
