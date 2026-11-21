import { Container } from "@/components/ui/primitives";
import { pageMetadata } from "@/seo/metadata";

export const metadata = pageMetadata("feedback");

export default function FeedbackPage() {
  return <Container width="reading" className="py-12 sm:py-16">
    <h1 className="font-editorial text-4xl sm:text-5xl">Professional Feedback</h1>
    <p className="mt-4 text-lg text-muted">This is where you will be able to suggest a correction, flag a confusing example, or propose a topic from your CRE practice. Feedback submissions are currently unavailable.</p>
    <p className="mt-6"><strong>Keep feedback general.</strong> Never share confidential borrower, client, employer, or transaction information.</p>
    <p className="mt-4">When submissions open, the site owner will review feedback and use it to investigate corrections or improve the site. Contact information will be optional and used for follow-up. If a correction is published, it will describe the change without identifying the person who reported it.</p>
  </Container>;
}
