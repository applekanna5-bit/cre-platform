import Link from "next/link";
import type { PublicArticle } from "@/content/publication";

const difficultyNames = { foundational: "Foundation", intermediate: "Practitioner", advanced: "Institutional" };

/** Discovery consumes only the publication allowlist, never the internal catalog. */
export function ArticleList({ articles }: { articles: readonly PublicArticle[] }) {
  if (!articles.length) return <p className="border-y border-border py-8 text-muted">Published research will appear here when available.</p>;

  return <ul className="grid gap-x-10 border-t border-border-strong md:grid-cols-2">
    {articles.map((article, index) => <li key={article.id} className="flex flex-col items-start border-b border-border py-7 sm:py-9">
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold uppercase tracking-wider text-muted">
        <span className="tabular-nums text-copper-text" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
        <span>{article.domain.replaceAll("-", " ")}</span><span aria-hidden="true">/</span><span>{article.contentType}</span>
      </p>
      <h3 className="mt-4 max-w-[38ch] font-editorial text-2xl leading-tight"><Link href={article.href} className="text-accent-strong underline decoration-border underline-offset-4 hover:decoration-copper">{article.title}</Link></h3>
      <p className="mt-4 max-w-[62ch] text-sm text-muted">{article.description}</p>
      <div className="mt-auto flex flex-wrap gap-x-4 gap-y-2 pt-5 text-xs text-muted">
        <span>{difficultyNames[article.difficulty]}</span>
        {article.publishedDate && <span>Published <time dateTime={article.publishedDate}>{article.publishedDate}</time></span>}
        {article.needsReview && <span className="font-semibold text-warning">Awaiting review</span>}
      </div>
    </li>)}
  </ul>;
}
