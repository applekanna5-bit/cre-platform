import { LearningTopics } from "@/components/content/learning-topics";
import { lifecycle } from "@/config/learning";
import { pageMetadata } from "@/seo/metadata";

export const metadata = pageMetadata("loan-lifecycle");

export default function LoanLifecyclePage() {
  return <LearningTopics title="CRE Loan Lifecycle" description="Follow a commercial real estate loan from the fundamentals through servicing and resolution. Read in the suggested order or start with the stage you need." topics={lifecycle} />;
}
