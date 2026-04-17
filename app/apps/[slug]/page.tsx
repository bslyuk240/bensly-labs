import { sql } from "@/lib/db";
import { detectDevice } from "@/lib/device";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import AppInstallClient from "./AppInstallClient";

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

export default async function AppPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const rows = await sql`
    SELECT
      a.id,
      a.slug,
      a.name,
      a.description,
      a.logo_url,
      a.screenshots,
      a.rating::float AS rating,
      a.status,
      COALESCE((SELECT COUNT(*) FROM install_events WHERE app_id = a.id), 0)::int AS install_count,
      json_agg(
        json_build_object(
          'id', v.id, 'platform', v.platform, 'version', v.version,
          'apk_path', v.apk_path, 'play_store_url', v.play_store_url,
          'app_store_url', v.app_store_url, 'pwa_url', v.pwa_url,
          'is_latest', v.is_latest, 'release_notes', v.release_notes
        ) ORDER BY v.created_at DESC
      ) FILTER (WHERE v.id IS NOT NULL) AS versions
    FROM apps a
    LEFT JOIN app_versions v ON v.app_id = a.id
    WHERE a.slug = ${slug} AND a.status != 'draft'
    GROUP BY a.id
  `;

  if (!rows.length) notFound();

  const app = rows[0] as App;
  const headersList = await headers();
  const ua = headersList.get("user-agent") || "";
  const device = detectDevice(ua);

  return <AppInstallClient app={app} device={device} />;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rows = await sql`SELECT name, description FROM apps WHERE slug = ${slug} AND status != 'draft' LIMIT 1`;
  if (!rows.length) return {};
  return {
    title: `${rows[0].name} - Bensly Labs`,
    description: rows[0].description,
  };
}

