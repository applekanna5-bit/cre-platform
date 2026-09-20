import Link from "next/link";
import { primaryNavigation } from "@/config/navigation";
import { Container } from "@/components/ui/primitives";
import { NavigationList } from "@/components/navigation/navigation-list";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";

export function SiteHeader() {
  return (
    <header className="border-t-4 border-t-analytical border-b border-b-border bg-elevated">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5">
        <Link id="site-brand" href="/" aria-label="CRE Platform home" className="inline-flex min-h-11 flex-wrap items-center gap-3 rounded-control">
          <span aria-hidden="true" className="shrink-0 font-editorial text-[2.5rem] leading-none tracking-[-0.06em] text-accent-strong">CRE</span>
          <span className="border-l-[3px] border-copper pl-3 text-xs font-semibold uppercase leading-relaxed tracking-[0.12em]">Knowledge<br />Platform</span>
        </Link>
        <nav aria-label="Primary" className="hidden lg:block">
          <NavigationList items={primaryNavigation} horizontal />
        </nav>
        <MobileNavigation><NavigationList items={primaryNavigation} /></MobileNavigation>
      </Container>
    </header>
  );
}
