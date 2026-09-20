import type { ReactNode } from "react";
import Link from "next/link";
import type { ArticleHeading, ArticleMetadata, ContentCatalog } from "@/content/contracts";
import { resolveRelationships } from "@/content/catalog";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { RelationshipNavigation, Sources } from "./primitives";
import { ArticleContext } from "./article-context";
import styles from "./article.module.css";

const domainNames = { learn: "Learn / CRE Fundamentals", underwriting: "Underwriting", "property-types": "Property Types", financing: "Financing", agency: "Agency Lending", modeling: "Financial Modeling", resources: "Resources", insights: "Insights" };
const difficultyNames = { foundational: "Foundation", intermediate: "Practitioner", advanced: "Institutional" };
export function ArticleTemplate({ article, catalog, headings = [], embeddedCases = [], fixtures = false, children }: { article: ArticleMetadata; catalog: ContentCatalog; headings?: readonly ArticleHeading[]; embeddedCases?: readonly string[]; fixtures?: boolean; children?: ReactNode }) {
  const relationships = resolveRelationships(article, catalog, fixtures).map(relation => relation.target.kind === "case-study" && embeddedCases.includes(relation.target.id) ? { ...relation, href: `#case-${relation.target.id}` } : relation);
  return <Container className={styles.page}>
      <nav aria-label="Article context" className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted"><Link href="/" className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">Home</Link><span aria-hidden="true">/</span><span>{domainNames[article.domain]}</span></nav>
    <div className={styles.layout}>
      <article aria-labelledby="article-title" className={styles.article}>
        {article.developmentFixture && <p className={styles.fixture}>Development fixture — not publication content</p>}
        <header className={styles.articleHeader}>
          <Eyebrow>{article.contentType} / {difficultyNames[article.difficulty]}</Eyebrow>
          <h1 id="article-title" className={styles.title}>{article.title}</h1>
          <p className={styles.deck}>{article.description}</p>
          <p className="mt-5 text-sm">By {article.author.name}{article.reviewer && <span className="text-muted"> · Reviewed by {article.reviewer.name}</span>}</p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            <div><dt className="inline">Editorial status: </dt><dd className="inline">{article.developmentFixture ? "Draft fixture" : article.status.replaceAll("-", " ")}</dd></div>
            <div><dt className="inline">Update sensitivity: </dt><dd className="inline">{article.updateSensitivity}</dd></div>
            {([["Published", article.publishedDate], ["Updated", article.updatedDate], ["Reviewed", article.lastReviewedDate]] as const).filter(([, date]) => date).map(([label, date]) => <div key={label}><dt className="inline">{label}: </dt><dd className="inline"><time dateTime={date}>{date}</time></dd></div>)}
          </dl>
          {article.status === "needs-review" && <p className="mt-3 text-sm font-semibold text-warning">This article is awaiting a source and content review.</p>}
        </header>
        <div className={styles.body}>{children}</div>
        <Sources sources={article.sources} />
        <RelationshipNavigation relationships={relationships} />
      </article>
      <ArticleContext headings={headings} relationships={relationships} hasSources={article.sources.length > 0} />
    </div>
  </Container>;
}
