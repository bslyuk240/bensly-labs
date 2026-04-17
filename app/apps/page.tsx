import { sql } from "@/lib/db";
import Link from "next/link";

type PublicApp = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  logo_url: string | null;
  screenshots: string[] | null;
  status: string;
  rating: number;
  installs: number;
};

type AppsIndexPageProps = {
  searchParams?: Promise<{ q?: string | string[] }> | { q?: string | string[] };
};

export const metadata = {
  title: "Apps - Bensly Labs",
  description: "Browse public apps available for install.",
};

function normalizeQuery(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0]?.trim() || "";
  return value?.trim() || "";
}

function appCategory(app: PublicApp): string {
  const slug = `${app.slug} ${app.name}`.toLowerCase();

  if (slug.includes("mart")) return "Marketplace";
  if (slug.includes("skola") || slug.includes("school")) return "Education";
  if (slug.includes("pay")) return "Finance";
  return app.status === "live" ? "Featured" : "Utilities";
}

function appAccent(app: PublicApp): string {
  const slug = `${app.slug} ${app.name}`.toLowerCase();

  if (slug.includes("mart")) return "from-[#0b0f19] via-[#111827] to-[#34306d]";
  if (slug.includes("skola") || slug.includes("school"))
    return "from-[#172554] via-[#1e3a8a] to-[#4f46e5]";
  if (slug.includes("pay")) return "from-[#0f172a] via-[#1e293b] to-[#0f766e]";
  return "from-[#111827] via-[#1f2937] to-[#4f46e5]";
}

export default async function AppsIndexPage({
  searchParams,
}: AppsIndexPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const query = normalizeQuery(resolvedSearchParams?.q);

  const [statsRows, appsRows] = await Promise.all([
    sql`
      SELECT
        (SELECT COUNT(*) FROM apps WHERE status != 'draft')::int AS total_apps,
        (SELECT COUNT(*) FROM apps WHERE status = 'live')::int AS live_apps,
        (SELECT COUNT(*) FROM install_events)::int AS total_installs
    `,
    sql`
      SELECT
        a.id,
        a.slug,
        a.name,
        a.description,
        a.logo_url,
        a.screenshots,
        a.status,
        a.rating::float AS rating,
        COUNT(ie.id)::int AS installs
      FROM apps a
      LEFT JOIN install_events ie ON ie.app_id = a.id
      WHERE a.status != 'draft'
      GROUP BY a.id
      ORDER BY
        CASE a.status
          WHEN 'live' THEN 0
          WHEN 'beta' THEN 1
          ELSE 2
        END,
        installs DESC,
        a.created_at DESC
    `,
  ]);

  const stats = statsRows[0] as {
    total_apps: number;
    live_apps: number;
    total_installs: number;
  };

  const apps = (appsRows as PublicApp[]).filter((app) => {
    if (!query) return true;

    const haystack = [
      app.name,
      app.slug,
      app.description || "",
      app.status,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query.toLowerCase());
  });

  const featured = apps[0] || null;
  const secondary = apps.slice(1, 3);
  const topApps = apps.slice(0, 6);
  const topCategories = [
    "Explore",
    "Live",
    "Beta",
    "Popular",
    "New",
  ];

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-[#191c1d] selection:bg-[#4f46e5]/15" style={{ fontFamily: "Poppins, Manrope, system-ui, sans-serif" }}>
      <header className="sticky top-0 z-40 bg-[#f8f9fa]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-screen-xl items-center justify-between px-4 py-4 sm:px-6">
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e7e8e9] text-[#464555] shadow-[0_12px_30px_rgba(25,28,29,0.05)]"
            aria-label="Menu"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 6h7M4 12h16M4 18h12" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/apps" className="flex items-center gap-3">
            <span className="flex h-10 w-10 overflow-hidden rounded-2xl shadow-[0_10px_24px_rgba(79,70,229,0.12)]">
              <img src="/512x512.png" alt="Bensly Labs" className="h-full w-full object-cover" />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#3525cd] sm:text-xl">
              Bensly Labs
            </span>
          </Link>

          <Link
            href="/apps#top-free-apps"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#e7e8e9] text-[#464555] shadow-[0_12px_30px_rgba(25,28,29,0.05)]"
            aria-label="Search apps"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" strokeLinecap="round" />
            </svg>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-screen-xl px-4 pb-10 pt-6 sm:px-6 sm:pt-8">
        <section id="featured-apps" className="mb-10">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#191c1d] sm:text-3xl">
              Featured Apps
            </h2>
            <Link href="/apps#top-free-apps" className="text-sm font-semibold text-[#3525cd]">
              See all
            </Link>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            {featured ? (
              <Link
                href={`/apps/${featured.slug}`}
                className={`relative overflow-hidden rounded-[1.75rem] bg-gradient-to-br ${appAccent(
                  featured,
                )} aspect-[16/10] shadow-[0_18px_50px_rgba(25,28,29,0.14)]`}
              >
                {featured.screenshots?.[0] ? (
                  <img
                    src={featured.screenshots[0]}
                    alt={featured.name}
                    className="absolute inset-0 h-full w-full object-cover opacity-75"
                  />
                ) : (
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_30%)]" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/78 via-black/22 to-transparent" />
                <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-7">
                  <span className="mb-3 inline-flex w-fit rounded-full bg-white/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/85">
                    Editor&apos;s choice
                  </span>
                  <h3 className="max-w-md text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                    {featured.name}
                  </h3>
                  <p className="mt-2 max-w-lg text-sm leading-6 text-white/80 sm:text-base">
                    {featured.description ||
                      "A high-contrast featured app card that leads directly into the install flow."}
                  </p>
                  <span className="mt-5 inline-flex w-fit rounded-xl bg-[#4f46e5] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_32px_rgba(79,70,229,0.35)]">
                    Get Started
                  </span>
                </div>
              </Link>
            ) : (
              <div className="rounded-[1.75rem] bg-[#0b0f19] p-6 text-white shadow-[0_18px_50px_rgba(25,28,29,0.14)]">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/70">
                  Editor&apos;s choice
                </p>
                <h3 className="mt-3 text-3xl font-extrabold tracking-tight">Featured app</h3>
                <p className="mt-2 max-w-md text-sm leading-6 text-white/75">
                  Add a live app in the admin portal to populate the public catalog.
                </p>
              </div>
            )}

            <div className="grid gap-5">
              {secondary.length > 0 ? (
                secondary.map((app) => (
                  <article
                    key={app.id}
                    className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-[#f3f4f5] p-5 shadow-[0_12px_30px_rgba(25,28,29,0.04)]"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <div
                        className={`flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${appAccent(
                          app,
                        )} shadow-[0_12px_30px_rgba(25,28,29,0.10)]`}
                      >
                        {app.logo_url ? (
                          <img src={app.logo_url} alt={app.name} className="h-full w-full object-cover" />
                        ) : (
                          <span className="text-2xl font-extrabold text-white">
                            {app.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate text-xl font-extrabold tracking-tight text-[#191c1d]">
                          {app.name}
                        </h3>
                        <p className="mt-1 text-sm text-[#464555]">
                          {appCategory(app)} - {app.description || "Fast install and simple discovery."}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="font-semibold text-[#3525cd]">Rating {app.rating}</span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/apps/${app.slug}`}
                      className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#e2dfff] px-5 text-sm font-bold text-[#3525cd]"
                    >
                      Get
                    </Link>
                  </article>
                ))
              ) : (
                <div className="rounded-[1.5rem] bg-[#f3f4f5] p-6 text-[#464555] shadow-[0_12px_30px_rgba(25,28,29,0.04)]">
                  Add more public apps to fill the featured rail.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mb-10 overflow-x-auto pb-2">
          <div className="flex gap-4">
            {topCategories.map((category, index) => (
              <button
                key={category}
                type="button"
                className={`flex shrink-0 items-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold shadow-[0_10px_24px_rgba(25,28,29,0.05)] ${
                  index === 0
                    ? "bg-[#6bff8f] text-[#002109]"
                    : "bg-[#e7e8e9] text-[#464555]"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </section>

        <section id="top-free-apps">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#191c1d]">
              Top Free Apps
            </h2>
            <Link href="/apps#featured-apps" className="text-sm font-semibold text-[#3525cd]">
              Charts
            </Link>
          </div>

          <div className="mt-5 space-y-1">
            {topApps.length > 0 ? (
              topApps.map((app, index) => (
                <article
                  key={app.id}
                  className="flex items-center gap-4 rounded-2xl px-2 py-4 transition-colors hover:bg-[#f3f4f5]"
                >
                  <span className="w-6 text-center text-lg font-bold text-[#464555]">
                    {index + 1}
                  </span>
                  <div
                    className={`flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br ${appAccent(
                      app,
                    )} shadow-[0_10px_24px_rgba(25,28,29,0.10)]`}
                  >
                    {app.logo_url ? (
                      <img src={app.logo_url} alt={app.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xl font-extrabold text-white">
                        {app.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-extrabold text-[#191c1d]">
                      {app.name}
                    </h3>
                    <p className="truncate text-sm text-[#464555]">
                      {appCategory(app)} - {app.rating}/5
                    </p>
                  </div>

                  <Link
                    href={`/apps/${app.slug}`}
                    className="inline-flex h-10 shrink-0 items-center justify-center rounded-full bg-[#e2dfff] px-5 text-sm font-bold text-[#3525cd]"
                  >
                    GET
                  </Link>
                </article>
              ))
            ) : (
              <div className="rounded-[1.5rem] bg-[#f3f4f5] p-6 text-[#464555] shadow-[0_12px_30px_rgba(25,28,29,0.04)]">
                No public apps are available yet.
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
