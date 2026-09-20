import type { ArticleHeading } from "@/content/contracts";
import type { ResolvedRelationship } from "@/content/catalog";
import { RelationshipNavigation } from "./primitives";
import styles from "./article.module.css";

/** Ordinary fragment navigation: works on the server, with or without JavaScript. */
export function ArticleContext({ headings, relationships, hasSources }: {
  headings: readonly ArticleHeading[];
  relationships: readonly ResolvedRelationship[];
  hasSources: boolean;
}) {
  const outline = [
    ...headings,
    ...(hasSources ? [{ id: "article-sources", label: "Sources and provenance", depth: 2 }] : []),
    ...(relationships.length ? [{ id: "article-relationships", label: "Connect the concepts", depth: 2 }] : []),
  ];
  if (!outline.length) return null;
  return <aside className={styles.context} aria-label="Article guide">
    <nav aria-labelledby="article-outline">
      <h2 id="article-outline" className={styles.railLabel}>On this page</h2>
      <ol className={styles.outline}>
        {outline.map(heading => <li key={heading.id} className={heading.depth > 2 ? styles.outlineNested : undefined}>
          <a href={`#${heading.id}`}>{heading.label}</a>
        </li>)}
      </ol>
    </nav>
    <RelationshipNavigation relationships={relationships} compact />
  </aside>;
}
