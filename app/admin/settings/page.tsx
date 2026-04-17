import { requireAdminSession } from "@/lib/auth";

export default async function SettingsPage() {
  const session = await requireAdminSession();

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto w-full">
      <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-6">Settings</h2>

      <div className="space-y-4">
        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
          <h3 className="font-bold text-slate-900 mb-4">Account</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(199,196,216,0.15)" }}>
              <div>
                <p className="text-sm font-semibold text-slate-700">Admin User</p>
                <p className="text-xs text-slate-400">{session.user?.email}</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">Platform Admin</span>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-semibold text-slate-700">Session Strategy</p>
                <p className="text-xs text-slate-400">JWT, 24 hours</p>
              </div>
              <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-semibold">Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
          <h3 className="font-bold text-slate-900 mb-4">Platform</h3>
          <div className="space-y-3">
            {[
              { label: "Rate Limiting", value: "15 requests/min per IP", status: "enabled" },
              { label: "IP Hashing", value: "SHA-256 + salt", status: "enabled" },
              { label: "Download Security", value: "Signed URL redirect", status: "enabled" },
              { label: "Input Validation", value: "Zod schema validation", status: "enabled" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-3" style={{ borderBottom: "1px solid rgba(199,196,216,0.1)" }}>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                  <p className="text-xs text-slate-400">{item.value}</p>
                </div>
                <span className="text-xs text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full font-semibold"> {item.status}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
          <h3 className="font-bold text-slate-900 mb-2">Database</h3>
          <p className="text-xs text-slate-500 mb-4">Neon PostgreSQL  Serverless</p>
          <div className="bg-slate-900 rounded-xl p-4 font-mono text-xs text-emerald-400 overflow-auto">
            ep-sparkling-frost-am4qnr5o.us-east-1.aws.neon.tech
          </div>
        </div>
      </div>
    </div>
  );
}

