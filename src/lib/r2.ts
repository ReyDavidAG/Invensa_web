import "server-only";

import { randomUUID } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { getServerEnv } from "@/lib/env";

const PRESIGN_EXPIRES_SECONDS = 300;

let cachedClient: S3Client | null = null;

function getR2Client(): S3Client {
  if (cachedClient) return cachedClient;
  const env = getServerEnv();
  if (
    !env.R2_ACCOUNT_ID ||
    !env.R2_ACCESS_KEY_ID ||
    !env.R2_SECRET_ACCESS_KEY
  ) {
    throw new Error(
      "[r2] R2_ACCOUNT_ID, R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY must be set.",
    );
  }
  cachedClient = new S3Client({
    region: env.R2_REGION,
    endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });
  return cachedClient;
}

const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp"]);

export function buildProductKey(input: {
  productId?: string;
  filename: string;
}): string {
  const rawExt = input.filename.split(".").pop()?.toLowerCase() ?? "";
  const ext = rawExt === "jpeg" ? "jpg" : rawExt;
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Unsupported file extension: ${rawExt || "(none)"}`);
  }
  const folder = input.productId
    ? input.productId
    : `tmp/${new Date().toISOString().slice(0, 10)}`;
  return `products/${folder}/${randomUUID()}.${ext}`;
}

export async function buildPutObjectUrl(input: {
  key: string;
  contentType: string;
  contentLength: number;
}): Promise<{ url: string; expiresIn: number }> {
  const env = getServerEnv();
  const url = await getSignedUrl(
    getR2Client(),
    new PutObjectCommand({
      Bucket: env.R2_BUCKET,
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.contentLength,
    }),
    { expiresIn: PRESIGN_EXPIRES_SECONDS },
  );
  return { url, expiresIn: PRESIGN_EXPIRES_SECONDS };
}
