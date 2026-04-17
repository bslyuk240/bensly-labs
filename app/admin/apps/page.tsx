import { sql } from "@/lib/db";
import { requireAdminSession } from "@/lib/auth";
import Link from "next/link";

export default async function AppsPage() {
  await requireAdminSession();

  const apps = await sql`
    SELECT a.*, COUNT(ie.id)::int AS installs
    FROM apps a
    LEFT JOIN install_events ie ON ie.app_id = a.id
    GROUP BY a.id
    ORDER BY a.created_at DESC
  `;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Apps</h2>
          <p className="text-sm text-slate-500 mt-1">{apps.length} app{apps.length !== 1 ? "s" : ""} registered</p>
        </div>
        <Link
          href="/admin/apps/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95"
          style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}
        >
          <span>+</span> Create App
        </Link>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
        {apps.map((app) => (
          <div key={app.id} className="bg-white rounded-xl p-5 shadow-sm hover:shadow-lg hover:shadow-indigo-500/5 transition-all group"
            style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center"
                style={{ background: "rgba(79,70,229,0.1)", border: "1px solid rgba(199,196,216,0.2)" }}>
                {app.logo_url ? (
                  <img src={app.logo_url} alt={app.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-indigo-600 text-xl font-bold">{app.name.charAt(0)}</span>
                )}
              </div>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                app.status === "live" ? "text-emerald-600 bg-emerald-500/10" :
                app.status === "beta" ? "text-indigo-600 bg-indigo-500/10" :
                "text-slate-500 bg-slate-100"
              }`}>
                {app.status}
              </span>
            </div>

            <h4 className="font-bold text-slate-900 mb-1">{app.name}</h4>
            <p className="text-xs text-slate-400 mb-1">/{app.slug}</p>
            {app.description && (
              <p className="text-xs text-slate-500 mb-3 line-clamp-2">{app.description}</p>
            )}
            <p className="text-xs text-slate-400">{Number(app.installs).toLocaleString()} installs</p>

            <div className="mt-4 pt-3 flex items-center justify-between gap-2"
              style={{ borderTop: "1px solid rgba(199,196,216,0.15)" }}>
              <Link
                href={`/apps/${app.slug}`}
                target="_blank"
                className="text-xs text-slate-400 hover:text-indigo-500 transition-colors"
              >
                Preview 
              </Link>
              <div className="flex gap-2">
                <Link
                  href={`/admin/apps/${app.id}/versions`}
                  className="text-xs px-3 py-1 rounded-lg font-medium text-slate-600 hover:bg-slate-50 transition-colors"
                  style={{ border: "1px solid rgba(199,196,216,0.4)" }}
                >
                  Versions
                </Link>
                <Link
                  href={`/admin/apps/${app.id}`}
                  className="text-xs px-3 py-1 rounded-lg font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
                  style={{ border: "1px solid rgba(79,70,229,0.2)" }}
                >
                  Edit
                </Link>
              </div>
            </div>
          </div>
        ))}

        {/* Add New */}
        <Link href="/admin/apps/new"
          className="rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-indigo-500 transition-all"
          style={{ border: "2px dashed rgba(199,196,216,0.5)", minHeight: "200px" }}>
          <span className="text-4xl">+</span>
          <span className="text-sm font-bold">New App</span>
        </Link>
      </div>
    </div>
  );
}

