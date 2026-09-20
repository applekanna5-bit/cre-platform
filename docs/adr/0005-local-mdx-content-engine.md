# ADR 0005: Local MDX, reusable structured records, and separate financial logic

- Status: Accepted
- Date: 2026-09-20

## Context

M1B defines portable metadata and source contracts. The frozen content architecture identifies coarse knowledge domains without finalizing a taxonomy. Long-form CRE teaching needs original editorial prose, sourced institutional distinctions, worked examples, and purpose-driven relationships. It must not become React application code or a calculator engine.

## Decision

Editorial explanation lives in repository-controlled `.mdx` files under `content/<domain>/`, paired with a JSON metadata sidecar. Shared sources, knowledge identities, and fictional case data live in `content/data/`. Deterministic financial logic belongs in separately tested TypeScript domain modules; M3 creates no financial engine.

Use the official `@mdx-js/mdx` compiler at build time, with its normal `program` output. Next.js consumes the resulting ordinary JavaScript modules as server components. There is no runtime `evaluate`, `run`, `eval`, remote MDX, client-side MDX provider, or network content loader. An ignored generated manifest derives routes and module loaders from validated metadata. A single route template renders `/content/<domain>/<slug>`.

Existing dependencies provide no MDX compilation capability. One direct development dependency, `@mdx-js/mdx`, is necessary for the mature parser/compiler. Its transitive unified/remark/rehype packages are the compiler's own implementation, not an added editorial plugin collection. JSON sidecars avoid YAML/frontmatter and validation dependencies. An alternative `@next/mdx` integration requires a Next adapter, loader, provider, and MDX types; the explicit build step instead supports discovery, whole-catalog validation, and publication filtering before application compilation. See the [official compiler documentation](https://mdxjs.com/packages/mdx/) and the installed Next.js MDX guide.

Repository-owned validation checks metadata before use. A small local MDX policy pass allows registered editorial components and literal props, validates registry references and heading structure, and rejects executable editorial expressions and module imports. This is an authoring boundary, not a sandbox for hostile uploads. Content remains trusted, reviewed repository material.

## Contract reconciliation

`ArticleMetadata` extends M1B `ContentMetadata`; `ArticleInput` replaces only embedded `sources` with `sourceIds` on disk. Resolution restores the original `ContentSource[]` shape. M1B consumers and tests remain valid. Added delivery fields are stable ID, coarse domain, U1–U4 sensitivity, source classes, update date, typed relationships, and explicit development-fixture identity.

Preserve existing `difficulty`, `author`, `reviewer`, date names, source publisher/type/authority, and related arrays. Foundation/Practitioner/Institutional are display labels for foundational/intermediate/advanced. Add `brief` and `approved` states; retain `source-verification` as the fact-check equivalent and `ready` as the legacy approval-equivalent state. The union represents editorial states; it is not a workflow automation engine and does not force reviewer pass order.

Approved and published copy remains protected. Treat legacy ready and previously published needs-review/archived material conservatively as protected too. Engineering may change rendering and validation, not substantive protected prose, without explicit editorial authorization. No automated editorial rewrite is implemented.

## Publication boundary

Only published articles and previously published needs-review articles are routable in a normal production build. Needs-review content carries a visible review notice. Approved/ready/research/brief/review/draft/archived content is not published automatically. All files are nevertheless validated and compiled for errors.

Development fixtures require `fixture-*` IDs and draft status. `npm run dev` or the explicit `npm run build:fixtures` command enables their review routes and adds noindex metadata. This is protection for non-publication fixtures, not an M4 SEO implementation. Normal `npm run build` excludes them. The synthetic representative fixture is not CRE-015 and adds no canonical launch asset.

## Consequences

- No CMS, database, renderer framework, UI package, math package, or frontmatter parser is added.
- Node 22.18+ is required for native TypeScript stripping in build tools (verified on Node 24). Strict TypeScript checking still occurs during Next's production build.
- Ordinary MDX/JSON edits remain reviewable in Git. Generated modules are disposable, ignored artifacts. Compilation is sequential to avoid unbounded parallel parser memory at larger catalog sizes; article bodies are imported individually.
- Sources resolve centrally and can be reverse-indexed with `sourceDependents`. Purpose and target kind are independent relationship dimensions. Unimplemented glossary/calculator records never produce guessed routes.
- The M2.1 navigation config, visual tokens, homepage body, and editorial registry remain unchanged. The approved M3 visual refinement updates the shared header identity and article presentation; see the content-engine guide for the build-derived heading outline and server-rendered context rail.
- Adding a primitive is an intentional application change: add its typed component, registry binding, authoring-policy validation, and tests. Publishing still requires human technical/editorial/source review.
- Run supported npm scripts so compilation cannot be bypassed inadvertently. Direct `next build` is not the supported build entry; dev watches content and fails visibly on invalid edits. Changes to compiler code require restarting dev.
