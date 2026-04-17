import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { z } from "zod";
import { getServerSession } from "next-auth";

const updateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().optional(),
  logo_url: z.string().optional(),
  screenshots: z.array(z.string().url()).optional(),
  status: z.enum(["draft", "beta", "live"]).optional(),
  rating: z.number().min(0).max(5).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const rows = await sql`
    SELECT a.*,
      COALESCE((SELECT COUNT(*) FROM install_events WHERE app_id = a.id), 0) AS install_count,
      json_agg(
        json_build_object(
          'id', v.id, 'platform', v.platform, 'version', v.version,
          'apk_path', v.apk_path, 'play_store_url', v.play_store_url,
          'app_store_url', v.app_store_url, 'pwa_url', v.pwa_url,
          'is_latest', v.is_latest, 'release_notes', v.release_notes,
          'created_at', v.created_at
        ) ORDER BY v.created_at DESC
      ) FILTER (WHERE v.id IS NOT NULL) AS versions
    FROM apps a
    LEFT JOIN app_versions v ON v.app_id = a.id
    WHERE a.id = ${id}
    GROUP BY a.id
  `;

  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const result = updateSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { name, description, logo_url, screenshots, status, rating } = result.data;

  const rows = await sql`
    UPDATE apps SET
      name = COALESCE(${name ?? null}, name),
      description = COALESCE(${description ?? null}, description),
      logo_url = COALESCE(${logo_url ?? null}, logo_url),
      screenshots = COALESCE(${screenshots ?? null}, screenshots),
      status = COALESCE(${status ?? null}, status),
      rating = COALESCE(${rating ?? null}, rating)
    WHERE id = ${id}
    RETURNING *
  `;

  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await sql`DELETE FROM apps WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
