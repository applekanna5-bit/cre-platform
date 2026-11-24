import type { ReactNode } from "react";
import Link from "next/link";
import type { ArticleHeading, ArticleMetadata, ContentCatalog } from "@/content/contracts";
import { isCommunityReview, isEditorialPreview, isPubliclyReadable, resolveRelationships } from "@/content/catalog";
import { Container, Eyebrow } from "@/components/ui/primitives";
import { RelationshipNavigation, Sources } from "./primitives";
import { ArticleContext } from "./article-context";
import { lifecycle } from "@/config/learning";
import styles from "./article.module.css";

const domainNames = { learn: "Learn / CRE Fundamentals", underwriting: "Underwriting", "property-types": "Property Types", financing: "Financing", agency: "Agency Lending", modeling: "Financial Modeling", resources: "Resources", insights: "Insights" };
const difficultyNames = { foundational: "Foundation", intermediate: "Practitioner", advanced: "Institutional" };
export function ArticleTemplate({ article, catalog, headings = [], embeddedCases = [], fixtures = false, editorialPreview = false, breadcrumbs, children }: { article: ArticleMetadata; catalog: ContentCatalog; headings?: readonly ArticleHeading[]; embeddedCases?: readonly string[]; fixtures?: boolean; editorialPreview?: boolean; breadcrumbs?: readonly { name: string; path: string }[]; children?: ReactNode }) {
  const publicArticle = isPubliclyReadable(article);
  const communityReview = isCommunityReview(article);
  const stage = publicArticle ? lifecycle.find(topic => topic.articles.some(id => id === article.id)) : undefined;
  const relationships = resolveRelationships(article, catalog, !publicArticle && fixtures, !publicArticle && editorialPreview)
    .map(relation => relation.target.kind === "case-study" && embeddedCases.includes(relation.target.id) ? { ...relation, href: `#case-${relation.target.id}` } : relation)
    .filter(relation => !publicArticle || relation.href);
  const outline = [
    ...headings,
    ...(article.sources.length ? [{ id: "article-sources", label: "Sources and provenance", depth: 2 }] : []),
    ...(relationships.length ? [{ id: "article-relationships", label: "Related reading", depth: 2 }] : []),
  ];
  return <Container className={styles.page}>
      {breadcrumbs ? <nav aria-label="Breadcrumb" className={styles.breadcrumb}>
        <ol className="flex flex-wrap items-baseline gap-x-3">
        {breadcrumbs.map((item, index) => <li key={item.path} className="flex min-w-0 items-baseline gap-3">
          {index > 0 && <span aria-hidden="true">/</span>}
          {index === breadcrumbs.length - 1 ? <span aria-current="page">{item.name}</span> :
            <Link href={item.path} className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">{item.name}</Link>}
        </li>)}
        </ol>
      </nav> : <nav aria-label="Article context" className="mb-6 flex flex-wrap items-center gap-3 text-sm text-muted"><Link href="/" className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">Home</Link><span aria-hidden="true">/</span><span>{domainNames[article.domain]}</span></nav>}
    <div className={styles.layout}>
      <ArticleContext headings={outline} />
      <article aria-labelledby="article-title" className={styles.article}>
        {article.developmentFixture && <p className={styles.fixture}>Development fixture — not publication content</p>}
        {isEditorialPreview(article, editorialPreview) && <p className={styles.fixture}>Approved — editorial preview</p>}
        <header className={styles.articleHeader}>
          <Eyebrow>{article.contentType} / {difficultyNames[article.difficulty]}</Eyebrow>
          <h1 id="article-title" tabIndex={-1} className={styles.title}>{article.title}</h1>
          <p className={styles.deck}>{article.description}</p>
          <p className="mt-5 text-sm">By {article.author.name}{article.reviewer && <span className="text-muted"> · Reviewed by {article.reviewer.name}</span>}</p>
          <dl className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">
            <div><dt className="inline">Editorial status: </dt><dd className="inline">{article.developmentFixture ? "Draft fixture" : communityReview ? "Community Review" : article.status.replaceAll("-", " ")}</dd></div>
            <div><dt className="inline">Update sensitivity: </dt><dd className="inline">{article.updateSensitivity}</dd></div>
            {([["Published", article.publishedDate], ["Updated", article.updatedDate], ["Reviewed", article.lastReviewedDate]] as const).filter(([, date]) => date).map(([label, date]) => <div key={label}><dt className="inline">{label}: </dt><dd className="inline"><time dateTime={date}>{date}</time></dd></div>)}
          </dl>
          {stage && <p className="mt-3 text-sm"><span className="text-muted">Loan lifecycle</span> · <Link href={`/loan-lifecycle#${stage.id}`} className="inline-block py-2 text-accent underline underline-offset-4">{stage.title}</Link></p>}
          {communityReview && <aside aria-label="Community Review Edition" className="mt-4 border-l-2 border-copper pl-4 text-sm text-muted">
            <p className="font-semibold text-foreground">Community Review Edition</p>
            <p className="mt-1">Independent practitioner approval is pending. Professional feedback on this draft is welcome.</p>
            <a className="inline-flex min-h-11 items-center text-accent underline underline-offset-4"
              href={`mailto:feedback@thecreledger.com?subject=${encodeURIComponent("Community Review: " + article.title)}`}>
              Email feedback on this guide
            </a>
          </aside>}
          {article.status === "needs-review" && <p className="mt-3 text-sm font-semibold text-warning">This article is awaiting a source and content review.</p>}
        </header>
        <ArticleContext headings={outline} inline />
        <div className={styles.body}>{children}</div>
        <Sources sources={article.sources} />
        <RelationshipNavigation relationships={relationships} />
        <p className={styles.articleReturn}>
          {stage && <Link href={`/loan-lifecycle#${stage.id}`}>Browse this lifecycle stage</Link>}
          <a href="#article-title">Back to article title</a>
        </p>
      </article>
    </div>
  </Container>;
}
