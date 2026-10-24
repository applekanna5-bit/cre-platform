import type { ArticleDomain, ContentCatalog } from "@/content/contracts";
import { publicArticles, type PublicArticle } from "@/content/publication";
import styles from "./learning-discovery.module.css";

// Presentation labels for existing delivery domains, not a new publishing taxonomy.
const domains: Record<ArticleDomain, { name: string; description: string }> = {
  learn: { name: "CRE Fundamentals", description: "Build context for reading property and investment analysis." },
  underwriting: { name: "Underwriting", description: "Read property financials, test the income story, and connect evidence to NOI." },
  "property-types": { name: "Property Types", description: "Explore how property characteristics shape the analysis." },
  financing: { name: "Financing", description: "Explore the relationship between property cash flow and financing." },
  agency: { name: "Agency Lending", description: "Explore published research on agency lending frameworks." },
  modeling: { name: "Financial Modeling", description: "Connect assumptions with structured financial analysis." },
  resources: { name: "Resources", description: "Find published reference material for your research." },
  insights: { name: "Insights", description: "Explore published perspectives on commercial real estate." },
};

const difficultyNames = { foundational: "Foundation", intermediate: "Practitioner", advanced: "Institutional" } as const;

const practiceTopics = [
  { topic: "valuation", label: "Connect NOI and value" },
  { topic: "expense-analysis", label: "Interpret operating expenses" },
  { topic: "revenue-underwriting", label: "Assess supportable revenue" },
  { topic: "rent-roll", label: "Read lease and occupancy evidence" },
] as const;

const connections = [
  { concept: "Rent", id: "CRE-008", note: "Compare the laboratory’s single rent assumption with contract and market rent evidence." },
  { concept: "Vacancy", id: "CRE-011", note: "Put the model’s vacancy allowance in the wider context of revenue losses and supportable income." },
  { concept: "Expenses", id: "CRE-006", note: "Move from a single expense ratio to reading the property’s operating statement." },
  { concept: "NOI", id: "CRE-015", note: "Explore the judgment behind sustainable income and normalized operating expenses." },
  { concept: "Valuation", id: "CRE-015", note: "Follow the article’s worked example of how an NOI adjustment affects value at an assumed cap rate." },
] as const;

function ResearchLinks({ articles }: { articles: readonly PublicArticle[] }) {
  return <ul className={styles.links}>{articles.map(article => <li key={article.id}>
    <a href={article.href}>{article.title}</a>
    {article.needsReview && <span className={styles.review}>Awaiting review</span>}
  </li>)}</ul>;
}

/** Server-rendered discovery. All selections and counts follow the public allowlist. */
export function LearningDiscovery({ catalog }: { catalog: Pick<ContentCatalog, "articles"> }) {
  const articles = publicArticles(catalog);
  const groups = [...new Set(articles.map(article => article.domain))].map(domain => ({
    domain, ...domains[domain], articles: articles.filter(article => article.domain === domain),
  }));
  const discover = articles.filter(article => ["CRE-007", "CRE-006"].includes(article.id));
  const understand = articles.filter(article => ["CRE-011", "CRE-015"].includes(article.id));
  const nextReads = new Map(articles.map(article => {
    const metadata = catalog.articles.find(record => record.id === article.id);
    const related = metadata?.relationships.filter(relationship => relationship.purpose === "deep-dive" && relationship.target.kind === "article") ?? [];
    const next = related.flatMap(relationship => articles.filter(candidate => candidate.id === relationship.target.id && candidate.id !== article.id))[0];
    return [article.id, next] as const;
  }));
  const connected = connections.flatMap(connection => {
    const article = articles.find(article => article.id === connection.id);
    return article ? [{ ...connection, article }] : [];
  });

  return <div className={styles.discovery}>
    <section aria-labelledby="pathway-title" className={styles.section}>
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>02 / CRE knowledge explorer</p>
        <h2 id="pathway-title" tabIndex={-1}>Build Your CRE Underwriting Knowledge</h2>
        <p>Continue from the property laboratory into published research. Explore the subjects with material available today.</p>
      </div>
      {groups.length > 0 ? <>
        <ul aria-label="Published knowledge categories" className={styles.categories}>
          {groups.map(group => <li key={group.domain}>
            <a href={`#knowledge-${group.domain}`} className={styles.category}>
              <span className={styles.eyebrow}>{group.articles.length} published {group.articles.length === 1 ? "article" : "articles"}</span>
              <h3>{group.name}</h3>
              <p>{group.description}</p>
              <span className={styles.action}>Explore {group.name.toLowerCase()} <span aria-hidden="true">↘</span></span>
            </a>
          </li>)}
        </ul>
        {groups.map(group => <section key={group.domain} aria-labelledby={`knowledge-${group.domain}`} className={styles.collection}>
          <div className={styles.collectionHeading}>
            <h3 id={`knowledge-${group.domain}`} tabIndex={-1}>{group.name} research</h3>
            <p>Published research / {group.articles.length} {group.articles.length === 1 ? "article" : "articles"}</p>
          </div>
          <ul className={styles.articles}>
            {group.articles.map(article => {
              const practice = practiceTopics.find(item => article.topics.includes(item.topic));
              const next = nextReads.get(article.id);
              return <li key={article.id}>
              <article className={styles.article}>
                <p className={styles.articleMeta}>{difficultyNames[article.difficulty]} / {article.contentType}</p>
                <h4><a href={article.href}>{article.title}<span aria-hidden="true"> ↗</span></a></h4>
                <p>{article.description}</p>
                {practice && <p className={styles.practice}><span>In practice</span>{practice.label}</p>}
                {article.needsReview && <span className={styles.review}>Awaiting review</span>}
                <div className={styles.nextRead}>{next ? <>
                  <span>Read next</span><a href={next.href}>{next.title}</a>
                  {next.needsReview && <span className={styles.review}>Awaiting review</span>}
                </> : <a href="#assumption-monthlyRent">Apply this reading in the fictional laboratory <span aria-hidden="true">↑</span></a>}</div>
              </article>
            </li>; })}
          </ul>
        </section>)}
      </> : <p className={styles.empty}>Published research will appear here when available. The fictional property laboratory remains available above.</p>}
    </section>

    {discover.length > 0 && understand.length > 0 && <section aria-labelledby="learning-progression-title" className={styles.section}>
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>03 / A suggested reading order</p>
        <h2 id="learning-progression-title">Discover. Understand. Apply.</h2>
        <p>Read the evidence, interpret the financial story, then test an assumption. Follow the sequence or start with the question you have today.</p>
      </div>
      <ol className={styles.progression}>
        <li><div className={styles.stageHeading}><span className={styles.step} aria-hidden="true">01</span><h3>Discover</h3></div><p className={styles.stageLabel}>Source documents &amp; financial evidence</p><p>Read the rent roll and T-12 to understand the evidence behind property performance.</p><ResearchLinks articles={discover} /></li>
        <li><div className={styles.stageHeading}><span className={styles.step} aria-hidden="true">02</span><h3>Understand</h3></div><p className={styles.stageLabel}>Revenue, expenses, NOI &amp; value</p><p>Follow how underwriters interpret reported income, assess expenses, and connect NOI to valuation.</p><ResearchLinks articles={understand} /></li>
        <li className={styles.applyStage}><div className={styles.stageHeading}><span className={styles.step} aria-hidden="true">03</span><h3>Apply</h3></div><p className={styles.stageLabel}>The fictional property laboratory</p><p>Change an assumption in the 100-unit example. Follow its effect on income and value, then compare with the baseline.</p><a className={styles.returnLink} href="#assumption-monthlyRent">Adjust the laboratory assumptions <span aria-hidden="true">↑</span></a></li>
      </ol>
    </section>}

    {connected.length > 0 && <section aria-labelledby="connected-research-title" className={styles.section}>
      <div className={styles.sectionHeading}>
        <p className={styles.eyebrow}>04 / From the model to the evidence</p>
        <h2 id="connected-research-title">Take the next question into the research.</h2>
        <p>The laboratory simplifies the mechanics. These articles explore the analysis behind them; their worked examples are separate from this fictional property.</p>
      </div>
      <dl className={styles.connections}>{connected.map(connection => <div key={connection.concept}>
        <dt>{connection.concept}</dt>
        <dd><p>{connection.note}</p><ResearchLinks articles={[connection.article]} /></dd>
      </div>)}</dl>
    </section>}

    <section aria-labelledby="discovery-search-title" className={`${styles.section} ${styles.search}`}>
      <div><p className={styles.eyebrow}>Keep exploring</p><h2 id="discovery-search-title">Continue Your CRE Research</h2><p>Browse the published library, or use the masthead search to follow a concept across the research.</p></div>
      <div className={styles.searchLinks}><a href="/library">Browse the research library <span aria-hidden="true">→</span></a><a href="/search?q=NOI">Find published NOI research <span aria-hidden="true">→</span></a></div>
    </section>
  </div>;
}
