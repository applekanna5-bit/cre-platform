import Link from "next/link";
import type { ReactNode } from "react";
import { Container, Eyebrow } from "@/components/ui/primitives";

export interface TrustSection {
  readonly id: string;
  readonly title: string;
  readonly paragraphs: readonly string[];
}

export function TrustPage({ title, introduction, sections, children }: {
  title: string;
  introduction: string;
  sections: readonly TrustSection[];
  children: ReactNode;
}) {
  return <Container width="reading" className="py-10 sm:py-14">
    <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted">
      <Link href="/" className="inline-flex min-h-11 items-center text-accent underline underline-offset-4">Home</Link>
      <span aria-hidden="true">/</span><span aria-current="page">{title}</span>
    </nav>
    <article aria-labelledby="trust-title">
      <header className="border-b border-border pb-8">
        <Eyebrow>The CRE Ledger</Eyebrow>
        <h1 id="trust-title" className="mt-3 font-editorial text-display">{title}</h1>
        <p className="mt-6 text-lg">{introduction}</p>
      </header>
      {sections.map(section => <section key={section.id} aria-labelledby={section.id} className="mt-9 sm:mt-12">
        <h2 id={section.id} className="border-l-2 border-copper pl-4 font-editorial text-2xl">{section.title}</h2>
        {section.paragraphs.map(paragraph => <p key={paragraph} className="mt-4">{paragraph}</p>)}
      </section>)}
      <nav aria-label="About this publication" className="mt-10 border-t border-border pt-5 text-sm">
        {children}
      </nav>
    </article>
  </Container>;
}
