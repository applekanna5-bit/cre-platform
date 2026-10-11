import { pageMetadata } from "@/seo/metadata";
import Link from "next/link";
import { searchDocuments as index } from "@/content/.generated/search";
import { normalizeSearch, searchDocuments, searchQuery } from "@/search/engine";
import { SearchForm } from "@/components/search/search-form";
import { Container, Eyebrow, Section } from "@/components/ui/primitives";

export const metadata = pageMetadata("search");

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const query = searchQuery((await searchParams).q);
  const hasQuery = !!normalizeSearch(query);
  const results = searchDocuments(index, query);
  return <Container>
    <Section aria-labelledby="search-title" className="border-b-2 border-copper">
      <Eyebrow>CRE / Research discovery</Eyebrow>
      <h1 id="search-title" className="mt-4 font-editorial text-display">Search the research</h1>
      <p className="mt-5 max-w-[55ch] text-lg text-muted">Find the concepts, frameworks, and practical analysis behind CRE underwriting decisions.</p>
      <SearchForm id="research-query" query={query} />
    </Section>
    <Section aria-labelledby="results-title">
      <h2 id="results-title" className="font-editorial text-3xl">{hasQuery ? `${results.length} ${results.length === 1 ? "result" : "results"}` : "Explore published research"}</h2>
      {hasQuery ? <p className="mt-3 text-sm text-muted">For “{query}” · Published research only</p> : <p className="mt-4 text-muted">Enter a concept or phrase to search article titles, topics, headings, and explanations.</p>}
      {hasQuery && !results.length && <p className="mt-6 max-w-[55ch] text-muted">No published research matches your search. Try a broader term such as NOI, T-12, or rent roll, or browse the library.</p>}
      {results.length > 0 && <ol className="mt-7 divide-y divide-border border-y border-border-strong">
        {results.map((result, i) => <li key={`${result.kind}:${result.id}`} className="py-7">
          <p className="text-xs font-semibold uppercase tracking-wider text-copper-text">{String(i + 1).padStart(2, "0")} / Research article</p>
          <h3 className="mt-3 max-w-[48ch] font-editorial text-2xl leading-tight"><Link href={result.href} className="text-accent-strong underline decoration-border underline-offset-4 hover:decoration-copper">{result.title}</Link></h3>
          <p className="mt-4 max-w-[75ch] text-sm text-muted">{result.description}</p>
        </li>)}
      </ol>}
      <Link href="/library" className="mt-7 inline-flex min-h-11 items-center text-sm font-semibold text-accent underline underline-offset-4">Browse all published research →</Link>
    </Section>
  </Container>;
}
