import { pageMetadata } from "@/seo/metadata";
import { primaryNavigation } from "@/config/navigation";
import { Container, Eyebrow, Section } from "@/components/ui/primitives";
import { CinematicLedgerPrototype } from "@/components/design-preview/living-ledger-cinematic/prototype";
import { catalog } from "@/content/.generated";
import { publicArticles } from "@/content/publication";

export const metadata = pageMetadata("home");

export default function Home() {
  const articles = publicArticles(catalog);
  return <>
    <CinematicLedgerPrototype presentation="public" />
    <Section aria-labelledby="cre-areas-title" className="border-t border-border">
      <Container>
        <Eyebrow>Knowledge directory</Eyebrow>
        <h2 id="cre-areas-title" className="mt-3 font-editorial text-2xl">Explore CRE areas</h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {primaryNavigation.filter(item => item.id !== "library").map(item => {
            const count = articles.filter(article => article.domain === item.id).length;
            return <section key={item.id} aria-labelledby={item.id}>
              <h3 id={item.id} tabIndex={-1} className="font-editorial text-xl">{item.label}</h3>
              <p className="mt-2 max-w-[48ch] text-sm text-muted">{item.summary}</p>
              {item.id === "learn" ? <a href="#learning-progression-title" className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4">Start with the published underwriting reading journey</a>
                : item.id === "tools" ? <><a href="#assumption-monthlyRent" className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4">Explore the fictional property laboratory</a><p className="text-sm text-muted">Additional tools and calculators are not yet available.</p></>
                : count > 0 ? <a href={`#knowledge-${item.id}`} className="inline-flex min-h-11 items-center text-sm text-accent underline underline-offset-4">{count} published {count === 1 ? "article" : "articles"} in the research library</a>
                : <p className="mt-2 text-sm text-muted">Research in this area is not yet published.</p>}
            </section>;
          })}
        </div>
      </Container>
    </Section>
  </>;
}
