import { homepagePaths, primaryNavigation } from "@/config/navigation";
import { ActionLink, Badge, Container, Eyebrow, Section, Surface } from "@/components/ui/primitives";

export default function Home() {
  return (
    <Container>
      <Section aria-labelledby="page-title" className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Eyebrow>Knowledge / Analysis / Decisions</Eyebrow>
          <Badge>Platform preview</Badge>
        </div>
        <h1 id="page-title" className="mt-8 max-w-[20ch] font-editorial text-display">
          Commercial real estate.<br />Knowledge &amp; analysis.
        </h1>
        <p className="mt-6 max-w-[58ch] text-lg text-muted">
          A home for CRE learning, underwriting, and financial modeling.
        </p>
      </Section>

      <Section aria-labelledby="paths-heading">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
          <h2 id="paths-heading" className="text-2xl font-semibold tracking-tight">Choose a starting point</h2>
          <p className="text-sm text-muted">Explore the planned sections below.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {homepagePaths.map((path, index) => {
            const section = primaryNavigation.find((item) => item.id === path.sectionId)!;
            return (
              <Surface key={path.sectionId} className="flex flex-col items-start">
                <span aria-hidden="true" className="text-sm font-semibold tabular-nums text-accent">0{index + 1}</span>
                <h3 className="mt-5 text-xl font-semibold tracking-tight">{path.label}</h3>
                <p className="mt-2 mb-6 text-sm text-muted">{section.summary}</p>
                <ActionLink href={section.href} className="mt-auto w-full">
                  <span>{section.label} overview</span><span aria-hidden="true">↓</span>
                </ActionLink>
              </Surface>
            );
          })}
        </div>
      </Section>

      <Section aria-labelledby="directory-heading" className="border-t border-border">
        <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
          <div>
            <Eyebrow>Platform directory</Eyebrow>
            <h2 id="directory-heading" className="mt-3 text-2xl font-semibold tracking-tight">Explore by area</h2>
            <p className="mt-4 max-w-[38ch] text-sm text-muted">
              These sections are in preparation. Articles, guides, and tools are not yet available.
            </p>
          </div>
          <div className="divide-y divide-border border-y border-border">
            {primaryNavigation.map((item) => (
              <section key={item.id} aria-labelledby={item.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-x-6">
                <h3 id={item.id} tabIndex={-1} className="w-fit rounded-control text-lg font-semibold">{item.label}</h3>
                <Badge className="w-fit sm:row-span-2 sm:self-center">Planned</Badge>
                <p className="max-w-[60ch] text-sm text-muted sm:col-start-1 sm:row-start-2">{item.summary}</p>
              </section>
            ))}
          </div>
        </div>
      </Section>
    </Container>
  );
}
