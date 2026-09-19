# M1C — Codex Implementation Instructions

## Objective
Synchronize the approved launch-content architecture and editorial-production governance into the existing private `cre-platform` repository without changing application behavior.

## Inputs
Add the supplied files to `docs/`:
- `docs/launch-content-registry.md`
- `docs/content-dependency-map.md`
- `docs/editorial-production-system.md`

## Required governance update
Update `AGENTS.md` minimally to add this rule, preserving all existing rules:

> Approved or published editorial content is protected. Engineering tasks may render, style, index, link, validate, or migrate approved content, but must not substantively rewrite editorial copy unless the task explicitly authorizes editorial modification.

Also state that confidential, employer-restricted, client-confidential, proprietary, or otherwise unauthorized source material must never be introduced into the repository.

## Constraints
- Do not rewrite or “improve” the supplied documents.
- Do not create articles, calculators, taxonomy implementations, CMS integrations, databases, MDX systems, or UI in this milestone.
- Do not modify existing application behavior.
- Do not add dependencies.
- Preserve existing M1A/M1B architecture and governance.
- Do not introduce any restricted employer material or inaccessible prior Claude output.

## Verification
Run the repository's existing test, lint, and production build commands. Report exact results.

Review `git diff` for scope compliance and secrets/restricted material.

## Commit
If and only if verification passes, commit with:

`milestone: complete CRE M1C editorial architecture sync`

Push to the existing tracked remote branch.

## Completion report
Return:
- files created
- files modified
- files deleted
- dependencies added
- test/lint/build results
- commit hash
- push status
- final `git status --short --branch`
- explicit confirmation that application behavior and approved editorial copy were not changed
