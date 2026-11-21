import Link from "next/link";
import { LearningTopics } from "@/components/content/learning-topics";
import { lifecycle } from "@/config/learning";
import { pageMetadata } from "@/seo/metadata";

export const metadata = pageMetadata("loan-lifecycle");

export default function LoanLifecyclePage() {
  return <LearningTopics title="CRE Loan Lifecycle" description="Follow the decisions in a commercial real estate loan, from the first request through servicing and resolution. A refinance, bridge loan, or transfer can bring different questions into the process." topics={lifecycle}>
    <div className="mt-4 flex flex-wrap gap-x-6">
      <a className="inline-flex min-h-11 items-center font-semibold underline underline-offset-4" href="#financial-analysis">Read financial analysis</a>
      <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/specializations#financing-markets">Loan purposes and secondary markets</Link>
      <Link className="inline-flex min-h-11 items-center underline underline-offset-4" href="/specializations#servicing">Explore servicing</Link>
    </div>
  </LearningTopics>;
}
