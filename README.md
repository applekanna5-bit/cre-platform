# CRE Platform

A commercial real estate knowledge, underwriting, financial modeling, and decision-support platform. The project is currently limited to its technical foundation; content systems, calculators, and product features belong to later milestones.

## Technical stack

- Next.js App Router
- React
- TypeScript (strict mode)
- Tailwind CSS
- Vitest
- ESLint

## Local development

Install dependencies and start the development server:

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

M2 adds a reusable design system, responsive global navigation, footer, and homepage routing shell. Navigation points to clearly labeled planned section overviews on the homepage. Content and source contracts and M1 governance remain intact; content ingestion, production articles, calculators, and search are deferred.

See [`docs/design-system.md`](docs/design-system.md) for tokens, primitives, navigation configuration, accessibility behavior, and verification guidance.

## Repository standards

- Content contracts: [`src/content/contracts.ts`](src/content/contracts.ts)
- Human editorial standard: [`docs/editorial-standard.md`](docs/editorial-standard.md)
- Source policy: [`docs/source-policy.md`](docs/source-policy.md)
- Content architecture: [`docs/content-architecture.md`](docs/content-architecture.md)
- Architecture decisions: [`docs/adr/`](docs/adr/)
