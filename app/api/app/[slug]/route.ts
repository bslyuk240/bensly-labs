import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { z } from "zod";

const schema = z.object({ slug: z.string().min(2).max(50) });

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const result = schema.safeParse({ slug });
  if (!result.success) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const rows = await sql`
    SELECT a.*,
      COALESCE((SELECT COUNT(*) FROM install_events WHERE app_id = a.id), 0) AS install_count,
      json_agg(
        json_build_object(
          'id', v.id, 'platform', v.platform, 'version', v.version,
          'apk_path', v.apk_path, 'play_store_url', v.play_store_url,
          'app_store_url', v.app_store_url, 'pwa_url', v.pwa_url,
          'is_latest', v.is_latest, 'release_notes', v.release_notes
        ) ORDER BY v.created_at DESC
      ) FILTER (WHERE v.id IS NOT NULL) AS versions
    FROM apps a
    LEFT JOIN app_versions v ON v.app_id = a.id AND v.is_latest = true
    WHERE a.slug = ${slug} AND a.status != 'draft'
    GROUP BY a.id
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  return NextResponse.json(rows[0], {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate" },
  });
}
