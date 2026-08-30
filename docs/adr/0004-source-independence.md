# ADR 0004: Preserve source independence

- Status: Accepted
- Date: 2026-08-30

## Context

Restricted employer or client material cannot be a lawful, durable foundation for the platform. Unavailable Claude files cannot be assumed to exist or remain accessible.

## Decision

Build from public authoritative sources and authorized original editorial work. Exclude confidential, proprietary, restricted, and otherwise unauthorized material. Treat any safely available Claude-generated material only as optional secondary reference material, never as the source of truth.

## Consequences

Templates and analysis must be created independently, and claims must remain verifiable without private files. Some work may take longer, but the repository remains lawful, reviewable, and portable.
