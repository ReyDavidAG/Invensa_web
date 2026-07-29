/* Hallmark · locked system applied · src/lib/r2/verify.ts
 * HeadObject check used by finalize steps to confirm an upload landed before
 * we persist the public URL into the database.
 */

import "server-only";

import { HeadObjectCommand, type ServiceInputTypes } from "@aws-sdk/client-s3";

import { getServerEnv } from "@/lib/env";

import { getR2Client } from "./client";

export async function objectExists(key: string): Promise<boolean> {
  const env = getServerEnv();
  try {
    await getR2Client().send(
      new HeadObjectCommand({
        Bucket: env.R2_BUCKET,
        Key: key,
      } satisfies ServiceInputTypes),
    );
    return true;
  } catch (err: unknown) {
    if (isNotFound(err)) return false;
    throw err;
  }
}

function isNotFound(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const meta = (err as { $metadata?: { httpStatusCode?: number } }).$metadata;
  return meta?.httpStatusCode === 404;
}