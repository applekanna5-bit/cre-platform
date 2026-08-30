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

M1A establishes the repository and technical foundation only: the Next.js application shell, minimal global styles and homepage, strict TypeScript, linting, and a working test environment. It intentionally excludes the future content system, calculators, integrations, and final site design.
