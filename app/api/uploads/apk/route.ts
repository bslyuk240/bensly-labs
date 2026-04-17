import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { uploadApkAsset } from "@/lib/storage";

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
    path: uploaded.url,
    key: uploaded.key,
    provider: uploaded.provider,
    name: file.name,
    size: file.size,
  });
}
