import Link from "next/link";
import { TrustPage, type TrustSection } from "@/components/trust/trust-page";
import { pageMetadata } from "@/seo/metadata";

export const metadata = pageMetadata("about");

const sections: readonly TrustSection[] = [
  {
    id: "purpose",
    title: "Understanding the reasoning behind the numbers",
    paragraphs: [
      "The website exists to make underwriting reasoning easier to understand. Reading a rent roll or calculating a financial ratio is only part of the work. Analysts also need to understand what the information supports, where it is incomplete and how different assumptions can change a conclusion.",
      "The focus is practical education: connecting property financials, calculations and analytical judgment with the questions that arise when reviewing commercial real estate performance.",
    ],
  },
  {
    id: "readers",
    title: "Who it is for",
    paragraphs: [
      "The CRE Ledger is intended for analysts, lenders, investors, asset managers and others developing or refreshing their understanding of CRE underwriting. Readers new to the subject can build a foundation, while experienced analysts can revisit the reasoning and assumptions behind familiar measures.",
    ],
  },
  {
    id: "practical-examples",
    title: "Learning through practical examples",
    paragraphs: [
      "Worked examples help make financial relationships visible. They allow readers to follow the movement from reported income to supportable revenue, operating income and debt coverage, and to understand how assumptions influence the result.",
      "Illustrative figures are teaching tools, rather than evidence of current market conditions or a recommendation concerning a particular property. An actual transaction requires its own evidence, current applicable guidance and judgment about the reliability of the inputs.",
    ],
  },
  {
    id: "independence",
    title: "An independent educational publication",
    paragraphs: [
      "The CRE Ledger is an independent educational publication. It does not speak for an author’s employer, a lender, an investor, Fannie Mae or Freddie Mac. References to external organizations identify relevant sources; they do not imply affiliation, sponsorship, endorsement or review.",
      "Content is provided for general education. Readers should verify information against current source material and obtain advice appropriate to their circumstances before making transaction or investment decisions.",
    ],
  },
];

export default function AboutPage() {
  return <TrustPage title="About The CRE Ledger"
    introduction="The CRE Ledger is an independent educational website focused on commercial real estate underwriting and property financial analysis. It explains how property information becomes an underwriting conclusion, with attention to the assumptions, calculations and judgment behind the numbers."
    sections={sections}>
    <Link href="/editorial-standards" className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">Read our Editorial Standards</Link>
  </TrustPage>;
}
