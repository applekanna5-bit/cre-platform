import { describe, expect, it } from "vitest";
import type { ContentMetadata, ContentSource } from "@/content/contracts";

const source = {
  id: "public-source-example",
  title: "Public Source Example",
  publisher: "Public Organization",
  url: "https://example.org/public-source",
  type: "official-primary",
  authority: "authoritative",
  publicationDate: "2026-01-15",
  accessedDate: "2026-08-30",
} as const satisfies ContentSource;

const metadata = {
  title: "Representative CRE Concept",
  slug: "representative-cre-concept",
  description: "A typed fixture used only to verify the content contract.",
  contentType: "concept",
  difficulty: "foundational",
  status: "technical-review",
  author: { name: "Editorial Team" },
  reviewer: { name: "CRE Reviewer" },
  lastReviewedDate: "2026-08-30",
  propertyTypes: ["example-property-type"],
  loanProducts: [],
  topics: ["example-topic"],
  relatedGlossaryTerms: ["example-term"],
  relatedCalculators: [],
  relatedContent: ["related-example"],
  sources: [source],
} as const satisfies ContentMetadata;

describe("content contracts", () => {
  it("supports representative metadata with multiple relationship types", () => {
    expect(metadata.status).toBe("technical-review");
    expect(metadata.sources).toHaveLength(1);
    expect(metadata.sources[0].authority).toBe("authoritative");
  });
});
