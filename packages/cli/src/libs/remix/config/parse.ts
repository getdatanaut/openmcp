import { type Config, ConfigSchema } from './schemas.ts';

export default function parseConfig(config: unknown): Config {
  const res = ConfigSchema.safeParse(config);
  if (!res.success) {
    throw new Error(
      `Invalid config: ${res.error.issues.map(issue => `${issue.path.join('.')} - ${issue.message}`).join(', ')}`,
    );
  }

  return res.data;
}
