/* Hallmark · locked system applied · src/lib/r2/presign.ts
 * Generates a short-lived presigned PUT URL the browser can use to upload
 * directly to R2 without proxying through Next.
 */

import "server-only";

import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getServerEnv } from "@/lib/env";

import { getR2Client } from "./client";

const PRESIGN_EXPIRES_SECONDS = 300; // 5 minutes

export type BuildPutObjectUrlInput = {
  key: string;
  contentType: string;
  contentLength: number;
};

export type BuiltPresignedPut = {
  url: string;
  expiresIn: number;
};

export async function buildPutObjectUrl(
  input: BuildPutObjectUrlInput,
): Promise<BuiltPresignedPut> {
  const env = getServerEnv();
  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET,
    Key: input.key,
    ContentType: input.contentType,
    ContentLength: input.contentLength,
  });
  const url = await getSignedUrl(getR2Client(), command, {
    expiresIn: PRESIGN_EXPIRES_SECONDS,
  });
  return { url, expiresIn: PRESIGN_EXPIRES_SECONDS };
}