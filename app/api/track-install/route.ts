import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { z } from "zod";
import { checkRateLimit, getClientIp, hashIp } from "@/lib/security";

const schema = z.object({
  app_id: z.string().uuid(),
  device_type: z.enum(["android", "ios", "desktop"]).optional(),
  country: z.string().max(10).optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(`track:${ip}`, 20, 60_000)) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const result = schema.safeParse(body);
  if (!result.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const { app_id, device_type, country } = result.data;
  const ua = req.headers.get("user-agent") || "";
  const ipHash = hashIp(ip);

  await sql`
    INSERT INTO install_events (app_id, device_type, country, ip_hash, user_agent)
    VALUES (${app_id}, ${device_type || "unknown"}, ${country || null}, ${ipHash}, ${ua.substring(0, 500)})
  `;

  return NextResponse.json({ ok: true });
}
