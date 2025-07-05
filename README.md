# Before Starting

Run `pnpm i` in root to install all deps.

# Development

Make sure `.env.development` has the right port, and run `pnpm dev` in the root dir.

# Deployment

Run `pnpm run deploy` to deploy cloudflare workers and DOs from the backend and the pages from the frontend. Make sure `.env.production` has the right URLs for the frontend worker. If you're having trouble with env vars, you can run `pnpm clean` in the frontend directory.
