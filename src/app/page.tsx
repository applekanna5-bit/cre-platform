import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/seo/metadata";
import { Container, Section } from "@/components/ui/primitives";
import { ArticleList } from "@/components/content/article-list";
import { lifecycle, recommendedReading, specializations } from "@/config/learning";
import { HomepageUnderwriting } from "@/components/home/homepage-underwriting";
import architecture from "@/components/design-preview/living-ledger/assets/living-ledger-multifamily.webp";
import styles from "@/components/design-preview/living-ledger-cinematic/cinematic.module.css";

export const metadata = pageMetadata("home");

export default function Home() {
  return <>
    <section className={styles.hero} aria-labelledby="home-title">
      <div className={styles.photography}>
        <Image src={architecture} alt="" sizes="100vw" unoptimized placeholder="blur" loading="eager" fetchPriority="high" className={styles.image} />
      </div>
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <h1 id="home-title">Commercial Real Estate, Explained from Origination to Resolution.</h1>
          <p className={styles.deck}>Practical CRE knowledge, underwriting insights, and property financial analysis.</p>
          <div className={styles.actions}>
            <a href="#underwriting-preview" className={styles.primary}>Try the underwriting model</a>
            <Link href="/loan-lifecycle" className={styles.secondary}>Explore the loan lifecycle</Link>
          </div>
        </div>
      </div>
    </section>
    <HomepageUnderwriting>
      <Section aria-labelledby="lifecycle-title" className="border-t border-border">
        <Container>
          <h2 id="lifecycle-title" className="font-editorial text-3xl">CRE Loan Lifecycle</h2>
          <ol className="mt-6 grid list-decimal gap-x-10 gap-y-3 pl-6 sm:grid-cols-2 lg:grid-cols-3">
            {lifecycle.map(stage => <li key={stage.id}><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href={`/loan-lifecycle#${stage.id}`}>{stage.title}</Link></li>)}
          </ol>
        </Container>
      </Section>
      <Section aria-labelledby="specializations-title" className="border-t border-border bg-surface">
        <Container>
          <h2 id="specializations-title" className="font-editorial text-3xl">Professional Specializations</h2>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {specializations.map(topic => <li key={topic.id}><Link className="inline-flex min-h-11 items-center underline underline-offset-4" href={`/specializations#${topic.id}`}>{topic.title}</Link></li>)}
          </ul>
        </Container>
      </Section>
      <Section aria-labelledby="featured-title" className="border-t border-border">
        <Container>
          <h2 id="featured-title" className="mb-6 font-editorial text-3xl">Featured Articles and Practical Examples</h2>
          <ArticleList articles={recommendedReading(["CRE-007", "CRE-015", "CRE-018", "CRE-025"])} />
          <Link className="mt-6 inline-flex min-h-11 items-center underline underline-offset-4" href="/library">Browse the library</Link>
        </Container>
      </Section>
    </HomepageUnderwriting>
    <Section aria-labelledby="feedback-title" className="border-t border-border bg-surface">
      <Container>
        <h2 id="feedback-title" className="font-editorial text-3xl">Professional Feedback</h2>
        <p className="mt-3 text-muted">Feedback submissions are currently unavailable.</p>
        <Link className="mt-3 inline-flex min-h-11 items-center underline underline-offset-4" href="/feedback">Professional feedback information</Link>
      </Container>
    </Section>
  </>;
}
