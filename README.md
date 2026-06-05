# Scaleboard

**by Web My Money** — Marketing performance operating system for the WMM team.

<p align="center">
  <img src="public/scaleboard-wordmark.svg" alt="Scaleboard by Web My Money" height="48" />
</p>

## Quick start

```bash
cp .env.example .env.local        # add your ANTHROPIC_API_KEY
npm install
npm run dev                       # http://localhost:3000
```

## Environment variables

| Var                | Default              | Notes                                                          |
| ------------------ | -------------------- | -------------------------------------------------------------- |
| `ANTHROPIC_API_KEY` | —                   | Required for AI features                                       |
| `WMM_DATA_DIR`     | `./data/clients`     | Where per-client folders live on disk                          |
| `STORAGE_DRIVER`   | `fs`                 | `fs` (local) or `supabase` (future)                            |
| `AI_PROVIDER`      | `anthropic`          | `anthropic` (direct) or `openrouter` (future)                  |

## Scripts

| Script              | Purpose                                              |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Start Next.js dev server (rebuilds design tokens)    |
| `npm run build`     | Production build                                     |
| `npm run start`     | Run production build                                 |
| `npm run typecheck` | TypeScript no-emit check                             |
| `npm run test`      | Vitest unit tests                                    |
| `npm run test:e2e`  | Playwright E2E tests                                 |
| `npm run build:tokens` | Regenerate design tokens from `docs/input/DESIGN.md` |

## Documentation

- **Spec:** [`docs/superpowers/specs/2026-06-05-client-workspace-foundation-design.md`](docs/superpowers/specs/2026-06-05-client-workspace-foundation-design.md)
- **Roadmap:** [`docs/input/wmm-story-engine-roadmap.docx`](docs/input/wmm-story-engine-roadmap.docx)
- **Design system:** [`docs/input/DESIGN.md`](docs/input/DESIGN.md)

## Architecture (one-liner)

UI and services depend only on three interfaces — `ClientRepo`, `AiClient`, `TeamRepo`/`SessionProvider` — each backed by adapters selected from env vars. Migrating to Supabase + Vercel is a future spec that swaps adapters; nothing in `app/` or `components/` changes.
