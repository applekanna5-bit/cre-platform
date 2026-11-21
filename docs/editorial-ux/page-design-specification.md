# Page design specification

## Observed gaps at reviewed baseline `05880f6`

| Observed in the repository | Proposed improvement for implementation |
| --- | --- |
| The primary config lists Library and seven other categories. Seven links lead to homepage fragments. The reviewed source tree has no lifecycle or specialization landing page. The six-domain version exists in the separate M3.35 draft. | Use the six approved labels and two substantive destinations in [navigation and page flows](navigation-and-page-flows.md). Treat the draft as a reference and preserve its separation from this work package. [Navigation config](../../src/config/navigation.ts) · [Reviewed route registry](../../src/seo/public-pages.ts) |
| The public homepage renders the cinematic composition and then a separate “Explore CRE areas” directory. It offers the underwriting reading journey inside a later directory entry. The same directory includes the previously rejected terminology. | Put one beginner link near the main proposition, group lifecycle and subject discovery once, and label the model accurately. [Homepage source](../../src/app/page.tsx) |
| The Library publishes all eight articles, all currently in the underwriting delivery domain. Their subject evidence supports the financial analysis and sizing stages. No published foundations, closing or servicing articles are available. | Preserve the existing collection. Surface available reads early, distinguish gaps in plain language, and avoid new collection pages with no useful content. [Library route](../../src/app/library/page.tsx) · [Article inventory](content-blueprint.md#published-teaching-sequence) |
| Article context already includes a heading outline and compact relationships. The article body renders sources and relationships again; the header exposes internal update-sensitivity codes. | Keep useful navigation and provenance. Offer one next-reading section and make the contextual rail primarily an outline. Present publish and review dates in reader terms. Keep internal classification in editorial records. [Article template](../../src/components/content/article-template.tsx) · [Context rail](../../src/components/content/article-context.tsx) |
| Tables already have captions, a labelled keyboard-scroll region and a scroll hint. The reading system already includes shared spacing and focus tokens. | Reuse these affordances, verify long numeric and text content on narrow screens, and limit visual changes to presentation. [Table primitive](../../src/components/content/primitives.tsx) · [Current tokens](../../src/app/globals.css) |

These observations come from source review. Mobile readability, contrast and focus checks below are future acceptance criteria.

## Homepage `/`

1. Use a single editorial H1, a sentence about what the publication helps readers do, and a visible “Start reading” link to a short introductory block. A secondary “Explore the loan lifecycle” link leads to the roadmap. The beginner block links to the available GPI/EGI guide with a short reason to start there.
2. Follow with seven lifecycle links and one small specialization directory. Let the roadmap and tracks carry the detail. Avoid repeating the same destination list elsewhere in the page body.
3. Feature a small selection of published articles with one clear editorial reason for each selection. Use a plain list or restrained editorial grid. Link the Library for the full collection.
4. Keep one clear entry to the existing fictional multifamily model, with accessible assumptions, verified outputs, reset and its limitations. A compact view and full view would share one verified calculation and state if both are approved later. Preserve the model’s calculations and scope. Do not add property metrics the existing model does not calculate. Use “Multifamily Underwriting Model” and distinguish it from article cases.
5. Use the current editorial masthead and colors. Decorative photography is optional and should be omitted unless it conveys useful context. Avoid parallax, autoplay, decorative counters and excessive introductory panels.

## Lifecycle landing page `/loan-lifecycle`

Use an H1, a short explanation of the map, and a seven-stage anchor list. Describe loan-path variation once at the top, with links to relevant products and servicing. Each H2 names the stage, describes the decision in one sentence, and shows any current readings before brief planned coverage. At the top, include a direct “Read financial analysis” link so beginners can reach published reading without passing through two planned-only sections. Secondary-market reading belongs in the Financing & Markets track, with a contextual link near funding and servicing.

On mobile, keep stage order, anchors and focus clear. Avoid timelines whose meaning depends on horizontal movement, colored markers or decorative animation.

## Specialization page `/specializations`

Use four anchored H2 sections for Underwriting, Property Types, Financing & Markets, and Servicing. Each section describes the decisions it addresses and provides a published reading list if available. Group its connected tracks under plain subheadings only when the grouping helps navigation. For planned coverage, describe the intended scope and link any genuinely relevant existing article by canonical path. Preserve one article identity regardless of how many sections reference it. Avoid separate thin landing pages and large sets of empty cards.

## Article page `/content/<domain>/<slug>`

Keep one H1 with the reviewed title and deck, scoped breadcrumbs, contributor attribution when present, and meaningful publication and review dates. Preserve all existing editorial copy and metadata. Present article guidance as display, not as an edit to the article. A planning-stage topical anchor can appear as contextual navigation after route approval.

Use the generated heading outline for “On this page”. Desktop may use the existing contextual rail if it keeps the text column readable. On mobile, place an accessible outline disclosure before long reading, leave later sections accessible by ordinary anchors, and avoid trapping focus. Keep primary next reading in one end section, with a nearby application or tool link only when it adds value. Preserve source attribution, scope cautions, case labels and author/reviewer records.

Retain semantic financial tables with captions, row and column headers, units, visible keyboard focus and a contained horizontal scroll region on small screens. Keep numeric columns stable and right-aligned. If a useful conclusion requires scrolling, offer a brief contextual sentence above the table where authorized. Do not alter figures or turn every cell into an unlabeled card. Formulas should wrap or scroll within their own region, and fictional assumptions should remain visible.

## Design acceptance

- Keep the current Source Serif 4 and Source Sans 3 typography, existing semantic ink, warm-paper and copper tokens, and the current focus treatment. Keep the article measure near the existing 68-character reading container, with wider regions only for content such as tables.
- Use visible heading hierarchy, 44px link and control targets where the current design applies them, WCAG AA contrast, keyboard access, native links and a workable JavaScript-disabled reading path. Retain users’ reduced-motion preferences and avoid introducing decorative motion.
- Review homepage, roadmap, specializations and the longest published articles at 320, 375, 768, 1024 and 1440px and at 200% text size. Check long labels, error-free fragment navigation, focus and table behavior. Record screenshots and keyboard checks in the later implementation review.
- Verify published article body and metadata hashes, canonical paths, index eligibility and access controls before release. Keep the shared MDX pipeline and financial logic boundaries. Update tests and design documentation only when implementation is authorized. [Design system](../design-system.md) · [Content and calculation separation](../adr/0002-separate-domain-logic-from-presentation.md)
