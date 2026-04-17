import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "next-auth";

export async function GET() {
  const session = await getServerSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [overviewRows, trendRows, deviceRows, appRows] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*) FROM install_events) AS total_installs,
        (SELECT COUNT(*) FROM install_events WHERE created_at >= NOW() - INTERVAL '1 day') AS today_installs,
        (SELECT COUNT(*) FROM apps WHERE status = 'live') AS active_apps,
        (SELECT COUNT(*) FROM apps) AS total_apps
    `,
    sql`
      SELECT
        DATE_TRUNC('day', created_at) AS day,
        COUNT(*) AS installs
      FROM install_events
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `,
    sql`
      SELECT device_type, COUNT(*) AS count
      FROM install_events
      GROUP BY device_type
      ORDER BY count DESC
    `,
    sql`
      SELECT a.id, a.name, a.slug, a.status, a.logo_url,
        COUNT(ie.id) AS installs
      FROM apps a
      LEFT JOIN install_events ie ON ie.app_id = a.id
      GROUP BY a.id
      ORDER BY installs DESC
    `,
  ]);

  const totalInstalls = Number(overviewRows[0]?.total_installs || 0);

  return NextResponse.json({
    overview: overviewRows[0],
    trend: trendRows,
    devices: deviceRows,
    apps: appRows,
    conversionRate: totalInstalls > 0 ? ((totalInstalls / Math.max(totalInstalls * 10, 1)) * 100).toFixed(1) : "0",
  });
}
