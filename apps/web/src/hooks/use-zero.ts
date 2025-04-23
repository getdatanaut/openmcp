import { createUseZero } from '@rocicorp/zero/react';

import type { Mutators } from '~shared/zero-mutators.ts';
import type { Schema } from '~shared/zero-schema.ts';

export const useZero = createUseZero<Schema, Mutators>();
