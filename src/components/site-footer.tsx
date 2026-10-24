import { footerNavigation } from "@/config/navigation";
import { NavigationList } from "@/components/navigation/navigation-list";
import { Container, Eyebrow } from "@/components/ui/primitives";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border-strong bg-surface pt-10 pb-5 sm:pt-14">
      <Container>
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <p className="font-editorial text-3xl tracking-tight text-foreground">The CRE Ledger</p>
            <p className="mt-3 max-w-[32ch] text-sm text-muted">Commercial real estate research &amp; education.</p>
            <p className="mt-5 max-w-[36ch] border-l-2 border-copper pl-4 text-xs leading-relaxed text-muted">Five underwriting articles available in the library. Explore the fictional property laboratory; additional tools and calculators are not yet available.</p>
          </div>
          {footerNavigation.map((group) => (
            <nav key={group.id} aria-labelledby={`footer-${group.id}`}>
              <Eyebrow id={`footer-${group.id}`} className="mb-3 px-3">{group.label}</Eyebrow>
              <NavigationList items={group.items} />
            </nav>
          ))}
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-2 border-t border-border-strong pt-4 text-xs text-muted">
          <p>Knowledge · Underwriting · Financial modeling</p>
          <a href="#main-content" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent">Back to content ↑</a>
        </div>
      </Container>
    </footer>
  );
}
