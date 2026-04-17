"use client";

type Overview = {
  total_installs: number;
  today_installs: number;
  active_apps: number;
  total_apps: number;
  conversion_rate: string;
};

type TrendPoint = { day: string; installs: number };
type DeviceBreakdown = { device_type: string; count: number };
type AppRow = { id: string; name: string; slug: string; status: string; logo_url: string | null; installs: number };

const DEVICE_COLORS: Record<string, string> = {
  android: "#4ae176",
  ios: "#c3c0ff",
  desktop: "#ffb695",
  unknown: "#464555",
};

const DEVICE_ICONS: Record<string, string> = {
  android: "",
  ios: "",
  desktop: "",
  unknown: "",
};

function TrendChart({ data }: { data: TrendPoint[] }) {
  const maxVal = Math.max(...data.map(d => d.installs), 1);
  const width = 500;
  const height = 140;
  const pad = { top: 16, right: 16, bottom: 24, left: 32 };

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-sm" style={{ color: "#c7c4d8" }}>
        No data yet for the last 30 days
      </div>
    );
  }

  const points = data.map((d, i) => {
    const x = pad.left + (i / Math.max(data.length - 1, 1)) * (width - pad.left - pad.right);
    const y = pad.top + (1 - d.installs / maxVal) * (height - pad.top - pad.bottom);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - pad.bottom} L ${points[0].x} ${height - pad.bottom} Z`;

  const xLabels = data.length <= 7
    ? points
    : points.filter((_, i) => i % Math.ceil(data.length / 7) === 0);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="trend-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4ae176" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#4ae176" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(f => {
        const y = pad.top + f * (height - pad.top - pad.bottom);
        return <line key={f} x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke="#262a35" strokeWidth="1" />;
      })}
      {/* Area */}
      <path d={areaD} fill="url(#trend-gradient)" />
      {/* Line */}
      <path d={pathD} fill="none" stroke="#4ae176" strokeWidth="2" strokeLinejoin="round" />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill="#4ae176" />
      ))}
      {/* X labels */}
      {xLabels.map((p, i) => (
        <text key={i} x={p.x} y={height - 4} textAnchor="middle" fontSize="9" fill="#918fa1">
          {new Date(p.day).toLocaleDateString("en", { month: "short", day: "numeric" })}
        </text>
      ))}
    </svg>
  );
}

function DonutChart({ data, total }: { data: DeviceBreakdown[]; total: number }) {
  const radius = 60;
  const stroke = 16;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const slices = data.map(d => {
    const pct = total > 0 ? d.count / total : 0;
    const dashArray = pct * circumference;
    const slice = { ...d, dashArray, dashOffset: -offset, pct };
    offset += dashArray;
    return slice;
  });

  return (
    <svg viewBox="-10 -10 140 140" className="w-40 h-40">
      <circle cx="60" cy="60" r={radius} fill="none" stroke="#313540" strokeWidth={stroke} />
      {slices.map((s, i) => (
        <circle key={i} cx="60" cy="60" r={radius} fill="none"
          stroke={DEVICE_COLORS[s.device_type] || "#464555"}
          strokeWidth={stroke}
          strokeDasharray={`${s.dashArray} ${circumference - s.dashArray}`}
          strokeDashoffset={s.dashOffset}
          style={{ transformOrigin: "60px 60px", transform: "rotate(-90deg)" }}
        />
      ))}
      <text x="60" y="56" textAnchor="middle" fontSize="18" fontWeight="700" fill="#dfe2f1">{total > 999 ? `${(total / 1000).toFixed(0)}k` : total}</text>
      <text x="60" y="70" textAnchor="middle" fontSize="8" fill="#918fa1" letterSpacing="2">USERS</text>
    </svg>
  );
}

export default function AnalyticsClient({ overview, trend, devices, apps }: {
  overview: Overview;
  trend: TrendPoint[];
  devices: DeviceBreakdown[];
  apps: AppRow[];
}) {
  const totalDevices = devices.reduce((s, d) => s + d.count, 0);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">

      {/* Overview Cards */}
      <section className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Installs", value: Number(overview.total_installs).toLocaleString(), icon: "", accent: "#4f46e5" },
          { label: "Today", value: overview.today_installs, icon: "", accent: "#4ae176" },
          { label: "Conversion Rate", value: `${overview.conversion_rate}%`, icon: "", accent: "#4ae176" },
          { label: "Active Apps", value: overview.active_apps, icon: "", accent: "#ffb695" },
          { label: "Total Apps", value: overview.total_apps, icon: "", accent: "#c3c0ff" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm relative overflow-hidden group"
            style={{ border: "1px solid rgba(199,196,216,0.2)", borderLeft: `4px solid ${card.accent}` }}>
            <div className="relative z-10">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{card.label}</div>
              <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{card.value}</div>
            </div>
            <div className="absolute right-2 bottom-1 text-5xl opacity-5 group-hover:opacity-10 transition-opacity select-none"
              style={{ color: card.accent }}>
              {card.icon}
            </div>
          </div>
        ))}
      </section>

      {/* Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-slate-900 text-lg">Install Trends (30 days)</h3>
          </div>
          <TrendChart data={trend} />
        </div>

        {/* Device Distribution */}
        <div className="bg-white rounded-xl p-6 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
          <h3 className="font-bold text-slate-900 text-lg mb-6">Device Distribution</h3>
          <div className="flex flex-col items-center gap-6">
            <DonutChart data={devices} total={totalDevices} />
            <div className="w-full space-y-3">
              {devices.length === 0 ? (
                <p className="text-sm text-slate-400 text-center">No data yet</p>
              ) : devices.map((d) => {
                const pct = totalDevices > 0 ? ((d.count / totalDevices) * 100).toFixed(0) : "0";
                return (
                  <div key={d.device_type} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: DEVICE_COLORS[d.device_type] || "#464555" }} />
                      <span className="capitalize font-medium text-slate-700">
                        {DEVICE_ICONS[d.device_type] || ""} {d.device_type}
                      </span>
                    </div>
                    <span className="font-bold text-slate-900">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* App Performance Table */}
      <section className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
        <div className="px-6 py-4 flex justify-between items-center" style={{ borderBottom: "1px solid rgba(199,196,216,0.15)" }}>
          <h3 className="font-bold text-slate-900 text-lg">App Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-slate-400"
                style={{ background: "rgba(199,196,216,0.08)" }}>
                <th className="px-6 py-4">App</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Installs</th>
                <th className="px-6 py-4">Share</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {apps.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-slate-400">No apps yet</td>
                </tr>
              ) : apps.map((app) => {
                const totalInstalls = apps.reduce((s, a) => s + a.installs, 0);
                const share = totalInstalls > 0 ? ((app.installs / totalInstalls) * 100).toFixed(0) : "0";
                return (
                  <tr key={app.id} className="hover:bg-slate-50 transition-colors"
                    style={{ borderTop: "1px solid rgba(199,196,216,0.1)" }}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center overflow-hidden"
                          style={{ background: "rgba(79,70,229,0.08)", border: "1px solid rgba(199,196,216,0.2)" }}>
                          {app.logo_url
                            ? <img src={app.logo_url} alt={app.name} className="w-full h-full object-cover" />
                            : <span className="text-indigo-600 font-bold text-sm">{app.name.charAt(0)}</span>
                          }
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{app.name}</div>
                          <div className="text-[10px] text-slate-400">/{app.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${
                        app.status === "live" ? "text-emerald-600 bg-emerald-500/10" :
                        app.status === "beta" ? "text-indigo-600 bg-indigo-500/10" :
                        "text-slate-500 bg-slate-100"
                      }`}>{app.status}</span>
                    </td>
                    <td className="px-6 py-4 font-semibold text-sm text-slate-900">
                      {Number(app.installs).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-slate-100 max-w-20">
                          <div className="h-full rounded-full" style={{ width: `${share}%`, background: "#4ae176" }} />
                        </div>
                        <span className="text-xs font-bold text-slate-700">{share}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a href={`/apps/${app.slug}`} target="_blank"
                        className="text-xs text-indigo-500 hover:underline">View </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  );
}

