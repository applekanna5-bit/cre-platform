import Link from "next/link";
import { pageMetadata } from "@/seo/metadata";
import { Container, Section } from "@/components/ui/primitives";
import { beginnerArticleId, lifecycle, recommendedReading, specializations } from "@/config/learning";
import { HomepageUnderwriting } from "@/components/home/homepage-underwriting";

export const metadata = pageMetadata("home");

const featured = [
  { id: "CRE-007", reason: "Use a lease schedule to investigate occupancy, concessions, and upcoming expirations." },
  { id: "CRE-015", reason: "See how an analyst moves from reported results to a supportable estimate of net operating income." },
  { id: "CRE-025", reason: "Check which cash flow and payments a coverage multiple actually compares." },
];

const readingLink = "text-accent-strong underline decoration-border-strong underline-offset-4 hover:decoration-copper";

export default function Home() {
  const [beginner] = recommendedReading([beginnerArticleId]);
  const articles = recommendedReading(featured.map(item => item.id));

  return <>
    <div className="border-b border-border bg-elevated">
      <Container className="grid gap-8 py-12 sm:py-16 lg:grid-cols-[minmax(0,1.65fr)_minmax(16rem,1fr)] lg:items-center lg:gap-12 lg:py-20">
        <section aria-labelledby="home-title">
          <h1 id="home-title" className="max-w-[19ch] font-editorial text-display font-normal text-balance">
            Commercial Real Estate, Explained from Origination to Resolution.
          </h1>
          <p className="mt-5 max-w-[48ch] text-lg text-muted">Learn how to read a property’s financials, evaluate a loan request, and follow the loan after closing.</p>
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2">
            <a href="#start-reading" className="inline-flex min-h-11 items-center rounded-control bg-accent px-4 text-sm font-semibold text-on-accent hover:bg-accent-strong">Start reading</a>
            <Link href="/loan-lifecycle" className={`inline-flex min-h-11 items-center text-sm font-semibold ${readingLink}`}>Explore the loan lifecycle</Link>
          </div>
        </section>
        <section id="learn" tabIndex={-1} aria-labelledby="start-reading" className="max-w-md border-t-2 border-copper pt-4">
          <h2 id="start-reading" tabIndex={-1} className="font-editorial text-3xl">Start Here</h2>
          <p className="mt-3 max-w-[44ch] text-muted">Start with the property’s income. This guide explains how potential rent changes after vacancy and other losses, before operating expenses enter the analysis.</p>
          {beginner && <Link href={beginner.href} className={`mt-3 inline-block py-2 font-semibold ${readingLink}`}>Read how vacancy and losses affect income</Link>}
        </section>
      </Container>
    </div>

    <Section aria-labelledby="lifecycle-title">
      <Container>
        <h2 id="lifecycle-title" className="font-editorial text-3xl sm:text-4xl">CRE Loan Lifecycle</h2>
        <p className="mt-3 max-w-[63ch] text-muted">Follow a loan from the initial request to servicing. The steps can vary with the loan’s purpose and the documents that govern it.</p>
        <ol className="mt-7 grid gap-x-12 lg:grid-cols-2">
          {lifecycle.map((stage, index) => <li key={stage.id} className="grid grid-cols-[2ch_minmax(0,1fr)] gap-4 border-t border-border py-4">
            <span className="pt-2 text-sm font-semibold tabular-nums text-copper-text" aria-hidden="true">{index + 1}</span>
            <div>
              <h3 className="font-editorial text-xl"><Link className={`inline-flex min-h-11 items-center ${readingLink}`} href={`/loan-lifecycle#${stage.id}`}>{stage.title}</Link></h3>
              <p className="max-w-[53ch] text-muted">{stage.description}</p>
              {recommendedReading(stage.articles).length > 0 && <p className="mt-2 text-sm font-medium text-muted">Published reading available</p>}
            </div>
          </li>)}
        </ol>
      </Container>
    </Section>

    <Section aria-labelledby="specializations-title" className="border-y border-border bg-surface">
      <Container>
        <h2 id="specializations-title" className="font-editorial text-3xl sm:text-4xl">Professional Specializations</h2>
        <ul className="mt-6 grid gap-x-9 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          {specializations.map(topic => <li key={topic.id} id={topic.id === "financing-markets" ? "financing" : topic.id} tabIndex={-1}>
            <h3 className="font-editorial text-xl"><Link className={`inline-flex min-h-11 items-center ${readingLink}`} href={`/specializations#${topic.id}`}>{topic.title}</Link></h3>
            <p className="max-w-[36ch] text-muted">{topic.description}</p>
          </li>)}
        </ul>
      </Container>
    </Section>

    <HomepageUnderwriting>
      <Section aria-labelledby="featured-title" className="border-t border-border">
        <Container>
          <h2 id="featured-title" className="font-editorial text-3xl sm:text-4xl">Featured Reading</h2>
          <ul className="mt-6 grid gap-x-9 md:grid-cols-3">
            {articles.map(article => <li key={article.id} className="border-t border-border py-5">
              <h3 className="font-editorial text-xl"><Link href={article.href} className={readingLink}>{article.title}</Link></h3>
              <p className="mt-3 max-w-[45ch] text-muted">{featured.find(item => item.id === article.id)?.reason}</p>
            </li>)}
          </ul>
          <Link id="resources" href="/library" className={`mt-2 inline-flex min-h-11 items-center font-semibold ${readingLink}`}>Browse the Library</Link>
        </Container>
      </Section>
    </HomepageUnderwriting>
  </>;
}
