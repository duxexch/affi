# AffiliateDeals

A full-stack affiliate deals platform where users browse discounted offers by category, brand, and keyword — and admins manage all content via a CRUD dashboard.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Frontend: React + Vite + Wouter + TanStack Query + Tailwind + shadcn/ui
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — OpenAPI 3 spec (source of truth for all API contracts)
- `lib/api-client-react/src/generated/` — Orval-generated React Query hooks and schemas (do not edit)
- `lib/api-zod/src/generated/api.ts` — Orval-generated Zod validators for the server (do not edit)
- `lib/db/src/schema/` — Drizzle ORM table definitions (`offers`, `categories`, `brands`, `blog_posts`, `indexing_queue`)
- `artifacts/api-server/src/routes/` — Express route handlers (public + admin)
- `artifacts/affiliate-deals/src/pages/` — React pages (public + admin)
- `artifacts/affiliate-deals/src/components/` — Shared React components

## Architecture decisions

- Contract-first: OpenAPI spec drives codegen for both client hooks and server validators, keeping them in sync.
- Orval TS2308 rule: never mix path params AND query params on the same operation. The generated TypeScript interface collides with the Zod schema file. Fix: move query params to separate operations or use only path params.
- The `@workspace/db` lib is composite (emits declarations). Always run `pnpm run typecheck:libs` after changing DB schema before typechecking leaf packages.
- All routes are registered under `/api` prefix (handled by `app.ts`). Route files do not include `/api` themselves.
- Admin routes have no authentication — suitable for adding auth middleware later.

## Product

- **Public**: Browse/search offers with discount badges, category grid, brand directory, blog posts, offer detail pages with affiliate CTA tracking.
- **Admin**: Full CRUD for offers, categories, brands, blog posts. Indexing queue management with retry support. Dashboard with live stats (total offers, clicks, pending indexing).

## User preferences

- PostgreSQL (not MySQL) despite original plan being MySQL/Hostinger.
- Seed data included: 5 categories, 5 brands, 6 offers, 3 blog posts.

## Gotchas

- After adding new Drizzle schema tables, run `pnpm run typecheck:libs` before typechecking the API server.
- Orval-generated hooks require `queryKey` in the `query` options when using conditional `enabled`. Use the generated `get<OperationName>QueryKey()` helpers.
- Import types from `@workspace/api-client-react` (root), not from its internal subpath `/src/generated/api.schemas`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
