import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, getClientIp, hashIp } from "@/lib/security";

const schema = z.object({ slug: z.string().min(2).max(50) });

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`download:${ip}`, 15, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const slug = req.nextUrl.searchParams.get("slug") || "";
  const result = schema.safeParse({ slug });
  if (!result.success) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }

  const rows = await sql`
    SELECT a.id, a.name, v.apk_path, v.play_store_url, v.platform
    FROM apps a
    JOIN app_versions v ON v.app_id = a.id AND v.is_latest = true AND v.platform = 'android'
    WHERE a.slug = ${slug} AND a.status != 'draft'
    LIMIT 1
  `;

  if (!rows.length) {
    return NextResponse.json({ error: "App not found" }, { status: 404 });
  }

  const app = rows[0];

  // Log the install event
  const ua = req.headers.get("user-agent") || "";
  const ipHash = hashIp(ip);
  await sql`
    INSERT INTO install_events (app_id, device_type, ip_hash, user_agent)
    VALUES (${app.id}, 'android', ${ipHash}, ${ua.substring(0, 500)})
  `;

  // Redirect to APK path or Play Store URL
  const destination = app.apk_path || app.play_store_url;
  if (!destination) {
    return NextResponse.json({ error: "No download available" }, { status: 404 });
  }

  return NextResponse.redirect(new URL(destination, req.url));
}
