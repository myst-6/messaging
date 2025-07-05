# How to run

Create `.env.local` with e.g. `NEXT_PUBLIC_API_BASE_URL=http://localhost:8787` or whatever port it is for your cloudflare.

Create `.env.production` with e.g. `NEXT_PUBLIC_API_BASE_URL=https://projname.username.workers.dev/` for your cloudflare production url.

Then just run `pnpm dev` or `pnpm deploy` in the root dir.

TODO: need to host the nextjs frontend somewhere on `pnpm deploy`
