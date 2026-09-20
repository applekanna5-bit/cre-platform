import { footerNavigation } from "@/config/navigation";
import { NavigationList } from "@/components/navigation/navigation-list";
import { Container, Eyebrow } from "@/components/ui/primitives";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface py-10">
      <Container>
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="text-lg font-semibold tracking-tight">CRE Knowledge Platform</p>
            <p className="mt-3 max-w-[30ch] text-sm text-muted">Commercial real estate knowledge, analysis, and tools.</p>
            <p className="mt-4 text-xs text-muted">Guides and tools coming soon.</p>
          </div>
          {footerNavigation.map((group) => (
            <nav key={group.id} aria-labelledby={`footer-${group.id}`}>
              <Eyebrow id={`footer-${group.id}`} className="mb-3 px-3">{group.label}</Eyebrow>
              <NavigationList items={group.items} />
            </nav>
          ))}
        </div>
        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-border pt-5 text-xs text-muted">
          <p>Knowledge · Underwriting · Financial modeling</p>
          <a href="#main-content" className="inline-flex min-h-11 items-center underline underline-offset-4 hover:text-accent">Back to content ↑</a>
        </div>
      </Container>
    </footer>
  );
}
