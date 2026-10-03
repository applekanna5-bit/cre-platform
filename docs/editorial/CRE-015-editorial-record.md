# CRE-015 Editorial Record

## Identity

- Canonical ID: CRE-015
- Title: Net Operating Income: From Property Financials to Underwritten NOI
- Domain: underwriting
- Content type: guide
- Difficulty: intermediate
- Editorial status at handoff: approved
- Last reviewed: 2026-10-03
- Development fixture: false

## Editorial purpose

CRE-015 is the first flagship production article for the CRE Knowledge Platform. Its purpose is not merely to define NOI. It teaches how an analyst moves from reported property financials to a supportable underwritten NOI through reconciliation, evidence, normalization, convention awareness, and documented judgment.

Primary reader question:

> The property's T-12 reports $2.215 million of NOI. Why might an underwriter conclude that supportable NOI is $2.140 million?

## Claim taxonomy used during review

The article distinguishes among:

- FACT — externally verifiable institutional/general CRE statements.
- CALCULATION — deterministic arithmetic using supplied illustrative values.
- CONVENTION — methodology-dependent treatment that must not be presented as universal.
- INSTITUTIONAL REQUIREMENT — statements specifically attributed to an identified institution/program.
- ANALYST JUDGMENT — practitioner interpretation, clearly separated from institutional requirements.
- CRE PLATFORM FRAMEWORK — original educational framework created for this platform.

## Original CRE Platform framework

### Three-Question Adjustment Test

1. What caused the historical number?
2. What evidence supports a different number?
3. Does the adjustment improve representativeness—or merely improve the deal?

Short form: Cause → Evidence → Representativeness.

This is an original CRE Knowledge Platform educational framework. It must never be attributed to Fannie Mae, Freddie Mac, OCC, or another institution.

## Harbor View Apartments

Harbor View Apartments is fictional. It is not based on an employer/client file or a real transaction.

Canonical educational facts:

- 180 multifamily units
- T-12 EGI: $3,180,000
- T-12 operating expenses: $965,000
- T-12 NOI: $2,215,000
- Net revenue underwriting adjustment: +$10,000
- Net expense effect on NOI: -$85,000
- Underwritten EGI: $3,190,000
- Underwritten operating expenses: $1,050,000
- Underwritten NOI: $2,140,000
- Illustrative cap rate: 6.50%
- T-12 NOI value indication at 6.50%: approximately $34.08M
- Underwritten NOI value indication at 6.50%: approximately $32.92M
- Approximate value difference: $1.15M
- Illustrative loan amount: $21.20M
- Illustrative debt yield: approximately 10.1%

The individual revenue/expense adjustments are educational assumptions, not lender-prescribed adjustments.

## Primary sources reviewed

### OCC — Commercial Real Estate Lending, Comptroller's Handbook, Version 2.0

Public source:
https://www.occ.treas.gov/publications-and-resources/publications/comptrollers-handbook/files/commercial-real-estate-lending/index-commercial-real-estate-lending.html

Reviewed: 2026-10-03.

Use in CRE-015:
- general CRE underwriting context;
- stabilized NOI and cash-flow analysis;
- direct-capitalization context;
- debt-yield context;
- OCC convention that replacement reserves are deducted in determining NOI.

Boundary: OCC guidance applies in the context described by the OCC and must not be represented as a universal lender methodology.

### Fannie Mae Multifamily Guide — Section 203, Income Analysis

Public source:
https://mfguide.fanniemae.com/node/7526

Reviewed: 2026-10-03.

Use in CRE-015:
- concessions and bad debt treatment as an institutional example;
- other-income stability/recurrence/historical-support concepts;
- line-by-line stabilized operating-expense analysis;
- distinction between normal ongoing operations and short-term factors.

Boundary: Fannie requirements are program-specific institutional requirements, not universal CRE rules.

### Fannie Mae Multifamily Guide — 203.01, Underwritten Net Cash Flow

Public source:
https://mfguide.fanniemae.com/node/7531

Reviewed: 2026-10-03.

Use in CRE-015:
- objective measures;
- historical performance and anticipated operations;
- operating-statement/vacancy review;
- reconciliation/documentation of adjustments;
- Underwritten NOI versus Underwritten NCF convention.

Boundary: Reverify current Guide language before future substantive updates because this is program-sensitive guidance.

## Source-maintenance decision

A stale 2024 Freddie Mac redline used during early research was deliberately excluded from the production source registry. Freddie Mac's public Guide page showed the Full Guide and Glossary dated 2026-08-25 at the final review date. CRE-015 does not need a Freddie citation merely for source count; primary sources should be included only where they materially support the article.

## Convention warning

Do not teach one universal NOI construction. The article intentionally contrasts the OCC convention with Fannie Mae's Underwritten NOI/Underwritten NCF presentation. The reader should be told to identify the applicable cash-flow convention before comparing NOI, NCF, DSCR, or loan-sizing outputs.

## Scope boundaries

CRE-015 introduces but does not fully teach:

- T-12 analysis (CRE-006)
- rent-roll analysis (CRE-007)
- revenue analysis (CRE-011)
- operating-expense analysis (CRE-012)
- historical vs underwritten vs stabilized NOI (CRE-016)
- normalization of property financials (CRE-017)
- capitalization rate / NOI valuation (CRE-018/019)
- DSCR (CRE-025)
- debt yield (CRE-026)
- loan sizing (CRE-032)

Those planned assets are not registered as M3 relationships until their article identities exist in the content catalog. This avoids unresolved relationship failures and manufactured placeholder routes.

## Publication review result

Editorial review completed before repository handoff.

Internal publication score: 96/100.

The score is an editorial quality-control record, not a claim of external certification.

## Engineering handoff rule

Approved copy is protected. Engineering/Codex may:

- validate metadata and MDX syntax;
- merge source and case records;
- wire the article through the existing M3 engine;
- make minimal schema/syntax fixes required for compilation;
- report any conflict back for editorial review.

Engineering/Codex must not substantively rewrite, summarize, expand, SEO-stuff, or otherwise alter approved prose without a separate editorial task.
