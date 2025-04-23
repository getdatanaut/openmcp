import { oc, type } from '@orpc/contract';

export const base = oc.errors({
  UNAUTHORIZED: {},
  INPUT_VALIDATION_FAILED: {
    status: 422,
    message: 'Input validation failed',
    data: type<{
      formErrors: string[];
      fieldErrors: Record<string, string[]>;
    }>(),
  },
  BAD_REQUEST: {},
});
