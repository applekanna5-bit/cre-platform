import type { Metadata } from "next";
import Link from "next/link";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";
import { ArticleList } from "@/components/content/article-list";
import { Container, Eyebrow, Section } from "@/components/ui/primitives";

export const metadata: Metadata = {
  title: "Research Library | CRE Knowledge Platform",
  description: "Published CRE research and practical guides to property financials, revenue analysis, and underwriting.",
};

export default function LibraryPage() {
  const articles = publicArticles(catalog);
  return <Container>
    <Section aria-labelledby="library-title" className="border-b-2 border-copper">
      <Link href="/" className="mb-6 inline-flex min-h-11 items-center text-sm text-muted underline underline-offset-4">Home</Link>
      <div className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-16">
        <div><Eyebrow>CRE / Research & analysis</Eyebrow><h1 id="library-title" className="mt-4 font-editorial text-display">Research library</h1></div>
        <p className="max-w-[48ch] text-lg text-muted lg:self-end">Explore practical guides to property financials and underwriting. Build the context behind the numbers and the judgment behind the decision.</p>
      </div>
    </Section>
    <Section aria-labelledby="research-heading">
      <div className="mb-7 flex flex-wrap items-baseline justify-between gap-3"><h2 id="research-heading" className="font-editorial text-3xl">Published research</h2><p className="text-sm text-muted">{articles.length} {articles.length === 1 ? "article" : "articles"}</p></div>
      <ArticleList articles={articles} />
    </Section>
  </Container>;
}
