# Repository Guidelines

## Project Structure & Module Organization

- `src/app` — Next.js App Router routes, pages, layouts, and API routes (e.g., `src/app/api/agent/route.ts`, `src/app/api/wa/webhook/route.ts`). Global styles in `src/app/globals.css`.
- `src/components` — Reusable UI (Tailwind). UI primitives in `src/components/ui`.
- `src/lib` — Utilities and integrations (e.g., AI provider, helpers). Import alias `@/` maps to `src/`.
- `src/services` — Domain use-cases and orchestration (agent, order, catalog).
- `src/repositories` — Data access and in-memory stores.
- `src/domain` and `src/types` — Domain models and TypeScript types.
- `public` — Static assets. Config: `eslint.config.mjs`, `postcss.config.mjs`, `next.config.ts`.

## Build, Test, and Development Commands

- `pnpm dev` — Run the app locally at `http://localhost:3000` (Turbopack).
- `pnpm build` — Production build.
- `pnpm start` — Start the built app.
- `pnpm lint` — Run ESLint.
- `pnpm format` / `pnpm format:write` — Check or write Prettier formatting.
  Note: `pnpm` is preferred (lockfile present). `npm`/`yarn` also work if needed.

## Coding Style & Naming Conventions

- TypeScript strict mode enabled. Use `@/` alias for internal imports.
- Formatting via Prettier (+ Tailwind plugin). Indentation: 2 spaces; semicolons required.
- ESLint extends `next/core-web-vitals` + TypeScript. Fix warnings before merging.
- File names: kebab-case or lowercase (e.g., `button.tsx`). React components: PascalCase identifiers. API routes: `route.ts` per Next.js convention.

## Testing Guidelines

- No test framework is set up yet. If adding tests, prefer Vitest + Testing Library.
- Suggested structure: colocate `*.spec.ts`/`*.spec.tsx` near sources or under `src/**/__tests__`.
- Ensure `pnpm lint` passes and include a brief test plan in PRs.

## Commit & Pull Request Guidelines

- Husky runs `lint-staged` on commit (Prettier + ESLint). Ensure a clean run.
- Commits: concise, imperative subject (e.g., "feat: add order service filter").
- PRs: clear description, linked issues, screenshots for UI changes, and steps to verify (commands + URLs). Note relevant env vars.

## Security & Configuration Tips

- Configure `.env.local` (see `.env.example`). Required: `ANTHROPIC_API_KEY`, `WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, optional `WHATSAPP_API_VERSION`, `WHATSAPP_VERIFY_TOKEN`.
- Never commit secrets. Avoid logging PII. Verify WhatsApp webhook with `VERIFY_TOKEN`.
