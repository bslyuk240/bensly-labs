import { sql } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import Link from "next/link";

type StatItem = {
  label: string;
  value: string | number;
  icon: "apps" | "installs" | "versions" | "today";
  color: string;
  bg: string;
};

function StatGlyph({ name }: { name: StatItem["icon"] }) {
  const common = "h-5 w-5";

  switch (name) {
    case "apps":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
    case "installs":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v11" strokeLinecap="round" />
          <path d="m8 10 4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 19h14" strokeLinecap="round" />
        </svg>
      );
    case "versions":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 7h10" strokeLinecap="round" />
          <path d="M7 12h10" strokeLinecap="round" />
          <path d="M7 17h7" strokeLinecap="round" />
        </svg>
      );
    case "today":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M7 3v3" strokeLinecap="round" />
          <path d="M17 3v3" strokeLinecap="round" />
          <rect x="4" y="6" width="16" height="14" rx="3" />
          <path d="M8 12h8" strokeLinecap="round" />
        </svg>
      );
  }
}

function ActionGlyph({ name }: { name: "plus" | "chart" | "apps" }) {
  const common = "h-4 w-4";

  switch (name) {
    case "plus":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14" strokeLinecap="round" />
          <path d="M5 12h14" strokeLinecap="round" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 19V5" strokeLinecap="round" />
          <path d="M4 19h16" strokeLinecap="round" />
          <rect x="7" y="12" width="3" height="7" rx="1" />
          <rect x="12" y="9" width="3" height="10" rx="1" />
          <rect x="17" y="6" width="3" height="13" rx="1" />
        </svg>
      );
    case "apps":
      return (
        <svg viewBox="0 0 24 24" className={common} fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="4" y="4" width="6" height="6" rx="1.5" />
          <rect x="14" y="4" width="6" height="6" rx="1.5" />
          <rect x="4" y="14" width="6" height="6" rx="1.5" />
          <rect x="14" y="14" width="6" height="6" rx="1.5" />
        </svg>
      );
  }
}

function ArrowGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default async function DashboardPage() {
  await requireAdminSession();

  const [statsRows, trendRows, recentAppsRows] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*) FROM apps) AS total_apps,
        (SELECT COUNT(*) FROM install_events) AS total_installs,
        (SELECT COUNT(*) FROM app_versions WHERE is_latest = true) AS active_versions,
        (SELECT COUNT(*) FROM install_events WHERE created_at >= NOW() - INTERVAL '1 day')::int AS today_installs
    `,
    sql`
      SELECT DATE_TRUNC('day', created_at)::date AS day, COUNT(*) AS installs
      FROM install_events
      WHERE created_at >= NOW() - INTERVAL '14 days'
      GROUP BY day ORDER BY day ASC
    `,
    sql`
      SELECT a.id, a.name, a.slug, a.status, a.logo_url,
        COUNT(ie.id)::int AS installs
      FROM apps a
      LEFT JOIN install_events ie ON ie.app_id = a.id
      GROUP BY a.id ORDER BY a.created_at DESC LIMIT 6
    `,
  ]);

  const stats = statsRows[0];
  const maxInstalls = Math.max(...trendRows.map((r) => Number(r.installs)), 1);

  const statItems: StatItem[] = [
    { label: "Total Apps", value: stats.total_apps, icon: "apps", color: "#4f46e5", bg: "rgba(79,70,229,0.08)" },
    { label: "Total Installs", value: Number(stats.total_installs).toLocaleString(), icon: "installs", color: "#4ae176", bg: "rgba(74,225,118,0.08)" },
    { label: "Active Versions", value: stats.active_versions, icon: "versions", color: "#ffb695", bg: "rgba(255,182,149,0.08)" },
    { label: "Today Installs", value: stats.today_installs, icon: "today", color: "#4ae176", bg: "rgba(74,225,118,0.08)" },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 p-6 md:p-8">
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statItems.map((stat) => (
          <div key={stat.label} className="rounded-xl bg-white p-5 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
            <div className="mb-4 flex items-start justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-xl" style={{ background: stat.bg, color: stat.color }}>
                <StatGlyph name={stat.icon} />
              </div>
            </div>
            <p className="mb-1 text-sm font-medium text-slate-500">{stat.label}</p>
            <p className="text-3xl font-bold tracking-tight text-slate-900">{stat.value}</p>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 items-start gap-6 lg:grid-cols-3">
        <div className="overflow-hidden rounded-xl bg-white shadow-sm lg:col-span-2" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
          <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid rgba(199,196,216,0.15)" }}>
            <h2 className="text-base font-bold text-slate-900">Install Trends (14 days)</h2>
          </div>
          <div className="relative flex h-52 items-end gap-1.5 p-6">
            {trendRows.length > 0 ? (
              trendRows.map((row, i) => {
                const height = Math.max((Number(row.installs) / maxInstalls) * 100, 4);
                const isLast = i === trendRows.length - 1;

                return (
                  <div
                    key={i}
                    title={`${row.day}: ${row.installs} installs`}
                    className="flex-1 rounded-t-sm transition-all"
                    style={{
                      height: `${height}%`,
                      background: isLast ? "#4ae176" : "rgba(79,70,229,0.2)",
                      boxShadow: isLast ? "0 0 15px rgba(74,225,118,0.4)" : "none",
                    }}
                  />
                );
              })
            ) : (
              <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
                No data yet
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-xl bg-white p-6 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
          <h2 className="text-base font-bold text-slate-900">Quick Actions</h2>

          <Link
            href="/admin/apps/new"
            className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium text-white transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}
          >
            <ActionGlyph name="plus" />
            Create New App
          </Link>

          <Link
            href="/admin/analytics"
            className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium text-indigo-600 transition-all hover:bg-indigo-50"
            style={{ background: "rgba(79,70,229,0.07)", border: "1px solid rgba(79,70,229,0.15)" }}
          >
            <ActionGlyph name="chart" />
            View Analytics
          </Link>

          <Link
            href="/admin/apps"
            className="flex items-center gap-3 rounded-xl p-4 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
            style={{ border: "1px solid rgba(199,196,216,0.3)" }}
          >
            <ActionGlyph name="apps" />
            Manage Apps
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-slate-900">Active Applications</h2>
          <Link href="/admin/apps" className="flex items-center gap-1 text-sm font-medium text-indigo-600 hover:underline">
            View all
            <ArrowGlyph />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {recentAppsRows.map((app) => (
            <div
              key={app.id}
              className="group relative rounded-xl bg-white p-5 shadow-sm transition-all hover:shadow-lg hover:shadow-indigo-500/5"
              style={{ border: "1px solid rgba(199,196,216,0.2)" }}
            >
              <Link href={`/admin/apps/${app.id}`} className="absolute inset-0 rounded-xl" aria-label={`Open ${app.name} in admin`} />

              <div className="relative z-10 mb-4 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl" style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(199,196,216,0.2)" }}>
                  {app.logo_url ? (
                    <img src={app.logo_url} alt={app.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-xl font-bold text-indigo-600">{app.name.charAt(0)}</span>
                  )}
                </div>

                <span
                  className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    app.status === "live"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : app.status === "beta"
                        ? "bg-indigo-500/10 text-indigo-600"
                        : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {app.status}
                </span>
              </div>

              <div className="relative z-10">
                <h4 className="mb-1 font-bold text-slate-900">{app.name}</h4>
                <p className="text-xs text-slate-400">{Number(app.installs).toLocaleString()} installs</p>
                <div className="mt-4 flex items-center justify-between pt-3" style={{ borderTop: "1px solid rgba(199,196,216,0.15)" }}>
                  <Link href={`/apps/${app.slug}`} className="relative z-20 flex items-center gap-1 text-xs text-indigo-500 hover:underline" target="_blank" rel="noreferrer">
                    Public page
                    <ArrowGlyph />
                  </Link>
                  <ArrowGlyph />
                </div>
              </div>
            </div>
          ))}

          <Link
            href="/admin/apps/new"
            className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl bg-slate-50 p-5 text-slate-400 transition-all hover:bg-slate-100 hover:text-indigo-500"
            style={{ border: "2px dashed rgba(199,196,216,0.5)" }}
          >
            <ActionGlyph name="plus" />
            <span className="text-sm font-bold">New App</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
