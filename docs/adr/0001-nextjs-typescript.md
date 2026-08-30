# ADR 0001: Use Next.js and TypeScript

- Status: Accepted
- Date: 2026-08-30

## Context

The platform will eventually combine interconnected educational content with interactive financial tools and must remain maintainable as it grows.

## Decision

Use the stable Next.js App Router with React and strict TypeScript. Next.js provides a cohesive rendering and routing foundation, while TypeScript makes content and financial interfaces explicit and checkable.

## Consequences

New architecture must respect server/client boundaries and strict typing. Framework-specific decisions should stay at delivery boundaries where practical so domain contracts remain portable.
