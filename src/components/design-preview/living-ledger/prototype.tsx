import Link from "next/link";
import type { ReactNode } from "react";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";
import { PropertyVisual } from "./property-visual";
import { UnderwritingLab } from "./underwriting-lab";
import styles from "./living-ledger.module.css";

export function LivingLedgerPrototype({ showIntroduction = true, compactLaboratory = false, discovery }: { showIntroduction?: boolean; compactLaboratory?: boolean; discovery?: ReactNode } = {}) {
  const published = publicArticles(catalog);
  const lessons = [
    { title: "Rent Roll / T-12", ids: ["CRE-007", "CRE-006"], note: "Read the property’s starting point." },
    { title: "Underwritten NOI", ids: ["CRE-015"], note: "Turn reported income into an analytical conclusion." },
    { title: "Valuation", ids: [], note: "Connect sustainable income and required return." },
    { title: "Loan Sizing", ids: [], note: "Explore how cash flow supports debt." },
    { title: "Investment Decision", ids: [], note: "Bring the evidence together." },
  ];
  return <div className={styles.prototype}>
    {showIntroduction && <><div className={styles.previewNotice}><span>Local design study</span><span>The Living Ledger / Education through exploration</span></div>
    <section className={`${styles.hero} ${styles.storyIntro}`} aria-labelledby="living-ledger-title">
      <div>
        <p className={styles.eyebrow}>The CRE Ledger / An interactive field guide</p>
        <h1 id="living-ledger-title">See the property.<br /><em>Understand the value.</em></h1>
        <p className={styles.heroDeck}>Explore CRE underwriting, one assumption at a time.</p>
        <div className={styles.heroActions}><a href="#property-lab" className={styles.primaryLink}>Explore the living ledger <span aria-hidden="true">↗</span></a><Link href="/library" className={styles.textLink}>Read the research <span aria-hidden="true">→</span></Link></div>
        <dl className={styles.heroFacts}><div><dt>Property</dt><dd>100 fictional units</dd></div><div><dt>Method</dt><dd>Four connected assumptions</dd></div><div><dt>Purpose</dt><dd>Learn by exploring</dd></div></dl>
      </div>
    </section></>}
    <UnderwritingLab photography={<PropertyVisual loading={compactLaboratory ? "lazy" : "eager"} />} compactMobile={compactLaboratory} />
    {compactLaboratory && <a href="#pathway-title" className={styles.researchShortcut}>Continue with published research <span aria-hidden="true">→</span></a>}
    {discovery ?? <><section aria-labelledby="pathway-title" className={styles.pathway}>
      <div className={styles.sectionHeading}><p className={styles.eyebrow}>02 / Build the understanding</p><h2 id="pathway-title">From a rent roll to a reasoned decision.</h2><p>A conceptual learning pathway. Published lessons are linked; future lessons are clearly marked.</p></div>
      <ol className={styles.steps}>
        {lessons.map((lesson, index) => {
          const articles = lesson.ids.flatMap(id => published.filter(article => article.id === id));
          return <li key={lesson.title}><p className={styles.stepNumber}><span>{String(index + 1).padStart(2, "0")}</span><span aria-hidden="true">{index < lessons.length - 1 ? "→" : "■"}</span></p><h3>{lesson.title}</h3><p>{lesson.note}</p>
            {articles.length > 0 ? <ul>{articles.map(article => <li key={article.id}><Link href={article.href}>{article.title}</Link>{article.needsReview && <span className={styles.planned}>Awaiting review</span>}</li>)}</ul> : <span className={styles.planned}>Planned lesson</span>}
          </li>;
        })}
      </ol>
    </section>
    <section aria-labelledby="prototype-search-title" className={styles.research}>
      <div><p className={styles.eyebrow}>03 / Return to the evidence</p><h2 id="prototype-search-title">A deeper read. A sharper question.</h2><p>Search the published research, or explore the full library.</p><Link href="/library" className={styles.textLink}>Explore the research library <span aria-hidden="true">↗</span></Link></div>
      <div className={styles.searchPanel}><p className={styles.eyebrow}>Put the model in context</p><Link href="/search?q=NOI" className={styles.textLink}>Find published NOI research <span aria-hidden="true">→</span></Link><p>Use the masthead search to explore another question.</p></div>
    </section></>}
  </div>;
}
