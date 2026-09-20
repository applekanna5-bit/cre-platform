# M3 content engine

M3 is accepted and frozen as a content-engine milestone, not a publication launch. See [ADR 0005](adr/0005-local-mdx-content-engine.md) for decisions and tradeoffs. The [editorial standard](editorial-standard.md), [source policy](source-policy.md), [production system](editorial-production-system.md), canonical 48-asset registry, and M1B contracts remain authoritative.

## Files and commands

```text
content/
  underwriting/
    noi-development-fixture.mdx   # explanation only
    noi-development-fixture.json  # validated metadata
  data/
    sources.json                 # shared provenance
    knowledge.json               # glossary/calculator identities, no fake routes
    cases.json                   # reusable fictional facts and financial tables
src/content/
  contracts.ts                   # original contracts plus compatible M3 extensions
  validation.ts                  # untrusted JSON -> validated contracts
  discovery.ts                   # recursive local discovery
  catalog.ts                     # identity, routing, relationships, source dependents
  compile.ts                     # MDX compiler and authoring policy
  .generated/                    # ignored compiler output; never edit or commit
scripts/content.mts              # compilation and local dev watcher
```

Use Node 22.18 or newer and `npm install`/`npm ci`, including dev dependencies for builds. The only new direct package is the official MDX compiler, used during build/dev/test, not in browser runtime. Node may emit a harmless module-detection warning for the existing package's implicit module mode; no global package module-mode change was made.

- `npm run dev`: validate, compile with synthetic fixtures enabled, start Next, watch MDX/JSON changes.
- `npm run content:check`: validate all content and generate publication-only modules.
- `npm test`: compile the fixture then run all tests.
- `npm run lint`: source lint (generated compiler code is excluded).
- `npm run build`: validate everything and build publication-only routes.
- `npm run build:fixtures`: explicit local review build including fixtures; then `npm start`.

Review route: `/content/underwriting/noi-development-fixture`. A normal production build must return 404 for it. The fixture build has a prominent **Development fixture — not publication content** label and noindex. Do not deploy a fixture-enabled build as a publication release. No fixture link is added to frozen primary navigation or the homepage.

Only the underwriting directory exists now. Create other supported coarse domains when real authorized content needs them: `learn`, `property-types`, `financing`, `agency`, `modeling`, `resources`, `insights`. Analysis and valuation are topics/content types within established domains, not newly frozen top-level taxonomy. Recursive discovery allows subdirectories without changing routes. Metadata domain must match the first directory; canonical routes use metadata, not filenames or manually duplicated page definitions. Same slug across different domains is a different canonical route; duplicate IDs or full routes fail.

## Metadata and editorial states

Each MDX file has one same-basename JSON sidecar. JSON is data, never executable metadata. Consult `ArticleInput` in `src/content/contracts.ts` and the synthetic fixture for the full shape. Unknown fields, empty required text, unsafe slugs, invalid enums/dates, missing pairs, duplicate IDs/routes, and unresolved sources/relationships fail with a file or field context.

M1B field names are preserved: `difficulty`, `author`, optional `reviewer`, `publishedDate`, `lastReviewedDate`, `propertyTypes`, `loanProducts`, `topics`, and existing related arrays. Do not add redundant `level`, `authors`, or `reviewedAt` aliases. Add richer contributor structures only when a real publishing need justifies them.

M3 adds `id`, `domain`, `updateSensitivity`, `sourceClasses`, optional `updatedDate`, `relationships`, and `developmentFixture`. On disk, `sourceIds` resolves to M1B `sources`. An article's `slug` is lowercase and hyphenated. IDs remain stable if titles or routes change. The 48-asset registry remains a planning source, not a route generator.

Supported states: research, brief, draft, technical-review, editorial-review, source-verification, ready, approved, published, needs-review, archived. `source-verification` is the established fact-check state; `ready` is retained for M1B compatibility. Review order is editorial policy, not enforced by the engine. Approval/publication requires reviewer, review date, and sources; publication additionally requires a publication date. A previously published needs-review article remains visible with a notice. Other non-published states and archived articles do not render publicly.

**Protected copy:** approved/published content must not be substantively rewritten by engineering tasks. `isEditoriallyProtected` also conservatively covers ready, needs-review, and archived states. This helper does not enforce Git permissions or authorize edits; review remains human governance. Never change status to bypass editorial protection.

U1 means low/evergreen sensitivity, U2 moderate, U3 high/program-specific, U4 current/rapidly changing. Source classes are A evergreen, B institutional/practitioner, C program-specific. Sensitive non-fixture articles require cited sources to carry public URLs, access dates, and review dates. Validation does not establish factual accuracy or replace source review.

## Sources and reusable data

`content/data/sources.json` contains M1B source records keyed by `id`. Keep title, publisher (organization), type, authority, public URL where applicable, relevant publication/update/access/review dates, and notes. M3 adds optional effective date, U1–U4 sensitivity, and a synthetic flag. Do not duplicate provenance inside articles.

`sourceDependents(catalog, sourceId)` answers which articles directly cite a source, including unpublished articles for editorial review. Inline source notes and institutional examples must cite a source already declared by the article. The article template renders the resolved source list once. Unknown references fail compilation. Synthetic sources require contextual authority and notes, and cannot be referenced by non-fixture content.

Canonical fictional cases and financial tables live in `cases.json`, independently of any article. The generic CaseStudy and FinancialTable components bind by ID. Values are preformatted illustrative data, not calculation inputs or financial-engine outputs. Formula and Calculation explain supplied values only. Future deterministic calculations belong in independent TypeScript domain modules with their own tests; MDX must consume their presentation output rather than become their source of truth.

## Knowledge relationships

`relationships` stores `{ purpose, target: { kind, id } }`. Purposes: prerequisite, deep-dive, application, tool. Target kinds: article, glossary, calculator, case-study. Do not place related-article URLs in React.

Existing M1B arrays remain meaningful: relatedContent defaults to Deep Dive, relatedGlossaryTerms to Prerequisite, relatedCalculators to Tool. Prefer explicit typed relationships for new editorial links; identical purpose/target references deduplicate. Article targets resolve through metadata and publication eligibility. Registered glossary/calculator identities are displayed as Not available in M3; they have no manufactured routes or UI pages. Embedded case studies resolve to their on-page anchor. A case relationship without an embed remains non-linked. Article-to-article relationships are exercised with in-memory test articles without generating placeholder pages.

## Authoring primitives

The template owns h1, provenance, and relationship navigation. Start body headings at `##` and never skip a level. Heading IDs are generated as `section-<heading>` with deterministic duplicate suffixes. Local fragments must resolve. Ordinary Markdown paragraphs, lists, emphasis, blockquotes, and code blocks are supported; no math or GFM plugin is installed.

| Primitive | Authoring interface | Purpose |
| --- | --- | --- |
| Formula | `formula`, `variables` array of `{symbol, meaning}`, optional `interpretation` | Formula definition, units and meaning |
| Calculation | `inputs` array of `{label, value}`, `formula`, `result`, `interpretation` | Stated worked example, no computation |
| PractitionerNote | Markdown children | Practitioner judgment, explicitly labeled |
| ConventionNote | Markdown children | Legitimate convention/methodology differences |
| InstitutionalExample | `sourceId`, Markdown children | Institution-specific method separated from general teaching |
| Warning | Markdown children | Analytical caution without alert/notification behavior |
| CaseStudy | `caseId` | Generic fictional educational case, placed after a level-two heading |
| FinancialTable | `tableId` | Caption, column headers, row headers, numeric alignment, keyboard-scrollable region |
| SourceNote | `sourceId` | Link to article provenance |
| Sources | Template-owned resolved source records | One provenance section per article |
| RelationshipNavigation | Template-owned resolved relationships | Purpose-driven links and explicit unavailable targets |

Example:

```mdx
## Method

<Formula formula="NOI = EGI − Operating Expenses" variables={[{symbol: "NOI", meaning: "Net operating income, USD per year"}, {symbol: "EGI", meaning: "Effective gross income, USD per year"}, {symbol: "Operating Expenses", meaning: "Property operating expenses, USD per year"}]} />

<PractitionerNote>State the evidence behind each adjustment.</PractitionerNote>
```

Registered props are strings, booleans, arrays, and objects containing literal values. Imports/exports, free expressions, function calls, spreads, arbitrary HTML/JSX, and unknown primitives are rejected. This intentionally prevents coupling prose to application code. MDX is still trusted repository content, not an upload or remote execution service. Review all changes before accepting them.

## Add an article safely

1. Confirm the editorial task and canonical identity. Never create production content merely to fill a route.
2. Add authorized original MDX and its JSON sidecar under an existing domain. Start with draft status, `developmentFixture: false`, and a stable ID. Drafts are validated but not publicly routable.
3. Reuse or add public source records with full provenance; add reusable knowledge/case records only when justified. Do not copy employer/client material or depend on unavailable files.
4. Declare source IDs and purpose-driven target IDs. Use registered primitives with literal presentation data.
5. Run content validation, tests, lint, and build. Inspect an authorized development fixture for renderer changes; general draft-preview/authentication infrastructure is outside M3.
6. Complete the established human review workflow before approved/published states. Set publication/review dates and reviewer deliberately; synthetic material cannot be promoted to publication.
7. Review the diff, source fidelity, accessible headings/tables/focus, mobile widths and 200% text sizing. Do not commit generated files. Once approved/published, preserve protected editorial prose.

No M4 schema, sitemap, search, calculators, CMS, authentication, analytics, or production articles are introduced.


## Initial M3 verification record

- 53 tests pass, including the unchanged M1/M2/M2.1 suites and new metadata, discovery, duplicate, source, relationship, MDX-policy, rendering, and table checks. The bridge arithmetic is checked in a test only; no financial engine exists.
- Lint and the publication-only production build pass. The explicit fixture build also passes and statically renders the representative route.
- Publication-only HTTP verification returns 404 for the fixture. Local preview returns 200 with a development label and noindex/nofollow.
- The dev watcher was exercised with a temporarily invalid source ID: valid content returned 200, the invalid edit failed closed with 500, and restoring the original data recovered to 200. Original fixture bytes were restored.
- Production Chrome screenshots were inspected at 320, 390, 768, 1024, and 1440px. No horizontal page overflow occurred at normal or 200% root text sizing. The table scrolls inside its own region; arrow-key scrolling and a visible 3px focus outline were verified.
- Heading hierarchy, row/column headers, caption, labeled callouts, source/case fragment focus, skip navigation, and rendering without JavaScript were checked. Minimum measured visible text contrast is 5.02:1. This is browser verification, not a manual screen-reader audit.
- No new client components, external assets, production articles, real transaction data, protected editorial edits, or M4 features were introduced. Only the MDX compiler and its transitive dependencies were added; existing locked package versions are unchanged.

## M3 visual refinement

The approved visual refinement uses the existing navy, warm-stone, copper, and steel-blue tokens, with a typographic CRE publication masthead. The shared header identity changes across the site; the M2.1 homepage body, navigation destinations, and mobile navigation behavior remain unchanged.

The article uses an approximately 74/26 desktop grid with a separately constrained prose measure. At 320, 390, and 768px the context rail follows the article. At 1024 and 1440px it sits on the right. A container query returns the layout to one column when enlarged text leaves insufficient reading width, including all five tested widths at 200% root text sizing. The masthead wraps vertically at narrow enlarged-text widths. Tables retain their own keyboard-accessible horizontal scroll regions.

`ArticleContext` is a server component. The existing MDX policy pass now returns an `ArticleHeading[]` outline alongside compiled code and embedded case IDs, using the same generated anchors as the body. Generic case-study headings enter the outline from their case records; the template adds sources and relationship anchors only when those sections exist. The ignored generated manifest exposes this outline as `articleHeadings`. The dev watcher's failure output preserves the same export shape. No metadata sidecars or editorial prose are changed, and there is no second parser, client TOC package, scroll tracking, or additional client boundary.

The context rail reuses `RelationshipNavigation` with distinct navigation IDs and the existing resolved typed relationships. Unavailable targets remain non-links labeled **Not available**. Native fragment navigation works without JavaScript; body headings and template section targets accept keyboard focus. Copper marks hover/focus alongside underlining and the existing visible focus outline, without implying an active-section state.

Visual verification covers all five widths at normal and 200% text size. No page overflow was measured. Browser checks cover heading hierarchy, unique IDs, valid rail targets, skip-link focus, mobile menu Enter/Escape behavior, anchor focus, table arrow-key scrolling, caption and row/column headers, and no-JavaScript rendering. The minimum measured visible text contrast is 5.02:1. This is not a manual screen-reader audit. Screenshots and browser measurements are local ignored artifacts in `build/m3-visual/`.

The refined engine has 54 passing tests, including repeated/formatted heading outlines and rendered fragment integrity. Lint, publication-only build, and explicit fixture build pass. The publication-only server returns 404 for the fixture; the fixture build returns 200 with its unchanged development warning and noindex/nofollow. No dependencies, publication rules, canonical numbers, calculation behavior, or editorial content changed in this refinement.
