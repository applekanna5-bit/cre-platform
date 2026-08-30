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
  | "draft"
  | "editorial-review"
  | "technical-review"
  | "source-verification"
  | "ready"
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
