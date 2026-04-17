"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type Version = {
  id: string;
  platform: string;
  version: string;
  apk_path: string | null;
  play_store_url: string | null;
  app_store_url: string | null;
  pwa_url: string | null;
  is_latest: boolean;
  release_notes: string | null;
  created_at: string;
};

type App = { id: string; name: string; slug: string; versions: Version[] | null };

type FormState = {
  platform: "android" | "ios" | "web";
  version: string;
  apk_path: string;
  play_store_url: string;
  app_store_url: string;
  pwa_url: string;
  is_latest: boolean;
  release_notes: string;
};

const PLATFORM_ICONS: Record<string, string> = { android: "", ios: "", web: "" };

export default function VersionsPage() {
  const params = useParams();
  const id = params.id as string;
  const [app, setApp] = useState<App | null>(null);
  const [form, setForm] = useState<FormState>({
    platform: "android",
    version: "",
    apk_path: "",
    play_store_url: "",
    app_store_url: "",
    pwa_url: "",
    is_latest: true,
    release_notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadName, setUploadName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`/api/apps/${id}`).then((r) => r.json()).then(setApp);
  }, [id]);

  const versions = useMemo(() => app?.versions || [], [app]);

  async function uploadApk(file: File) {
    setUploading(true);
    setMessage("");

    const payload = new FormData();
    payload.append("file", file);

    const res = await fetch("/api/uploads/apk", {
      method: "POST",
      body: payload,
    });

    setUploading(false);

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.error || "Failed to upload APK");
    }

    const data = await res.json();
    setUploadName(file.name);
    setForm((current) => ({ ...current, apk_path: data.path, platform: "android" }));
    setMessage(`Uploaded ${file.name}`);
    window.setTimeout(() => setMessage(""), 2000);
    return data.path as string;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      let apkPath = form.apk_path;

      if (form.platform === "android" && selectedFile && !apkPath) {
        apkPath = await uploadApk(selectedFile);
      }

      const res = await fetch(`/api/apps/${id}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          apk_path: form.platform === "android" ? apkPath : "",
        }),
      });

      if (res.ok) {
        setMessage("Version added!");
        setTimeout(() => setMessage(""), 3000);
        fetch(`/api/apps/${id}`).then((r) => r.json()).then(setApp);
        setForm((current) => ({
          ...current,
          version: "",
          release_notes: "",
          apk_path: "",
          play_store_url: "",
          app_store_url: "",
          pwa_url: "",
        }));
        setSelectedFile(null);
        setUploadName("");
        if (fileInputRef.current) fileInputRef.current.value = "";
      } else {
        const data = await res.json().catch(() => null);
        setMessage(data?.error?.formErrors?.[0] || "Failed to add version");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to add version");
    } finally {
      setSaving(false);
    }
  }

  async function handleSelectedFile(file: File | null) {
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".apk")) {
      setMessage("Please choose an APK file");
      return;
    }

    setSelectedFile(file);

    try {
      await uploadApk(file);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to upload APK");
      setSelectedFile(null);
      setUploadName("");
      setForm((current) => ({ ...current, apk_path: "" }));
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    void handleSelectedFile(file || null);
  }

  if (!app) return <div className="p-8 text-slate-400">Loading</div>;

  return (
    <div className="mx-auto w-full max-w-3xl p-6 md:p-8">
      <div className="mb-6">
        <Link href={`/admin/apps/${id}`} className="text-sm text-slate-400 transition-colors hover:text-indigo-500">
          Back to {app.name}
        </Link>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Version Control</h2>
        <p className="mt-1 text-sm text-slate-400">
          {versions.length} version{versions.length !== 1 ? "s" : ""}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
          <h3 className="font-bold text-slate-900">Add New Version</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2">
              {(["android", "ios", "web"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setForm((current) => ({ ...current, platform: p }));
                    if (p !== "android") {
                      setSelectedFile(null);
                      setUploadName("");
                    }
                  }}
                  className={`flex-1 rounded-xl py-2 text-xs font-semibold capitalize transition-all ${
                    form.platform === p ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {PLATFORM_ICONS[p]} {p}
                </button>
              ))}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Version *</label>
              <input
                type="text"
                value={form.version}
                onChange={(e) => setForm((current) => ({ ...current, version: e.target.value }))}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
                placeholder="1.0.0"
                required
              />
            </div>

            {form.platform === "android" && (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl p-6 text-center transition-colors ${
                    dragging ? "bg-indigo-50" : "bg-slate-50 hover:bg-slate-100"
                  }`}
                  style={{ border: `2px dashed ${dragging ? "#4f46e5" : "rgba(199,196,216,0.5)"}` }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".apk"
                    className="hidden"
                    onChange={(e) => void handleSelectedFile(e.target.files?.[0] || null)}
                  />
                  <p className="text-xs font-semibold text-slate-600">Drop APK here or click to browse</p>
                  <p className="text-xs text-slate-400">The file is uploaded to S3 or R2 before the version is saved.</p>
                  {uploading && <p className="text-xs font-semibold text-indigo-500">Uploading APK...</p>}
                  {!uploading && uploadName && <p className="text-xs font-semibold text-emerald-600">Uploaded: {uploadName}</p>}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">APK Path / URL</label>
                  <input
                    type="text"
                    value={form.apk_path}
                    onChange={(e) => setForm((current) => ({ ...current, apk_path: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
                    placeholder="/uploads/apks/app.apk"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Play Store URL</label>
                  <input
                    type="url"
                    value={form.play_store_url}
                    onChange={(e) => setForm((current) => ({ ...current, play_store_url: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
                    placeholder="https://play.google.com/"
                  />
                </div>
              </>
            )}

            {form.platform === "ios" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">App Store URL</label>
                <input
                  type="url"
                  value={form.app_store_url}
                  onChange={(e) => setForm((current) => ({ ...current, app_store_url: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
                  placeholder="https://apps.apple.com/"
                />
              </div>
            )}

            {form.platform === "web" && (
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">PWA URL</label>
                <input
                  type="url"
                  value={form.pwa_url}
                  onChange={(e) => setForm((current) => ({ ...current, pwa_url: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
                  placeholder="https://app.example.com"
                />
              </div>
            )}

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Release Notes</label>
              <textarea
                value={form.release_notes}
                onChange={(e) => setForm((current) => ({ ...current, release_notes: e.target.value }))}
                className="min-h-[4.5rem] w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-400"
                rows={2}
                placeholder="What's new"
              />
            </div>

            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_latest}
                onChange={(e) => setForm((current) => ({ ...current, is_latest: e.target.checked }))}
                className="rounded border-slate-300 text-indigo-500"
              />
              <span className="text-sm font-medium text-slate-700">Set as latest version</span>
            </label>

            {message && (
              <div
                className={`rounded-xl px-4 py-3 text-sm ${
                  message.toLowerCase().includes("fail") || message.toLowerCase().includes("please")
                    ? "bg-red-50 text-red-600"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={saving || uploading}
              className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)" }}
            >
              {saving ? "Adding" : uploading ? "Uploading" : "Add Version"}
            </button>
          </form>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-slate-900">Version History</h3>
          {versions.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm text-slate-400" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
              No versions yet. Add your first version.
            </div>
          ) : (
            versions.map((v) => (
              <div key={v.id} className="rounded-xl bg-white p-4 shadow-sm" style={{ border: "1px solid rgba(199,196,216,0.2)" }}>
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span>{PLATFORM_ICONS[v.platform]}</span>
                    <span className="text-sm font-bold text-slate-900">v{v.version}</span>
                    {v.is_latest && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600">
                        LATEST
                      </span>
                    )}
                  </div>
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] capitalize text-slate-400">{v.platform}</span>
                </div>

                {v.release_notes && <p className="mb-2 text-xs text-slate-500">{v.release_notes}</p>}

                <div className="flex flex-wrap gap-2 text-[10px]">
                  {v.apk_path && <span className="rounded px-2 py-1 text-slate-500 bg-slate-100">APK</span>}
                  {v.play_store_url && (
                    <a href={v.play_store_url} target="_blank" rel="noreferrer" className="rounded bg-indigo-50 px-2 py-1 text-indigo-500 hover:underline">
                      Play Store
                    </a>
                  )}
                  {v.app_store_url && (
                    <a href={v.app_store_url} target="_blank" rel="noreferrer" className="rounded bg-indigo-50 px-2 py-1 text-indigo-500 hover:underline">
                      App Store
                    </a>
                  )}
                  {v.pwa_url && (
                    <a href={v.pwa_url} target="_blank" rel="noreferrer" className="rounded bg-indigo-50 px-2 py-1 text-indigo-500 hover:underline">
                      PWA
                    </a>
                  )}
                </div>

                <p className="mt-2 text-[10px] text-slate-400">{new Date(v.created_at).toLocaleDateString()}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
