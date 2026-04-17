import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { z } from "zod";
import { getServerSession } from "next-auth";

const createSchema = z.object({
  platform: z.enum(["android", "ios", "web"]),
  version: z.string().min(1).max(50),
  apk_path: z.string().optional(),
  play_store_url: z.string().url().optional().or(z.literal("")),
  app_store_url: z.string().url().optional().or(z.literal("")),
  pwa_url: z.string().url().optional().or(z.literal("")),
  is_latest: z.boolean().optional(),
  release_notes: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: app_id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { platform, version, apk_path, play_store_url, app_store_url, pwa_url, is_latest, release_notes } = result.data;

  if (is_latest) {
    await sql`
      UPDATE app_versions SET is_latest = false
      WHERE app_id = ${app_id} AND platform = ${platform}
    `;
  }

  const rows = await sql`
    INSERT INTO app_versions (app_id, platform, version, apk_path, play_store_url, app_store_url, pwa_url, is_latest, release_notes)
    VALUES (${app_id}, ${platform}, ${version}, ${apk_path || null}, ${play_store_url || null}, ${app_store_url || null}, ${pwa_url || null}, ${is_latest ?? false}, ${release_notes || null})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
