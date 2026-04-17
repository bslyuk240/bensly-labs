"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewAppPage() {
  const router = useRouter();
  const publicHost = (process.env.NEXT_PUBLIC_SITE_URL || "https://benslylabs.skolahq.com")
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");
  const [form, setForm] = useState({
    name: "",
    slug: "",
    description: "",
    logo_url: "",
    status: "draft" as "draft" | "beta" | "live",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  function handleNameChange(name: string) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm((f) => ({ ...f, name, slug }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/apps", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error?.formErrors?.[0] || "Failed to create app");
      setSaving(false);
      return;
    }

    const app = await res.json();
    router.push(`/admin/apps/${app.id}`);
  }

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <Link href="/admin/apps" className="text-sm text-slate-400 hover:text-indigo-500 transition-colors"> Back to Apps</Link>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mt-2">Create App</h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-6 shadow-sm space-y-5"
        style={{ border: "1px solid rgba(199,196,216,0.2)" }}>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">App Name *</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-400 focus:outline-none transition-colors"
            placeholder="e.g. JulineMart"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Slug *</label>
          <div className="flex items-center gap-2">
            <span className="text-slate-400 text-sm">{publicHost}/apps/</span>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-400 focus:outline-none transition-colors"
              placeholder="julinemart"
              pattern="[a-z0-9-]+"
              required
            />
          </div>
          <p className="text-xs text-slate-400 mt-1">Lowercase letters, numbers, and hyphens only</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-400 focus:outline-none transition-colors resize-none"
            rows={3}
            placeholder="Short description of your app"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Logo URL</label>
          <input
            type="url"
            value={form.logo_url}
            onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-400 focus:outline-none transition-colors"
            placeholder="https://example.com/logo.png"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
          <div className="flex gap-3">
            {(["draft", "beta", "live"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setForm((f) => ({ ...f, status: s }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                  form.status === s
                    ? s === "live" ? "bg-emerald-500 text-white" : s === "beta" ? "bg-indigo-500 text-white" : "bg-slate-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="px-4 py-3 rounded-xl text-sm text-red-600 bg-red-50 border border-red-200">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/apps"
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-600 text-center hover:bg-slate-100 transition-colors"
            style={{ border: "1px solid rgba(199,196,216,0.5)" }}>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}
          >
            {saving ? "Creating" : "Create App"}
          </button>
        </div>
      </form>
    </div>
  );
}

