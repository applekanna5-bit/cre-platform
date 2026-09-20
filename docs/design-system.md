# M2 design and navigation architecture

M2 adds the shared visual foundation and global shell. It does not implement publishing, content ingestion, calculators, search, or a new taxonomy. M1 content contracts, editorial standards, source policy, and approved documents remain unchanged.

## Tokens and primitives

`src/app/globals.css` defines semantic Tailwind v4 theme tokens for background, surface, elevated surface, foreground, muted text, borders, accent, success, warning, error, and focus. Status colors are foreground colors for light surfaces, not independent status indicators. Always pair status color with text. Use the stronger border token for control boundaries; the softer token separates non-interactive content.

System Arial/Helvetica provides interface typography; system Georgia provides the display heading. No fonts, images, or other assets are fetched from external services. The scale runs from 12px labels through a fluid 40–64px display size. Spacing follows Tailwind's 4px base; controls, badges, and panels use restrained 2px radii.

`src/components/ui/primitives.tsx` supplies `Container` (wide, content, reading), `Section`, `Eyebrow`, `Surface`, `Badge`, and `ActionLink`. Native element props preserve semantic labeling. Choose heading levels in the consuming page; appearance must not dictate document hierarchy. Reading width is limited to 68 characters. Action links require an actual destination. Add interactive buttons or callouts only when a feature needs them.

## Global shell and configuration

The root layout owns the skip link, header, main landmark, and footer. Pages provide content inside the shared main landmark. Components are server components except `MobileNavigation`, which receives the server-rendered navigation list as children.

`src/config/navigation.ts` is the source of primary labels, destinations, homepage paths, and footer groups. Its link/planned union prevents planned destinations from carrying an href. Optional child navigation is an extension point for a later dropdown design; the M2 renderer intentionally displays only the top level. Do not add children until their presentation and keyboard behavior are implemented.

Only `/` exists as a product page. The seven primary links target actual, focusable homepage section headings using `/#id`; these remain section overviews with user-facing Coming soon availability labels, not functioning hubs. The footer reuses these targets and represents Glossary, Contributors, and About/editorial as Coming soon plain text. Replace destinations centrally as real routes become available. Native anchors preserve fragment navigation without JavaScript. No search affordance is displayed.

## Mobile and accessibility

Below 64rem the primary navigation uses native `details`/`summary`. This is an inline, non-modal disclosure, with native expanded/collapsed semantics and Enter/Space operation. It needs no focus trap or application-menu roles. Client enhancement closes it on Escape (returning focus to the summary), ordinary link activation, focus leaving the disclosure, or crossing to desktop. Same-page activation focuses the destination heading; desktop resizing moves focus to the brand if it would otherwise become hidden. Modified link clicks retain normal browser behavior. Without JavaScript, the disclosure still opens, closes, and follows links natively.

Focus uses a 3px outline with a 4px offset. Navigation and action targets have a minimum 44px height. Layouts wrap and stack instead of clipping overflow. No animation or smooth scrolling is introduced. Keep status text, heading hierarchy, landmarks, readable widths, and visible focus when extending the shell.

## Verification

Run `npm test`, `npm run lint`, and `npm run build` (use `npm.cmd` in PowerShell if script execution policy blocks the launcher). Navigation tests verify the approved top-level order, actual rendered fragment targets, footer reuse, planned non-links, landmark and heading structure, ARIA references, and the native disclosure fallback. Vitest resolves the same source alias as TypeScript for component markup tests.

Browser verification should cover 320, 375, 768, 1024, and 1440px widths; closed/open mobile navigation; Tab/Shift+Tab, Enter/Space, Escape, destination focus, resize behavior, skip link, and JavaScript-disabled navigation. Check text/background contrast, control/focus contrast, no horizontal overflow, and 200% text sizing. Tests must assert behavior and stable contracts rather than utility-class snapshots.

M2 verification used the local production build in headless Chrome. All listed widths, keyboard/disclosure checks, JavaScript-disabled navigation, and return navigation from the not-found page passed. No horizontal overflow occurred, including 200% text sizing at 320, 768, and 1440px. The minimum measured visible text contrast was 5.58:1; focus contrast against the three surfaces was at least 5.66:1. Desktop and mobile screenshots were visually reviewed. This is browser and accessibility-tree verification, not a manual screen-reader audit.

## M2.1 visual refinement

The homepage uses an approximately 60/40 editorial and analytical hero on desktop, a static fictional underwriting table, three differentiated pathways, an ordered learning progression, a metric definition list, and a closing purpose statement. Homepage-specific server components live in `src/components/home/`. These previews introduce no calculators, publishing system, or content relationships infrastructure. Actions continue to use centralized navigation and the existing planned overviews.

The temporary wordmark pairs the system editorial serif with a compact uppercase descriptor. M2.1B replaces the original green palette; focus behavior, mobile disclosure behavior, and external-asset restrictions remain intact. Analytical figures use tabular numerals. Section surfaces alternate with open editorial space; the example table is the only elevated analytical panel.


## M2.1B institutional CRE identity

The approved homepage composition and semantic structure remain unchanged. Warm stone editorial surfaces alternate with soft-white reading surfaces, an ink underwriting snapshot, and a slate-navy knowledge sequence. Copper is a precision highlight rather than the primary action color. Green remains reserved for positive status.

| Semantic role | Token / value | Usage |
| --- | --- | --- |
| Page | background / #F4F1EA | Warm editorial canvas |
| Secondary light surface | surface / #E8E3D9 | Tools pathway, footer, availability labels |
| Reading surface | elevated / #FCFBF8 | Header, process strip, underwriting pathway |
| Ink foundation | foreground, accent-strong, analytical / #0D1B2A | Text, snapshot, closing section |
| Slate navy | accent, analytical-raised / #24364B | Actions, knowledge sequence, table header |
| Muted text | muted / #526071 | Light-surface supporting copy |
| Copper | copper / #B66A32 | Decorative rules and hero underline only |
| Copper text | copper-text / #8A4C21 | Small numbering on light surfaces |
| Steel blue | steel / #456B88 | Metric labels and analytical relationships on light surfaces |
| Inverse text | on-analytical / #FCFBF8 | Dark-surface headings and primary values |
| Inverse metadata | analytical-muted / #BAC8D6 | Dark-surface secondary text |
| Inverse copper | analytical-highlight / #DFA575 | Dark-surface metadata |
| Inverse steel | analytical-steel / #9ABBD3 | Dark-surface ratios and sequence markers |
| Analytical divider | analytical-rule / #4D6175 | Non-interactive report separators |

`Surface` accepts an analytical tone and `Eyebrow` an analytical text tone, keeping dark-surface treatment within the existing primitives. Default reading behavior is unchanged. Do not combine light-surface muted text with dark backgrounds. Copper rules and report separators are decorative and do not convey state alone. Interactive controls retain strong boundaries and visible focus on light surfaces.

The workflow is an ordered, numbered process strip that stacks on narrow screens. Pathways use sharp rules and editorial columns instead of rounded card outlines. The snapshot has no shadow or calculation behavior. User-facing development labels have been replaced with concise Coming soon availability text; centralized destinations and the internal planned-navigation contract remain intact.

M2.1B verification: all 11 tests, lint, and production build passed. Production Chrome screenshots were inspected at 320, 390, 768, 1024, and 1440px (375px additionally checked). No horizontal overflow occurred at normal or 200% root text sizing. Minimum measured visible text contrast was 5.02:1. Keyboard disclosure, Tab/Shift+Tab, Escape, destination and resize focus, skip navigation, and no-JavaScript navigation passed. No decorative motion is present. This is browser verification, not a manual screen-reader audit.
