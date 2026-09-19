# M2 design and navigation architecture

M2 adds the shared visual foundation and global shell. It does not implement publishing, content ingestion, calculators, search, or a new taxonomy. M1 content contracts, editorial standards, source policy, and approved documents remain unchanged.

## Tokens and primitives

`src/app/globals.css` defines semantic Tailwind v4 theme tokens for background, surface, elevated surface, foreground, muted text, borders, accent, success, warning, error, and focus. Status colors are foreground colors for light surfaces, not independent status indicators. Always pair status color with text. Use the stronger border token for control boundaries; the softer token separates non-interactive content.

System Arial/Helvetica provides interface typography; system Georgia provides the display heading. No fonts, images, or other assets are fetched from external services. The scale runs from 12px labels through a fluid 40–72px display size. Spacing follows Tailwind's 4px base; controls and badges use 4px radii and panels use 6px radii.

`src/components/ui/primitives.tsx` supplies `Container` (wide, content, reading), `Section`, `Eyebrow`, `Surface`, `Badge`, and `ActionLink`. Native element props preserve semantic labeling. Choose heading levels in the consuming page; appearance must not dictate document hierarchy. Reading width is limited to 68 characters. Action links require an actual destination. Add interactive buttons or callouts only when a feature needs them.

## Global shell and configuration

The root layout owns the skip link, header, main landmark, and footer. Pages provide content inside the shared main landmark. Components are server components except `MobileNavigation`, which receives the server-rendered navigation list as children.

`src/config/navigation.ts` is the source of primary labels, destinations, homepage paths, and footer groups. Its link/planned union prevents planned destinations from carrying an href. Optional child navigation is an extension point for a later dropdown design; the M2 renderer intentionally displays only the top level. Do not add children until their presentation and keyboard behavior are implemented.

Only `/` exists as a product page. The seven primary links target actual, focusable homepage section headings using `/#id`; these are explicitly labeled planned overviews, not functioning hubs. The footer reuses these targets and represents Glossary, Contributors, and About/editorial as planned plain text. Replace destinations centrally as real routes become available. Native anchors preserve fragment navigation without JavaScript. No search affordance is displayed.

## Mobile and accessibility

Below 64rem the primary navigation uses native `details`/`summary`. This is an inline, non-modal disclosure, with native expanded/collapsed semantics and Enter/Space operation. It needs no focus trap or application-menu roles. Client enhancement closes it on Escape (returning focus to the summary), ordinary link activation, focus leaving the disclosure, or crossing to desktop. Same-page activation focuses the destination heading; desktop resizing moves focus to the brand if it would otherwise become hidden. Modified link clicks retain normal browser behavior. Without JavaScript, the disclosure still opens, closes, and follows links natively.

Focus uses a 3px outline with a 4px offset. Navigation and action targets have a minimum 44px height. Layouts wrap and stack instead of clipping overflow. No animation or smooth scrolling is introduced. Keep status text, heading hierarchy, landmarks, readable widths, and visible focus when extending the shell.

## Verification

Run `npm test`, `npm run lint`, and `npm run build` (use `npm.cmd` in PowerShell if script execution policy blocks the launcher). Navigation tests verify the approved top-level order, actual rendered fragment targets, footer reuse, planned non-links, landmark and heading structure, ARIA references, and the native disclosure fallback. Vitest resolves the same source alias as TypeScript for component markup tests.

Browser verification should cover 320, 375, 768, 1024, and 1440px widths; closed/open mobile navigation; Tab/Shift+Tab, Enter/Space, Escape, destination focus, resize behavior, skip link, and JavaScript-disabled navigation. Check text/background contrast, control/focus contrast, no horizontal overflow, and 200% text sizing. Tests must assert behavior and stable contracts rather than utility-class snapshots.

M2 verification used the local production build in headless Chrome. All listed widths, keyboard/disclosure checks, JavaScript-disabled navigation, and return navigation from the not-found page passed. No horizontal overflow occurred, including 200% text sizing at 320, 768, and 1440px. The minimum measured visible text contrast was 5.58:1; focus contrast against the three surfaces was at least 5.66:1. Desktop and mobile screenshots were visually reviewed. This is browser and accessibility-tree verification, not a manual screen-reader audit.
