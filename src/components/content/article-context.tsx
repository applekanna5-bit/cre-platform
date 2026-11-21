import type { ArticleHeading } from "@/content/contracts";
import styles from "./article.module.css";

function OutlineLinks({ headings }: { headings: readonly ArticleHeading[] }) {
  return <ol className={styles.outline}>
    {headings.map(heading => <li key={heading.id} className={heading.depth > 2 ? styles.outlineNested : undefined}>
      <a href={`#${heading.id}`}>{heading.label}</a>
    </li>)}
  </ol>;
}

export function ArticleContext({ headings, inline = false }: {
  headings: readonly ArticleHeading[];
  inline?: boolean;
}) {
  if (!headings.length) return null;
  if (inline) return <details className={styles.inlineOutline}>
    <summary>On this page</summary>
    <nav aria-label="On this page"><OutlineLinks headings={headings} /></nav>
  </details>;

  return <nav className={styles.context} aria-labelledby="article-outline">
    <p id="article-outline" className={styles.railLabel}>On this page</p>
    <OutlineLinks headings={headings} />
  </nav>;
}
