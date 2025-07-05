# Development

Create `.env.local` with e.g. `NEXT_PUBLIC_API_BASE_URL=http://localhost:8787` or whatever port it is for your cloudflare. And then `NEXT_PUBLIC_WEBSOCKET_BASE_URL=ws://localhost:8787` or similar for your websocket.

Then just run `pnpm dev` in the root dir.

# Deployment

Run `pnpm build` to generate static nextjs assets and `pnpm deploy` to deploy cloudflare workers and DOs. Use cloudflare pages or vercel to host nextjs page.
