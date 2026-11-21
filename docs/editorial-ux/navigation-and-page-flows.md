# Navigation and page flows

Keep one primary navigation in the approved order. Use the same labels and destinations in the header, mobile disclosure and any repeated footer links. The shared site search remains a separate utility. All routes and anchors marked proposed require implementation and publication review.

| Primary label | Destination | What the reader should find |
| --- | --- | --- |
| Loan Lifecycle | Proposed `/loan-lifecycle` | The seven stages, published reading, planned coverage and links into relevant tracks |
| Underwriting | Proposed `/specializations#underwriting` | Financial analysis, NOI, valuation, sizing, fictional examples and credit inputs |
| Property Types | Proposed `/specializations#property-types` | Residential and commercial asset tracks and their operating distinctions |
| Financing & Markets | Proposed `/specializations#financing-markets` | Lender and product choices, agency tracks, secondary-market loan sales and securitization |
| Servicing | Proposed `/specializations#servicing` | Servicing roles, consent requests, asset management and resolution |
| Library | Existing `/library` | All published articles and their original URLs |

Use one specialization page initially. Keep stage anchors stable as titles evolve and use the identifiers in the [content blueprint](content-blueprint.md). The proposed homepage beginner anchor is `/#start-reading`. When implementation moves the legacy homepage destinations, check existing internal or shared links to `/#learn`, `/#underwriting`, `/#property-types`, `/#financing`, `/#modeling`, `/#tools` and `/#resources`. A fragment is local to the browser. Where needed, retain a focusable compatibility target or an actual link in the corresponding homepage section. Review which fragments have consumers before removing them.

## Entry points and visitor journeys

| Visitor | Entry and sequence | Useful arrival or fallback |
| --- | --- | --- |
| New to CRE | Homepage → “Start reading” → published GPI/EGI guide → T-12 or rent roll → revenue and NOI | The homepage explains in one sentence why to begin with a property’s income. Offer the lifecycle as the map and note that a foundations article is planned. |
| Analyst with a document | Library or site search → rent roll or T-12 → the other evidence source → revenue underwriting → NOI | Put relevant next reading in the context of the evidence. Preserve normal back navigation. |
| Experienced lender or investor | Underwriting → DSCR, NOI or direct capitalization directly → an applicable worked example or related guide | Offer topic snippets and brief scope cues, including cash-flow basis, case identity or limits. Avoid gating reading behind a sequence. |
| Reader with an asset or loan question | Property Types or Financing & Markets → applicable track → published reading where relevant → parallel stage or comparator | Where coverage is planned, explain what it will cover in plain text. Offer only relevant current reading. |
| Reader handling a post-closing issue | Servicing → appropriate role, consent or default topic → appropriate agreement or scope note → linked credit or secondary-market context | Avoid static instructions presented as loan-specific authority. Indicate when the article is planned and which source governs the future example. |
| Search or shared-link visitor | Existing canonical article → breadcrumb to Library and a contextual stage or track link → suggested next reading | Preserve breadcrumbs and article anchors. Support direct access without establishing a reading history. |

## Published and planned navigation

- A stage link opens a stage section with a clear heading. Published article links resolve through the existing publication allowlist. The Library and search continue to exclude unpublished content.
- Use a concise plain-text “Planned” note for gaps. At a stage with available reading, show the available items before the planned note. No placeholder routes, publication-count promises or mandatory progression.
- Use context where it changes the decision. Link a term to its explanation on the first useful occurrence, and use action-oriented labels for examples. Choose one primary next read and a second link only if there is a materially different direction. Resolve related content by stable article ID.
- Reserve secondary navigation for in-page anchors and breadcrumbs. Preserve About and Editorial Standards in the footer. Avoid account or feedback navigation changes in this work package.
- Preserve the native mobile disclosure and shared skip link. Use ordinary links with visible keyboard focus. Check link activation, destination focus for in-page links, Escape with focus return, resize and operation without JavaScript. A mobile section list should wrap or stack in reading order.

## Delivery requirements for a later implementation

Centralize labels and route mapping. Add only the two approved discovery routes to the public allowlist when their pages are ready. Review their metadata, sitemap behavior, local anchors and exposure through navigation together. Preserve `/`, `/library`, `/search`, `/about`, `/editorial-standards`, and every `/content/underwriting/…` route. Leave authentication, feedback, publication gates and preview controls independent of the navigation change.

Review exact destinations, canonical article paths, focus and JavaScript-disabled behavior at the same time. Include a regression check that planned topics are text and that rendering the roadmap never surfaces an unpublished record. [Design specification and evidence](page-design-specification.md)
