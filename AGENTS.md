<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# CRE Platform Engineering Rules

- Work only within the requested milestone.
- Do not implement future features unless explicitly requested.
- Do not modify frozen calculation behavior without explicit approval.
- Keep financial calculation logic separate from UI.
- Prefer reusable architecture over duplicated implementations.
- Avoid unnecessary dependencies.
- Maintain strict TypeScript.
- Run relevant tests after implementation.
- Run lint and a production build before declaring a milestone complete.
- Report files created, modified, and deleted.
- Report test, lint, and build results.
- Do not introduce proprietary, employer-confidential, or restricted source material into the repository.
- Do not assume unavailable Claude files will ever become available.
- Use public authoritative sources and original editorial work as the foundation for future knowledge content.
- Do not mass-generate placeholder articles or SEO pages.
- Preserve accessibility and semantic HTML.
- Do not silently change architecture outside milestone scope.
- Follow the content contracts in `src/content/contracts.ts` for future content metadata and sources.
- Follow `docs/editorial-standard.md` and `docs/source-policy.md` for content work.
- Consult `docs/content-architecture.md` and the records in `docs/adr/` before changing content architecture.
