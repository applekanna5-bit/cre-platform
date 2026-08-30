# Content Architecture

## Approved high-level domains

The platform currently recognizes these high-level content domains:

- Learn / CRE Fundamentals
- Underwriting
- Property Types
- Financing
- Agency Lending
- Financial Modeling
- Calculators
- Glossary
- Resources
- Insights
- Contributors

These domains provide planning boundaries, not a final navigation system or publishing taxonomy. The detailed taxonomy remains intentionally unfrozen and will be defined in a later milestone after editorial and product requirements are clearer.

## Content relationships

Future content should be able to connect topics, property types, loan products, glossary terms, calculators, and related articles. The M1B contracts reserve lightweight identifiers for those relationships without prescribing a taxonomy, storage system, URL hierarchy, or knowledge-graph implementation.

Relationship behavior, validation, and presentation are deferred. No knowledge graph, content renderer, or production content is introduced in this milestone.

## Contract boundary

The TypeScript contracts in `src/content/contracts.ts` define portable metadata, source, contributor-reference, and editorial-status shapes. They are independent of a CMS, database, MDX implementation, and UI so later infrastructure choices do not require content concepts to be redesigned.
