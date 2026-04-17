"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type App = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  screenshots: string[];
  status: string;
  rating: number;
  install_count: number;
};

function parseScreenshotUrls(input: string): string[] {
  return input
    .split(/[\n,]+/g)
    .map((value) => value.trim())
    .filter(Boolean);
}

export default function AppDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [app, setApp] = useState<App | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    logo_url: "",
    screenshotsText: "",
    status: "draft" as App["status"],
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch(`/api/apps/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setApp(data);
        setForm({
          name: data.name,
          description: data.description || "",
          logo_url: data.logo_url || "",
          screenshotsText: Array.isArray(data.screenshots) ? data.screenshots.join("\n") : "",
          status: data.status,
        });
      });
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/apps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        description: form.description,
        logo_url: form.logo_url,
        screenshots: parseScreenshotUrls(form.screenshotsText),
        status: form.status,
      }),
    });
    setSaving(false);
    if (res.ok) { setMessage("Saved successfully!"); setTimeout(() => setMessage(""), 3000); }
    else setMessage("Failed to save");
  }

  async function handleDelete() {
    if (!confirm(`Delete "${app?.name}"? This cannot be undone.`)) return;
    setDeleting(true);
    await fetch(`/api/apps/${id}`, { method: "DELETE" });
    router.push("/admin/apps");
  }

  if (!app) return <div className="p-8 text-slate-400">Loading</div>;

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <Link href="/admin/apps" className="text-sm text-slate-400 hover:text-indigo-500"> Back to Apps</Link>
        <div className="flex items-center justify-between mt-2">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{app.name}</h2>
          <div className="flex gap-2">
            <Link href={`/admin/apps/${id}/versions`}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
              style={{ border: "1px solid rgba(199,196,216,0.5)" }}>
              Versions
            </Link>
              <Link href={`/apps/${app.slug}`} target="_blank"
              className="px-4 py-2 rounded-xl text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
              style={{ border: "1px solid rgba(79,70,229,0.2)" }}>
              Preview
              </Link>
          </div>
        </div>
        <p className="text-sm text-slate-400 mt-1">{Number(app.install_count).toLocaleString()} installs  /{app.slug}</p>
      </div>

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 shadow-sm space-y-5"
        style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">App Name</label>
          <input type="text" value={form.name} onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-400 focus:outline-none" required />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description</label>
          <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-400 focus:outline-none resize-none" rows={3} />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Logo URL</label>
          <input type="url" value={form.logo_url} onChange={(e) => setForm(f => ({ ...f, logo_url: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-400 focus:outline-none"
            placeholder="https://example.com/logo.png" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Sample Images / Screenshots</label>
          <textarea
            value={form.screenshotsText}
            onChange={(e) => setForm((f) => ({ ...f, screenshotsText: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-slate-50 text-slate-900 border border-slate-200 focus:border-indigo-400 focus:outline-none resize-none"
            rows={5}
            placeholder={"https://example.com/shot-1.png\nhttps://example.com/shot-2.png"}
          />
          <p className="text-xs text-slate-400 mt-1">Paste one image URL per line. These show up in the public app detail screenshot rail.</p>
        </div>
        {parseScreenshotUrls(form.screenshotsText).length > 0 && (
          <div>
            <p className="block text-sm font-semibold text-slate-700 mb-2">Preview</p>
            <div className="grid grid-cols-2 gap-3">
              {parseScreenshotUrls(form.screenshotsText).slice(0, 4).map((src) => (
                <div key={src} className="overflow-hidden rounded-xl bg-slate-100 aspect-[9/16]">
                  <img src={src} alt="Screenshot preview" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Status</label>
          <div className="flex gap-3">
            {(["draft", "beta", "live"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setForm(f => ({ ...f, status: s }))}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all ${
                  form.status === s
                    ? s === "live" ? "bg-emerald-500 text-white" : s === "beta" ? "bg-indigo-500 text-white" : "bg-slate-600 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-xl text-sm ${message.includes("Failed") ? "text-red-600 bg-red-50" : "text-emerald-700 bg-emerald-50"}`}>
            {message}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={handleDelete} disabled={deleting}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            style={{ border: "1px solid rgba(239,68,68,0.3)" }}>
            {deleting ? "Deleting" : "Delete"}
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
            style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}>
            {saving ? "Saving" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

