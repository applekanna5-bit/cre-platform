# CRE Platform

A commercial real estate knowledge, underwriting, financial modeling, and decision-support platform. M3 completes the reviewed local MDX content engine; production editorial content, calculators, and later product features remain deferred.

## Technical stack

- Next.js App Router
- React
- TypeScript (strict mode)
- Tailwind CSS
- Vitest
- ESLint

## Local development

Install dependencies and start the development server:

Use Node.js 22.18 or newer (native TypeScript execution is used by content build tools).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Quality checks

```bash
npm test
npm run test:watch
npm run lint
```

`npm test` runs the test suite once. `npm run test:watch` reruns tests while files change.

## Production build

```bash
npm run build
npm start
```

The build command creates an optimized production build. After it succeeds, the start command serves that build.

## Current milestone

M2.1 is frozen at `8180e01fadf38cf6ec602dae4b619dcf4c8390ce`. M3 completes validated local MDX, shared source/case records, rich editorial components, and an article template. The approved CRE masthead and favicon complete the site identity; the frozen homepage body and navigation behavior remain unchanged. M1B contracts remain compatible, and ADR 0005 is accepted.

`npm run dev` enables the explicitly synthetic fixture at `/content/underwriting/noi-development-fixture`. `npm run build` excludes it from publication; `npm run build:fixtures` creates an opt-in local review build. The fixture is not CRE-015 or publication content. See [`docs/content-engine.md`](docs/content-engine.md) and [ADR 0005](docs/adr/0005-local-mdx-content-engine.md) for authoring, validation, source/relationship resolution, publication boundaries, and editorial protection.

See [`docs/design-system.md`](docs/design-system.md) for tokens, primitives, navigation configuration, accessibility behavior, and verification guidance.

## Repository standards

- Content contracts: [`src/content/contracts.ts`](src/content/contracts.ts)
- Human editorial standard: [`docs/editorial-standard.md`](docs/editorial-standard.md)
- Source policy: [`docs/source-policy.md`](docs/source-policy.md)
- Content architecture: [`docs/content-architecture.md`](docs/content-architecture.md)
- Architecture decisions: [`docs/adr/`](docs/adr/)
