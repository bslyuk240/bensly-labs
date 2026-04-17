import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { z } from "zod";
import { getServerSession } from "next-auth";

const createSchema = z.object({
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  logo_url: z.string().url().optional().or(z.literal("")),
  status: z.enum(["draft", "beta", "live"]).optional(),
});

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const apps = await sql`
    SELECT a.*,
      COALESCE((SELECT COUNT(*) FROM install_events WHERE app_id = a.id), 0) AS install_count,
      (SELECT COUNT(*) FROM app_versions WHERE app_id = a.id) AS version_count
    FROM apps a
    ORDER BY a.created_at DESC
  `;

  return NextResponse.json(apps);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const result = createSchema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: result.error.flatten() }, { status: 400 });
  }

  const { slug, name, description, logo_url, status } = result.data;

  const rows = await sql`
    INSERT INTO apps (slug, name, description, logo_url, status)
    VALUES (${slug}, ${name}, ${description || null}, ${logo_url || null}, ${status || "draft"})
    RETURNING *
  `;

  return NextResponse.json(rows[0], { status: 201 });
}
