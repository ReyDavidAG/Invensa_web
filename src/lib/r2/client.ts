/* Hallmark · locked system applied · src/lib/r2/client.ts
 * S3Client singleton bound to the R2 endpoint. Server-only — importing from
 * a client component fails the build via `server-only`.
 */

import "server-only";

import { S3Client } from "@aws-sdk/client-s3";

import { getServerEnv } from "@/lib/env";

let cached: S3Client | null = null;

export function getR2Client(): S3Client {
  if (cached) return cached;

  const env = getServerEnv();
  if (!env.R2_ACCOUNT_ID || !env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY) {
    throw new Error(
      "[r2/client] R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set in the environment.",
    );
  }

  cached = new S3Client({
    region: env.R2_REGION,
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  return cached;
}