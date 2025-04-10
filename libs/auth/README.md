# @libs/auth

When changing the core better-auth options, adding plugins, etc. Make sure to run `yarn workspace @libs/schema.generate`
and verify no changes were made to `libs/auth/src/schema.gen.ts`. IF there were changes, you must go to the relevant
schema in `@libs/db-pg` and make the appropriate adjustments, and then `yarn workspace pg migrate.generate` to generate
a migration.
