import { homepagePaths, primaryNavigation } from "@/config/navigation";
import { ActionLink, Badge, Container, Eyebrow, Section } from "@/components/ui/primitives";
import { UnderwritingSnapshot } from "@/components/home/underwriting-snapshot";
import { KnowledgePreview } from "@/components/home/knowledge-preview";

const pathDetails = {
  learn: { concepts: "T-12 · Rent Roll · NOI · Cap Rate", summary: "Foundation concepts and practical property analysis.", label: "Build the foundation" },
  underwriting: { concepts: "Property · Market · Sponsor · Credit", summary: "Follow the analytical path from property review to credit decision.", label: "Apply the framework" },
  tools: { concepts: "DSCR · Debt Yield · LTV · Loan Sizing", summary: "Calculators and decision-support tools for CRE analysis.", label: "Work with the numbers" },
} as const;

export default function Home() {
  return (
    <>
      <Container>
        <Section aria-labelledby="page-title" className="border-b border-border lg:pt-10">
          <div className="grid items-center gap-10 lg:grid-cols-[3fr_2fr] lg:gap-8">
            <div>
              <Eyebrow>CRE knowledge / Underwriting / Decision tools</Eyebrow>
              <h1 id="page-title" className="mt-6 max-w-[18ch] font-editorial text-display">
                Commercial Real Estate, <span className="text-accent-strong underline decoration-copper decoration-2 underline-offset-8">Underwritten.</span>
              </h1>
              <p className="mt-6 max-w-[48ch] text-lg text-muted">Learn how CRE deals are analyzed, financed, valued and modeled — from property financials to institutional underwriting.</p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <ActionLink href={primaryNavigation.find((item) => item.id === "learn")!.href}>Start Learning <span aria-hidden="true">↗</span></ActionLink>
                <a href={primaryNavigation.find((item) => item.id === "underwriting")!.href} className="inline-flex min-h-11 items-center gap-3 rounded-control px-3 py-2 text-sm font-semibold text-accent-strong underline-offset-4 hover:bg-surface hover:underline focus-visible:underline">Explore Underwriting <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <UnderwritingSnapshot />
          </div>
          <ol aria-label="Underwriting relationships" className="mt-10 grid border-y-2 border-accent bg-elevated sm:grid-cols-5">
            {["Property Financials", "NOI", "Value", "Loan Sizing", "Credit Decision"].map((step, index) => (
              <li key={step} className="flex items-center gap-3 border-b border-border px-3 py-4 text-sm font-semibold sm:block sm:border-b-0 sm:border-r sm:last:border-r-0"><span aria-hidden="true" className="mr-3 text-xs font-medium tabular-nums text-copper-text">0{index + 1}</span>{step}{index < 4 && <span aria-hidden="true" className="ml-auto text-steel sm:mt-2 sm:block"><span className="sm:hidden">↓</span><span className="hidden sm:inline">→</span></span>}</li>
            ))}
          </ol>
        </Section>

        <Section aria-labelledby="paths-heading">
          <div className="mb-6 flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="paths-heading" className="font-editorial text-3xl leading-tight">Choose a starting point</h2>
            <p className="text-sm text-muted">Foundations / Frameworks / Application</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {homepagePaths.map((path, index) => {
              const section = primaryNavigation.find((item) => item.id === path.sectionId)!;
              const details = pathDetails[path.sectionId];
              return (
                <div key={path.sectionId} className={`flex flex-col items-start p-6 ${index === 1 ? "border-t-2 border-t-copper bg-elevated" : index === 2 ? "border-t-2 border-t-steel bg-surface" : "border-t-2 border-t-accent"}`}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted"><span aria-hidden="true" className="mr-3 tabular-nums text-copper-text">0{index + 1}</span>{details.label}</p>
                  <h3 className="mt-5 text-xl font-semibold tracking-tight">{path.label}</h3>
                  <p className="mt-3 mb-6 text-sm text-muted">{details.summary}</p>
                  <p className="mt-auto w-full border-y border-border py-4 text-xs font-semibold text-accent-strong">{details.concepts}</p>
                  <a href={section.href} className="mt-4 inline-flex min-h-11 w-full items-center justify-between gap-3 rounded-control text-sm font-semibold text-accent-strong underline underline-offset-4 hover:bg-surface">
                    <span>{section.label} overview</span><span aria-hidden="true">↓</span>
                  </a>
                </div>
              );
            })}
          </div>
        </Section>
      </Container>
      <KnowledgePreview />
      <Container>
        <Section aria-labelledby="directory-heading" className="border-t border-border">
          <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-16">
            <div>
              <Eyebrow>Knowledge directory</Eyebrow>
              <h2 id="directory-heading" className="mt-3 font-editorial text-3xl leading-tight">Explore by area</h2>
              <p className="mt-4 max-w-[38ch] text-sm text-muted">
                Explore the disciplines of CRE analysis. Guides and tools are coming soon.
              </p>
            </div>
            <div className="divide-y divide-border border-y border-border">
              {primaryNavigation.map((item) => (
                <section key={item.id} aria-labelledby={item.id} className="grid gap-2 py-5 sm:grid-cols-[1fr_auto] sm:gap-x-6">
                  <h3 id={item.id} tabIndex={-1} className="w-fit rounded-control text-lg font-semibold">{item.label}</h3>
                  <Badge className="w-fit sm:row-span-2 sm:self-center">Coming soon</Badge>
                  <p className="max-w-[60ch] text-sm text-muted sm:col-start-1 sm:row-start-2">{item.summary}</p>
                </section>
              ))}
            </div>
          </div>
        </Section>
      </Container>
      <Section aria-labelledby="purpose-heading" className="border-t-2 border-copper bg-accent-strong text-on-accent">
        <Container className="grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-14">
          <h2 id="purpose-heading" className="max-w-[26ch] font-editorial text-3xl leading-tight">From property financials to credit decisions.</h2>
          <p className="max-w-[48ch] text-sm leading-relaxed lg:self-center">Connecting CRE concepts, underwriting frameworks, financial modeling and decision tools in one knowledge platform.</p>
        </Container>
      </Section>
    </>
  );
}
