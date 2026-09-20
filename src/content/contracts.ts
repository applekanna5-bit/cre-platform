/** A calendar date in ISO 8601 date form (YYYY-MM-DD). */
export type IsoDate = `${number}-${number}-${number}`;

export type ContentType =
  | "concept"
  | "guide"
  | "reference"
  | "analysis"
  | "resource";

export type ContentDifficulty = "foundational" | "intermediate" | "advanced";

export type EditorialStatus =
  | "research"
  | "brief"
  | "draft"
  | "editorial-review"
  | "technical-review"
  | "source-verification"
  | "ready"
  | "approved"
  | "published"
  | "needs-review"
  | "archived";

export type SourceType =
  | "official-primary"
  | "regulatory"
  | "government"
  | "industry-organization"
  | "academic"
  | "secondary-industry"
  | "editorial-research";

export type SourceAuthority = "authoritative" | "supporting" | "contextual";

export interface ContributorReference {
  name: string;
  slug?: string;
}

export interface ContentSource {
  id: string;
  title: string;
  publisher: string;
  url?: string;
  type: SourceType;
  authority: SourceAuthority;
  publicationDate?: IsoDate;
  updatedDate?: IsoDate;
  accessedDate?: IsoDate;
  reviewedDate?: IsoDate;
  notes?: string;
  effectiveDate?: IsoDate;
  updateSensitivity?: UpdateSensitivity;
  /** Synthetic sources cannot support publication content. */
  synthetic?: boolean;
}

export type UpdateSensitivity = "U1" | "U2" | "U3" | "U4";
export type SourceClass = "A" | "B" | "C";
/** Coarse delivery domains, not a replacement for the editorial taxonomy. */
export type ArticleDomain = "learn" | "underwriting" | "property-types" | "financing" | "agency" | "modeling" | "resources" | "insights";
export type RelationshipPurpose = "prerequisite" | "deep-dive" | "application" | "tool";
export type KnowledgeKind = "article" | "glossary" | "calculator" | "case-study";
export interface ContentRelationship {
  purpose: RelationshipPurpose;
  target: { kind: KnowledgeKind; id: string };
}

export interface ContentMetadata {
  title: string;
  slug: string;
  description: string;
  contentType: ContentType;
  difficulty: ContentDifficulty;
  status: EditorialStatus;
  author: ContributorReference;
  reviewer?: ContributorReference;
  publishedDate?: IsoDate;
  lastReviewedDate?: IsoDate;
  propertyTypes: readonly string[];
  loanProducts: readonly string[];
  topics: readonly string[];
  relatedGlossaryTerms: readonly string[];
  relatedCalculators: readonly string[];
  relatedContent: readonly string[];
  sources: readonly ContentSource[];
}

/** M3 delivery extension; the portable M1B contract remains usable unchanged. */
export interface ArticleMetadata extends ContentMetadata {
  id: string;
  domain: ArticleDomain;
  updateSensitivity: UpdateSensitivity;
  sourceClasses: readonly SourceClass[];
  updatedDate?: IsoDate;
  relationships: readonly ContentRelationship[];
  developmentFixture: boolean;
}

/** Build-derived heading outline; never authored separately from the article body. */
export interface ArticleHeading {
  id: string;
  label: string;
  depth: number;
}

/** On-disk adapter: source IDs resolve to M1B ContentSource records before render. */
export type ArticleInput = Omit<ArticleMetadata, "sources"> & { sourceIds: readonly string[] };

export interface FinancialTableData {
  id: string;
  caption: string;
  columns: readonly { key: string; label: string; numeric?: boolean }[];
  rows: readonly { label: string; values: readonly string[]; total?: boolean }[];
}

export interface KnowledgeRecord {
  id: string;
  kind: Exclude<KnowledgeKind, "article">;
  label: string;
  synthetic: boolean;
  /** No guessed routes: glossary/calculator records remain non-links in M3. */
  description?: string;
}

export interface EducationalCase extends KnowledgeRecord {
  kind: "case-study";
  fictional: true;
  facts: readonly { label: string; value: string }[];
  tables: readonly FinancialTableData[];
}

export interface ContentCatalog {
  articles: readonly ArticleMetadata[];
  sources: readonly ContentSource[];
  knowledge: readonly KnowledgeRecord[];
  cases: readonly EducationalCase[];
}
