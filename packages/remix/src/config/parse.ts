import { type Config, ConfigSchema } from './schemas.ts';

export default function parseConfig(config: unknown): Config {
  const err = ConfigSchema.safeParse(config);
  if (!err.success) {
    throw new Error(
      `Invalid config: ${err.error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`).join(', ')}`,
    );
  }

  return err.data;
}
