import { connectionProvider, PushProcessor } from '@rocicorp/zero/pg';
import type { ReadonlyJSONValue } from 'drizzle-zero';
import { createLocalJWKSet, jwtVerify } from 'jose';
import { JOSEError } from 'jose/errors';
import type postgres from 'postgres';

import type { AuthData } from '~shared/auth.ts';
import { schema } from '~shared/zero-schema.ts';

import { createServerMutators, type PostCommitTask } from './server-mutators.ts';

export async function handler({
  req,
  getJwks,
  sql,
  publicUrl,
}: {
  req: Request;
  getJwks: () => Promise<{ keys: any[] }>;
  sql: postgres.Sql;
  publicUrl: string;
}) {
  const url = new URL(req.url);
  const processor = new PushProcessor(schema, connectionProvider(sql));

  const body = await req.json<ReadonlyJSONValue>();

  const validateResult = await validateToken({
    getJwks,
    headers: req.headers,
    issuer: publicUrl,
    audience: publicUrl,
  });

  if (!validateResult) {
    return new Response(null, { status: 401 });
  }

  const { payload } = validateResult;

  const result = await handlePush({
    processor,
    authData: payload,
    params: Object.fromEntries(url.searchParams),
    body,
  });

  return Response.json(result);
}

async function validateToken({
  getJwks,
  headers,
  issuer,
  audience,
}: {
  getJwks: () => Promise<{ keys: any[] }>;
  headers: Headers;
  issuer: string;
  audience: string;
}) {
  const token = headers.get('Authorization')?.replace('Bearer ', '');
  // Cannot perform any mutations without auth
  if (!token) {
    return null;
  }

  const { keys } = await getJwks();

  const JWKS = createLocalJWKSet({ keys });

  try {
    return await jwtVerify<AuthData>(token, JWKS, { issuer, audience });
  } catch (err) {
    if (err instanceof JOSEError) {
      // Handle specific errors as needed...
    } else {
      console.error('Token validation unknown failure:', err);
    }

    return null;
  }
}

async function handlePush({
  processor,
  authData,
  params,
  body,
}: {
  processor: PushProcessor<typeof schema, any, any>;
  authData: AuthData | undefined;
  params: Record<string, string>;
  body: ReadonlyJSONValue;
}) {
  const postCommitTasks: PostCommitTask[] = [];
  const mutators = createServerMutators(authData, postCommitTasks);

  const response = await processor.process(mutators, params, body);

  await Promise.all(postCommitTasks.map(task => task()));

  return response;
}
