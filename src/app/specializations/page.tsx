import { LearningTopics } from "@/components/content/learning-topics";
import { specializations } from "@/config/learning";
import { pageMetadata } from "@/seo/metadata";

export const metadata = pageMetadata("specializations");

export default function SpecializationsPage() {
  return <LearningTopics title="Professional Specializations" description="Find published reading by area of practice." topics={specializations} />;
}
