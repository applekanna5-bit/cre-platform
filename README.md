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

M1B adds architecture-only content and source contracts plus repository governance. It does not add production content, calculators, rendering infrastructure, or final product UI.

## Repository standards

- Content contracts: [`src/content/contracts.ts`](src/content/contracts.ts)
- Human editorial standard: [`docs/editorial-standard.md`](docs/editorial-standard.md)
- Source policy: [`docs/source-policy.md`](docs/source-policy.md)
- Content architecture: [`docs/content-architecture.md`](docs/content-architecture.md)
- Architecture decisions: [`docs/adr/`](docs/adr/)
