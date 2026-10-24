import type { ArticleDomain, ContentCatalog } from "@/content/contracts";
import { publicArticles } from "@/content/publication";
import { primaryNavigation } from "@/config/navigation";
import { NavigationList } from "@/components/navigation/navigation-list";
import styles from "./mobile-learning-navigation.module.css";

const navigationDomains: Partial<Record<(typeof primaryNavigation)[number]["id"], ArticleDomain>> = {
  learn: "learn", underwriting: "underwriting", "property-types": "property-types",
  financing: "financing", modeling: "modeling", resources: "resources",
};

/** Public links return to the homepage; the local study retains its own anchors. */
export function MobileLearningNavigation({ catalog, preview = false }: { catalog: Pick<ContentCatalog, "articles">; preview?: boolean }) {
  const articles = publicArticles(catalog);
  const entries = primaryNavigation.map(item => {
    const domain = navigationDomains[item.id];
    return { item, domain, count: domain ? articles.filter(article => article.domain === domain).length : 0 };
  });
  const available = entries.filter(entry => entry.item.id === "library" || entry.count > 0);
  const future = entries.filter(entry => entry.item.id !== "library" && entry.count === 0);

  return <div className={styles.menu}>
    <p className={styles.label}>Start with published research</p>
    <ul aria-label="Available research destinations" className={styles.available}>
      {available.map(({ item, domain, count }) => <li key={item.id}>
        <a href={count > 0 ? `${preview ? "" : "/"}#knowledge-${domain}` : item.href} className={styles.destination}>
          <strong>{item.label}</strong>
          <span>{item.id === "library" ? "Browse the research library" : `${count} published ${count === 1 ? "article" : "articles"}`}</span>
        </a>
        {count > 0 && <a href={item.href} className={styles.overview}>{item.label} category overview <span aria-hidden="true">→</span></a>}
      </li>)}
    </ul>
    {future.length > 0 && <details className={styles.future}>
      <summary>Explore more CRE areas <span>{future.length} category overviews</span></summary>
      <p>These links open category overviews. Explore the fictional laboratory under Tools; research in these areas is still to come.</p>
      <NavigationList items={future.map(entry => entry.item)} />
    </details>}
  </div>;
}
