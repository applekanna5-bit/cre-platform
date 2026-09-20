import type { ReactNode } from "react";
import type { ContentSource, EducationalCase, FinancialTableData } from "@/content/contracts";
import type { ResolvedRelationship } from "@/content/catalog";
import styles from "./article.module.css";

export function Formula({ formula, variables, interpretation }: { formula: string; variables: readonly { symbol: string; meaning: string }[]; interpretation?: string }) {
  return <figure className={styles.formula}>
    <figcaption className="text-xs font-semibold uppercase tracking-wider text-steel">Formula definition</figcaption>
    <p className="mt-3 font-editorial text-xl leading-relaxed">{formula}</p>
    <dl className="mt-4 grid gap-3 text-sm">{variables.map(variable => <div key={variable.symbol}><dt className="font-semibold">{variable.symbol}</dt><dd className="text-muted">{variable.meaning}</dd></div>)}</dl>
    {interpretation && <p className="mt-4 text-sm text-muted">{interpretation}</p>}
  </figure>;
}
export function Calculation({ inputs, formula, result, interpretation }: { inputs: readonly { label: string; value: string }[]; formula: string; result: string; interpretation: string }) {
  return <figure className={styles.calculation}>
    <figcaption className="text-xs font-semibold uppercase tracking-wider text-copper-text">Worked calculation · stated example</figcaption>
    <dl className="mt-4 grid gap-3 text-sm">{inputs.map(input => <div key={input.label} className="flex flex-wrap justify-between gap-x-4"><dt>{input.label}</dt><dd className="font-semibold tabular-nums">{input.value}</dd></div>)}</dl>
    <p className="mt-4 border-t border-border pt-4 font-editorial text-lg">{formula}</p>
    <p className="mt-2 font-semibold tabular-nums">Result: {result}</p>
    <p className="mt-3 text-sm text-muted">{interpretation}</p>
  </figure>;
}
function Note({ label, children, caution = false }: { label: string; children: ReactNode; caution?: boolean }) {
  return <aside aria-label={label} className={`${styles.note} ${caution ? styles.caution : ""}`}>
    <p className={`mb-2 text-xs font-semibold uppercase tracking-wider ${caution ? "text-warning" : "text-steel"}`}>{label}</p>
    <div className="text-sm leading-relaxed">{children}</div>
  </aside>;
}
export function PractitionerNote({ children }: { children: ReactNode }) { return <Note label="Practitioner interpretation">{children}</Note>; }
export function ConventionNote({ children }: { children: ReactNode }) { return <Note label="Convention / methodology">{children}</Note>; }
export function Warning({ children }: { children: ReactNode }) { return <Note label="Analytical caution" caution>{children}</Note>; }
export function InstitutionalExample({ source, children }: { source: ContentSource; children: ReactNode }) {
  return <aside aria-label="Institution-specific example" className={styles.institution}>
    <p className="text-xs font-semibold uppercase tracking-wider text-copper-text">Institution-specific example{source.synthetic ? " · synthetic fixture" : ""}</p>
    <p className="mt-2 font-semibold">{source.publisher}</p>
    <div className="mt-3 text-sm leading-relaxed">{children}</div>
    <p className="mt-3 text-xs text-muted">This example is separate from general CRE teaching.</p>
    <SourceNote source={source} />
  </aside>;
}
export function CaseStudy({ record }: { record: EducationalCase }) {
  return <section aria-labelledby={`case-${record.id}`} className={styles.caseStudy}>
    <p className="text-xs font-semibold uppercase tracking-wider text-copper-text">Fictional educational case</p>
    <h3 id={`case-${record.id}`} tabIndex={-1} className="mt-2 font-editorial text-2xl">{record.label}</h3>
    <p className="mt-3 text-sm text-muted">{record.description}</p>
    <dl className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2">{record.facts.map(fact => <div key={fact.label} className="border-b border-border pb-3"><dt className="text-xs text-muted">{fact.label}</dt><dd className="mt-1 text-sm font-semibold tabular-nums">{fact.value}</dd></div>)}</dl>
  </section>;
}
export function FinancialTable({ data }: { data: FinancialTableData }) {
  return <div className={styles.financialTable}>
    <p id={`table-help-${data.id}`} className="mb-2 text-xs text-muted">On narrow screens, scroll the table horizontally. Keyboard users can focus the table region and use arrow keys.</p>
    <div role="region" aria-labelledby={`table-${data.id}`} aria-describedby={`table-help-${data.id}`} tabIndex={0} className="max-w-full overflow-x-auto border-y border-border-strong bg-elevated">
      <table className="w-full min-w-[30rem] border-collapse text-sm">
        <caption id={`table-${data.id}`} className="px-4 py-4 text-left font-semibold">{data.caption}</caption>
        <thead className="bg-accent text-on-accent"><tr>{data.columns.map(col => <th key={col.key} scope="col" className={`px-4 py-3 font-semibold ${col.numeric ? "text-right" : "text-left"}`}>{col.label}</th>)}</tr></thead>
        <tbody>{data.rows.map((row, index) => <tr key={`${row.label}-${index}`} data-total={row.total || undefined} className={row.total ? "border-t-2 border-accent bg-surface font-semibold" : "border-t border-border"}>
          <th scope="row" className="px-4 py-3 text-left font-medium">{row.label}</th>
          {row.values.map((value, i) => <td key={data.columns[i + 1].key} className={`px-4 py-3 ${data.columns[i + 1].numeric ? "text-right whitespace-nowrap tabular-nums" : "text-left"}`}>{value}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
  </div>;
}
export function SourceNote({ source }: { source: ContentSource }) {
  return <p className="my-4 text-sm text-muted">Source note: <a className="inline-block min-h-11 py-2 font-medium text-accent underline underline-offset-4 hover:text-steel" href={`#source-${source.id}`}>{source.title}</a>{source.synthetic && " (synthetic)"}</p>;
}
export function Sources({ sources }: { sources: readonly ContentSource[] }) {
  if (!sources.length) return null;
  return <section aria-labelledby="article-sources" className="mt-12 border-t border-border-strong pt-6">
    <h2 id="article-sources" tabIndex={-1} className="font-editorial text-2xl">Sources and provenance</h2>
    <ol className="mt-5 grid gap-5">{sources.map(source => <li key={source.id} id={`source-${source.id}`} tabIndex={-1} className="border-b border-border pb-5 text-sm">
      <p className="font-semibold">{source.title}</p>
      <p className="mt-1 text-muted">{source.publisher} · {source.type.replaceAll("-", " ")} · {source.authority}</p>
      {source.synthetic && <p className="mt-2 font-semibold text-copper-text">Synthetic development source — no external authority</p>}
      <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted">{([
        ["Published", source.publicationDate], ["Updated", source.updatedDate], ["Effective", source.effectiveDate], ["Accessed", source.accessedDate], ["Reviewed", source.reviewedDate],
      ] as const).filter(([, date]) => date).map(([label, date]) => <div key={label}><dt className="inline">{label}: </dt><dd className="inline"><time dateTime={date}>{date}</time></dd></div>)}</dl>
      {source.updateSensitivity && <p className="mt-2 text-xs text-muted">Update sensitivity: {source.updateSensitivity}</p>}
      {source.notes && <p className="mt-3 text-muted">{source.notes}</p>}
      {source.url && <a href={source.url} className="mt-2 inline-block min-h-11 py-2 text-accent underline underline-offset-4 hover:text-steel">View source at {source.publisher} <span aria-hidden="true">↗</span></a>}
    </li>)}</ol>
  </section>;
}
const purposeLabels = { prerequisite: "Prerequisite", "deep-dive": "Deep Dive", application: "Application", tool: "Tool" } as const;
export function RelationshipNavigation({ relationships, compact = false }: { relationships: readonly ResolvedRelationship[]; compact?: boolean }) {
  if (!relationships.length) return null;
  const id = compact ? "context-relationships" : "article-relationships";
  return <nav aria-labelledby={id} className={compact ? styles.railRelationships : styles.relationships}>
    <h2 id={id} tabIndex={-1} className={compact ? styles.railLabel : "font-editorial text-2xl"}>{compact ? "Related content" : "Connect the concepts"}</h2>
    <ul className="mt-4 divide-y divide-border">{relationships.map(relation => <li key={`${relation.purpose}:${relation.target.kind}:${relation.target.id}`} className="py-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-steel">{purposeLabels[relation.purpose]} · {relation.target.kind.replaceAll("-", " ")}</p>
      {relation.href ? <a href={relation.href} className="inline-block min-h-11 py-2 font-semibold text-accent underline underline-offset-4 hover:text-steel">{relation.label}</a> : <p className="mt-2 text-sm">{relation.label} <span className="text-muted">— Not available</span></p>}
    </li>)}</ul>
  </nav>;
}
