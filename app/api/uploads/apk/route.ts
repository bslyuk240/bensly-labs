import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import {
  createPresignedUpload,
  getRemoteConfig,
  uploadApkAsset,
} from "@/lib/storage";

const initSchema = z.object({
  fileName: z.string().min(1).max(255),
  contentType: z.string().optional(),
  size: z.number().int().positive().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") || "";
  const remoteConfig = getRemoteConfig();

  if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    const result = initSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
    }

    if (!remoteConfig) {
      return NextResponse.json({
        ok: true,
        mode: "server",
      });
    }

    const uploaded = await createPresignedUpload(
      result.data.fileName,
      result.data.contentType || "application/vnd.android.package-archive"
    );

    return NextResponse.json({
      ok: true,
      mode: "direct",
      key: uploaded.key,
      path: uploaded.url,
      uploadUrl: uploaded.uploadUrl,
      contentType: uploaded.contentType,
      provider: uploaded.provider,
      name: result.data.fileName,
      size: result.data.size ?? null,
    });
  }

  const formData = await req.formData().catch(() => null);
  const file = formData?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  const isApk =
    file.name.toLowerCase().endsWith(".apk") ||
    file.type === "application/vnd.android.package-archive";

  if (!isApk) {
    return NextResponse.json({ error: "Only APK files are allowed" }, { status: 400 });
  }

  const maxSize = 250 * 1024 * 1024;
  if (file.size > maxSize) {
    return NextResponse.json({ error: "File is too large" }, { status: 413 });
  }

  if (remoteConfig) {
    return NextResponse.json(
      {
        error:
          "Use the presigned direct upload flow for APKs. The browser should request JSON init first.",
      },
      { status: 400 }
    );
  }

  let uploaded;
  try {
    uploaded = await uploadApkAsset(file);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to upload APK to object storage",
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    mode: "server",
    path: uploaded.url,
    key: uploaded.key,
    provider: uploaded.provider,
    name: file.name,
    size: file.size,
  });
}
