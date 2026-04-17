"use client";

import Link from "next/link";
import { useState } from "react";

type AppVersion = {
  id: string;
  platform: string;
  version: string;
  apk_path: string | null;
  play_store_url: string | null;
  app_store_url: string | null;
  pwa_url: string | null;
  is_latest: boolean;
  release_notes: string | null;
};

type App = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  screenshots: string[];
  rating: number;
  status: string;
  install_count: number;
  versions: AppVersion[] | null;
};

type DeviceType = "android" | "ios" | "desktop";

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return `${n}`;
}

function appTagSet(app: App): string[] {
  const slug = `${app.slug} ${app.name}`.toLowerCase();

  if (slug.includes("mart")) return ["Marketplace", "Shopping", "Delivery"];
  if (slug.includes("skola") || slug.includes("school"))
    return ["Education", "School", "Communication"];
  if (slug.includes("pay")) return ["Finance", "Payments", "Wallet"];
  return ["Featured", "Verified", "Public"];
}

function appHighlights(app: App): string[] {
  const slug = `${app.slug} ${app.name}`.toLowerCase();

  if (slug.includes("mart")) {
    return [
      "Thousands of products in one place.",
      "Fast delivery across East Africa.",
      "Secure checkout and order tracking.",
    ];
  }

  if (slug.includes("skola") || slug.includes("school")) {
    return [
      "Manage students and staff in one app.",
      "Track attendance, grades, and communication.",
      "Built for modern schools.",
    ];
  }

  if (slug.includes("pay")) {
    return [
      "Send and receive money quickly.",
      "Track balances with a clear history.",
      "Secure mobile payments with fewer taps.",
    ];
  }

  return [
    "Simple install flow with one obvious action.",
    "Tonal surfaces and a clear content hierarchy.",
    "Public listing that stays lightweight on mobile.",
  ];
}

function screenshotLabels(app: App): string[] {
  const slug = `${app.slug} ${app.name}`.toLowerCase();

  if (slug.includes("mart")) return ["Product browsing", "Checkout screen", "Order tracking"];
  if (slug.includes("skola") || slug.includes("school"))
    return ["Class overview", "Attendance screen", "Results dashboard"];
  if (slug.includes("pay")) return ["Wallet overview", "Send money", "Transactions"];
  return ["App preview", "Core workflow", "Settings"];
}

function appAccent(app: App): string {
  const slug = `${app.slug} ${app.name}`.toLowerCase();

  if (slug.includes("mart")) return "from-[#0b0f19] via-[#111827] to-[#34306d]";
  if (slug.includes("skola") || slug.includes("school"))
    return "from-[#172554] via-[#1e3a8a] to-[#4f46e5]";
  if (slug.includes("pay")) return "from-[#0f172a] via-[#1e293b] to-[#0f766e]";
  return "from-[#111827] via-[#1f2937] to-[#4f46e5]";
}

function AppIcon({ logoUrl, name }: { logoUrl: string | null; name: string }) {
  return (
    <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] bg-[#0f172a] shadow-[0_12px_40px_-4px_rgba(25,28,29,0.12)] sm:h-36 sm:w-36">
      {logoUrl ? (
        <img src={logoUrl} alt={name} className="h-full w-full object-cover" />
      ) : (
        <span className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );
}

export default function AppInstallClient({
  app,
  device,
}: {
  app: App;
  device: DeviceType;
}) {
  const [downloadState, setDownloadState] = useState<"idle" | "loading" | "done">("idle");
  const [shareState, setShareState] = useState<"idle" | "done">("idle");

  const versions = app.versions || [];
  const androidVersion = versions.find((v) => v.platform === "android");
  const iosVersion = versions.find((v) => v.platform === "ios");
  const webVersion = versions.find((v) => v.platform === "web");
  const latestVersion = androidVersion?.version || iosVersion?.version || webVersion?.version || "Latest";
  const primaryTags = appTagSet(app);
  const highlights = appHighlights(app);
  const labels = screenshotLabels(app);

  const primaryAction = (() => {
    if (device === "android") {
      return {
        label: "Install",
        available: Boolean(androidVersion),
        action: () => {
          setDownloadState("loading");
          setTimeout(() => {
            setDownloadState("done");
            window.location.href = `/api/download?slug=${app.slug}`;
          }, 650);
        },
      };
    }

    if (device === "ios") {
      return {
        label: "Install",
        available: Boolean(iosVersion?.app_store_url),
        action: () => iosVersion?.app_store_url && window.open(iosVersion.app_store_url, "_blank", "noreferrer"),
      };
    }

    return {
      label: "Install",
      available: Boolean(webVersion?.pwa_url || androidVersion),
      action: () => {
        if (webVersion?.pwa_url) {
          window.open(webVersion.pwa_url, "_blank", "noreferrer");
          return;
        }

        if (androidVersion) {
          setDownloadState("loading");
          setTimeout(() => {
            setDownloadState("done");
            window.location.href = `/api/download?slug=${app.slug}`;
          }, 650);
        }
      },
    };
  })();

  async function handleShare() {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({ title: app.name, url });
      } else {
        await navigator.clipboard.writeText(url);
      }

      setShareState("done");
      window.setTimeout(() => setShareState("idle"), 1200);
    } catch {
      // Ignore share cancellations.
    }
  }

  const screenshotItems =
    app.screenshots.length > 0
      ? app.screenshots.map((url, index) => ({
          kind: "image" as const,
          url,
          label: labels[index] || `Preview ${index + 1}`,
        }))
      : labels.map((label, index) => ({
          kind: "placeholder" as const,
          url: "",
          label,
        }));

  const latestReleaseNotes = versions.find((version) => version.is_latest)?.release_notes || null;

  const stats = [
    { label: "Rating", value: Number(app.rating).toFixed(1) },
    { label: "Installs", value: formatCount(app.install_count) },
    { label: "Age", value: "12+" },
    { label: "Size", value: "128 MB" },
  ];

  const trustSignals = [
    "Verified listing",
    "Secure download",
    "No hidden charges",
  ];

  return (
    <div
      className="min-h-screen bg-[#f8f9fa] text-[#191c1d] selection:bg-[#4f46e5]/15"
      style={{ fontFamily: "Poppins, Manrope, system-ui, sans-serif" }}
    >
      <header className="sticky top-0 z-50 bg-[#f8f9fa]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/apps"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e7e8e9] text-[#464555] shadow-[0_12px_30px_rgba(25,28,29,0.05)]"
              aria-label="Back to apps"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Link href="/apps" className="text-lg font-extrabold tracking-tight text-[#3525cd]">
              Bensly Labs
            </Link>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/apps"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e7e8e9] text-[#464555] shadow-[0_12px_30px_rgba(25,28,29,0.05)]"
              aria-label="Search apps"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e7e8e9] text-[#464555] shadow-[0_12px_30px_rgba(25,28,29,0.05)]"
              aria-label="More actions"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" stroke="none" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 pb-12 pt-5 sm:px-6 sm:pt-8">
        <section className="flex flex-col gap-6 md:flex-row md:items-start">
          <AppIcon logoUrl={app.logo_url} name={app.name} />

          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-[#191c1d] sm:text-5xl">
                {app.name}
              </h1>
              <p className="text-lg font-semibold text-[#3525cd]">
                Bensly Labs Public Apps
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 sm:flex sm:flex-wrap sm:gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="flex flex-col">
                  <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#777587]">
                    {stat.label}
                  </span>
                  <span className="mt-1 text-xl font-extrabold text-[#191c1d]">
                    {stat.value}
                  </span>
                </div>
              ))}
            </div>

            {app.description && (
              <p className="max-w-2xl text-base leading-7 text-[#464555] sm:text-lg">
                {app.description}
              </p>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              {primaryAction.available ? (
                <button
                  onClick={primaryAction.action}
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.5rem] bg-gradient-to-r from-[#3525cd] to-[#4f46e5] px-6 py-3 text-sm font-extrabold text-white shadow-[0_14px_32px_rgba(79,70,229,0.28)]"
                >
                  {downloadState === "loading" ? "Preparing download..." : downloadState === "done" ? "Download started" : primaryAction.label}
                </button>
              ) : (
                <button
                  disabled
                  className="inline-flex min-h-12 items-center justify-center rounded-[0.5rem] bg-[#e7e8e9] px-6 py-3 text-sm font-extrabold text-[#777587]"
                >
                  Coming soon
                </button>
              )}

              <button
                onClick={handleShare}
                className="inline-flex min-h-12 items-center justify-center rounded-[0.5rem] bg-[#f3f4f5] px-6 py-3 text-sm font-bold text-[#3525cd] shadow-[0_10px_24px_rgba(25,28,29,0.04)]"
              >
                Share {shareState === "done" ? "Link copied" : ""}
              </button>
            </div>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex gap-4 overflow-x-auto pb-2">
            {screenshotItems.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="w-[280px] shrink-0 overflow-hidden rounded-[1.5rem] bg-[#f3f4f5] shadow-[0_12px_30px_rgba(25,28,29,0.06)] md:w-[320px]"
              >
                {item.kind === "image" ? (
                  <div className="aspect-[9/16]">
                    <img
                      src={item.url}
                      alt={`${app.name} screenshot ${index + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className={`flex aspect-[9/16] flex-col justify-end bg-gradient-to-br ${appAccent(
                    app,
                  )} p-4 text-white`}>
                    <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/70">
                      Placeholder
                    </p>
                    <h3 className="mt-2 text-xl font-extrabold tracking-tight">{item.label}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/78">
                      Add screenshots in the admin portal to surface the real product flow here.
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_360px]">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#191c1d]">
                  About this app
                </h2>
                <Link href="#whats-new" className="text-[#3525cd]">
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14" strokeLinecap="round" />
                    <path d="m12 5 7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              </div>

              <p className="max-w-3xl text-base leading-7 text-[#464555] sm:text-lg">
                {app.description ||
                  "A clean public listing that keeps the install path obvious, the content compact, and the layout mobile-first."}
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {primaryTags.map((tag, index) => (
                  <span
                    key={tag}
                    className={`rounded-full px-3 py-1 text-sm font-bold ${
                      index === 0
                        ? "bg-[#6bff8f] text-[#002109]"
                        : "bg-[#e7e8e9] text-[#464555]"
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            <div id="whats-new" className="rounded-[1.5rem] bg-[#f3f4f5] p-6 shadow-[0_12px_30px_rgba(25,28,29,0.04)]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-[#191c1d]">
                    What&apos;s New
                  </h2>
                  <p className="text-sm font-medium text-[#777587]">
                    {latestVersion} - recently updated
                  </p>
                </div>
                <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#3525cd]" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M21 12a9 9 0 1 1-3-6.7" strokeLinecap="round" />
                </svg>
              </div>

              <ul className="mt-4 space-y-3">
                {(latestReleaseNotes
                  ? latestReleaseNotes
                      .split("\n")
                      .map((line) => line.replace(/^[-*]\s*/, "").trim())
                      .filter(Boolean)
                  : highlights).map((item) => (
                  <li key={item} className="flex gap-3 text-[#464555]">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#22c55e]" />
                    <span className="leading-7">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-extrabold tracking-tight text-[#191c1d]">
                  Ratings & Reviews
                </h2>
                <span className="text-sm font-semibold text-[#3525cd]">
                  {app.rating.toFixed(1)} average
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[1.25rem] bg-[#f8f9fa] p-5 shadow-[0_12px_30px_rgba(25,28,29,0.04)]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#191c1d]">Trusted listing</span>
                    <span className="text-[#3525cd]">Top rated</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#464555]">
                    {trustSignals.join(" - ")}
                  </p>
                </div>

                <div className="rounded-[1.25rem] bg-[#f8f9fa] p-5 shadow-[0_12px_30px_rgba(25,28,29,0.04)]">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#191c1d]">Popular choice</span>
                    <span className="text-[#3525cd]">Popular</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[#464555]">
                    {formatCount(app.install_count)} installs, status {app.status}, version {latestVersion}.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-[1.5rem] bg-[#f3f4f5] p-6 shadow-[0_12px_30px_rgba(25,28,29,0.04)]">
              <h3 className="text-lg font-extrabold tracking-tight text-[#191c1d]">
                Listing info
              </h3>
              <div className="mt-5 space-y-4">
                {[
                  { label: "Status", value: app.status },
                  { label: "Version", value: latestVersion },
                  { label: "Installs", value: formatCount(app.install_count) },
                  { label: "Device", value: device },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#777587]">
                      {item.label}
                    </span>
                    <span className="text-sm font-semibold text-[#191c1d]">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] bg-[#0f172a] p-6 text-white shadow-[0_12px_30px_rgba(25,28,29,0.12)]">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/65">
                Public portal
              </p>
              <h3 className="mt-3 text-2xl font-extrabold tracking-tight">{app.name}</h3>
              <p className="mt-2 text-sm leading-6 text-white/72">
                One focused install path with the app preview, support info, and platform handoff kept close together.
              </p>
              <Link
                href="/apps"
                className="mt-5 inline-flex rounded-full bg-[#4f46e5] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_32px_rgba(79,70,229,0.26)]"
              >
                Back to catalog
              </Link>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}
