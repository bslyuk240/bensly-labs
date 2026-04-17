This is a [Next.js](https://nextjs.org) project for Bensly Labs, bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

The public portal and admin shell use CSS font stacks so the app builds cleanly without depending on remote font fetches.

## Object Storage for APKs

The admin APK upload flow supports S3-compatible storage such as AWS S3 or Cloudflare R2.

Set these environment variables in production:

- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_REGION`
- `S3_PUBLIC_BASE_URL`

Optional:

- `S3_ENDPOINT` for R2 or custom S3-compatible endpoints
- `S3_FORCE_PATH_STYLE=true` when your provider needs path-style requests
- `S3_PREFIX=apks` to change the upload folder prefix

If these values are not configured, uploads fall back to local disk in development only.

## Vercel Environment Variables

For production deploys on Vercel with the custom domain `https://benslylabs.skolahq.com`, set:

- `NEXT_PUBLIC_SITE_URL=https://benslylabs.skolahq.com`
- `NEXTAUTH_URL=https://benslylabs.skolahq.com`
- `NEXTAUTH_SECRET=<strong-random-secret>`
- `DATABASE_URL=<your-postgres-connection-string>`
- `ADMIN_USERNAME=<admin-login>`
- `ADMIN_PASSWORD=<admin-password>`
- `IP_HASH_SALT=<random-salt-for-install-rate-limits>`

If you are using Cloudflare R2 for APK storage, also set:

- `S3_BUCKET`
- `S3_ACCESS_KEY_ID`
- `S3_SECRET_ACCESS_KEY`
- `S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com`
- `S3_REGION=auto`
- `S3_FORCE_PATH_STYLE=true`
- `S3_PUBLIC_BASE_URL=https://<your-public-r2-domain-or-custom-domain>`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
