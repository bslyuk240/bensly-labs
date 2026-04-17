import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

type RemoteStorageConfig = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  endpoint?: string;
  publicBaseUrl?: string;
  forcePathStyle: boolean;
  prefix: string;
};

type UploadResult = {
  key: string;
  url: string;
  provider: "s3" | "local";
};

function sanitizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildKey(fileName: string, prefix: string): string {
  const cleanName = sanitizeFileName(fileName) || "app.apk";
  const id = randomUUID().slice(0, 8);
  return `${prefix.replace(/\/+$/g, "")}/${Date.now()}-${id}-${cleanName}`;
}

function getRemoteConfig(): RemoteStorageConfig | null {
  const bucket = process.env.S3_BUCKET?.trim();
  const region = process.env.S3_REGION?.trim() || "auto";
  const accessKeyId = process.env.S3_ACCESS_KEY_ID?.trim();
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY?.trim();

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    bucket,
    region,
    accessKeyId,
    secretAccessKey,
    endpoint: process.env.S3_ENDPOINT?.trim() || undefined,
    publicBaseUrl: process.env.S3_PUBLIC_BASE_URL?.trim() || undefined,
    forcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    prefix: process.env.S3_PREFIX?.trim() || "apks",
  };
}

function resolvePublicUrl(config: RemoteStorageConfig, key: string): string {
  if (config.publicBaseUrl) {
    return `${config.publicBaseUrl.replace(/\/+$/g, "")}/${key}`;
  }

  if (!config.endpoint && config.region && config.region !== "auto") {
    return `https://${config.bucket}.s3.${config.region}.amazonaws.com/${key}`;
  }

  if (config.endpoint?.includes("amazonaws.com")) {
    return `${config.endpoint.replace(/\/+$/g, "")}/${config.bucket}/${key}`;
  }

  throw new Error(
    "Set S3_PUBLIC_BASE_URL to a public bucket URL or custom domain for object storage."
  );
}

async function uploadRemote(file: File, config: RemoteStorageConfig): Promise<UploadResult> {
  const key = buildKey(file.name, config.prefix);
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    endpoint: config.endpoint,
    forcePathStyle: config.forcePathStyle,
  });

  await client.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: key,
      Body: Buffer.from(await file.arrayBuffer()),
      ContentType: file.type || "application/vnd.android.package-archive",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  return {
    key,
    url: resolvePublicUrl(config, key),
    provider: "s3",
  };
}

async function uploadLocal(file: File): Promise<UploadResult> {
  const key = buildKey(file.name, "apks");
  const uploadsDir = join(process.cwd(), "public", "uploads", "apks");
  await mkdir(uploadsDir, { recursive: true });

  const filePath = join(uploadsDir, key.split("/").pop() || "app.apk");
  await writeFile(filePath, Buffer.from(await file.arrayBuffer()));

  return {
    key,
    url: `/uploads/apks/${key.split("/").pop() || "app.apk"}`,
    provider: "local",
  };
}

export async function uploadApkAsset(file: File): Promise<UploadResult> {
  const remoteConfig = getRemoteConfig();

  if (remoteConfig) {
    return uploadRemote(file, remoteConfig);
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Object storage is not configured. Set S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, and S3_PUBLIC_BASE_URL."
    );
  }

  return uploadLocal(file);
}
