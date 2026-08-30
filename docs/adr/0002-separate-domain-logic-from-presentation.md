# ADR 0002: Separate domain logic from presentation

- Status: Accepted
- Date: 2026-08-30

## Context

CRE content and financial calculations require review and testing independently from how a page renders them.

## Decision

Keep content contracts and deterministic financial calculation logic separate from React components and presentation concerns. UI code may consume domain outputs but must not become their source of truth.

## Consequences

Calculations can be tested without a browser, content can move between delivery systems, and presentation changes are less likely to alter financial behavior. This ADR does not define or implement a calculation engine.
