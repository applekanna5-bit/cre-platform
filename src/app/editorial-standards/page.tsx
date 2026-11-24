import Link from "next/link";
import { TrustPage, type TrustSection } from "@/components/trust/trust-page";
import { pageMetadata } from "@/seo/metadata";

export const metadata = pageMetadata("editorial-standards");

const sections: readonly TrustSection[] = [
  {
    id: "research-and-sources",
    title: "Research and source verification",
    paragraphs: [
      "Factual claims should be supported by sources suited to the subject. Official public guidance takes priority for regulatory and program-specific requirements. Secondary sources may provide context, but should not replace an available primary authority.",
      "References should identify the source and retain the dates needed to understand its relevance. Sourced facts should be distinguished from editorial interpretation, and uncertainty or differences in practice should be explained. A source record alone does not establish that a claim is current or correctly interpreted.",
    ],
  },
  {
    id: "calculation-methodology",
    title: "Financial calculation methodology",
    paragraphs: [
      "Financial explanations should define the inputs, units, time periods and calculation conventions used. Worked examples should show enough detail for readers to follow the result, including material exclusions and rounding. Where underwriting practices vary, the explanation should identify the convention being illustrated.",
      "Technical verification should include recomputing worked examples and checking that formulas, assumptions and written conclusions agree. A mathematically correct result still depends on the quality and relevance of its inputs.",
    ],
  },
  {
    id: "illustrative-examples",
    title: "Illustrative assumptions and examples",
    paragraphs: [
      "Illustrative examples should be clearly identified and distinguish assumed figures from sourced facts. Examples should explain what they demonstrate and the limits of the conclusion, without presenting fictional figures as actual transactions or current market evidence.",
      "Confidential deal, borrower, client or employer information must not be used. Examples and educational materials must be developed independently from public information and authorized original work, without reproducing restricted material.",
    ],
  },
  {
    id: "agency-references",
    title: "Fannie Mae and Freddie Mac references",
    paragraphs: [
      "Where an explanation depends on Fannie Mae or Freddie Mac guidance, it should cite the applicable official public material and identify the relevant program, section and date context. A teaching example should not be presented as a universal agency requirement.",
      "Actual lending decisions require current applicable guidance and transaction-specific analysis. Readers should consult the relevant official sources and lender requirements rather than rely on an educational example as a statement of eligibility or a financing commitment. Source references do not imply agency affiliation, endorsement or review.",
    ],
  },
  {
    id: "editorial-responsibility",
    title: "Editorial responsibility and AI assistance",
    paragraphs: [
      "The website owner oversees editorial review, technical verification and corrections. Material is published under The CRE Ledger name. It does not imply a large editorial team, an institutional review board or independent technical review.",
      "AI may assist with research, calculations, drafting and verification. AI-generated analysis is not automatically verified or publication-ready. The publication standard requires human editorial review and technical or source verification appropriate to the claims.",
      "Reviewer attribution should describe work actually performed and should not imply independent review unless that occurred. These standards set editorial expectations; they are not a certification that every proposed verification procedure has already been implemented or completed for every article.",
    ],
  },
  {
    id: "publication-dates",
    title: "Publication, review and revision dates",
    paragraphs: [
      "“Published” identifies initial publication. “Updated” identifies a substantive revision. “Reviewed” identifies a completed review. These dates represent different events and should not be changed merely because a page was rebuilt or restyled.",
      "Time-sensitive claims should be reassessed when relevant guidance changes or a potential error comes to light. Review needs depend on the subject and the significance of the change; these standards do not promise a fixed review schedule.",
    ],
  },
  {
    id: "corrections",
    title: "Corrections and substantive updates",
    paragraphs: [
      "Potential errors should be assessed against the relevant evidence. Material corrections should explain what changed and why, with an appropriate revision date. Changes affecting calculations should receive technical verification before publication.",
      "A substantive update should preserve the context of the original explanation and distinguish a correction from a change in underlying guidance or assumptions. These standards describe editorial commitments.",
    ],
  },
  {
    id: "educational-limitations",
    title: "Educational limitations",
    paragraphs: [
      "Articles and examples provide general education, rather than individualized investment, lending, legal, tax or valuation advice. A calculated result is conditional on its inputs and does not establish that a transaction is suitable or financeable.",
      "Readers should verify current information and seek advice appropriate to their circumstances before making a transaction or investment decision.",
    ],
  },
  {
    id: "publication-boundary",
    title: "Published versus unpublished content",
    paragraphs: [
      "Drafts and unpublished editorial material are separate from the public library. Editorial approval alone does not make an article public. A previously published article awaiting review may remain available with a visible notice.",
      "Private editorial records remain outside the library. Selected Community Review Editions are available for professional feedback, with independent practitioner approval pending. They are clearly labeled and excluded from search-engine indexing.",
    ],
  },
];

export default function EditorialStandardsPage() {
  return <TrustPage title="Editorial Standards"
    introduction="These standards set the expectations for material published by The CRE Ledger. They describe the evidence, explanation and transparency that educational CRE analysis should provide."
    sections={sections}>
    <Link href="/about" className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">About The CRE Ledger</Link>
  </TrustPage>;
}
