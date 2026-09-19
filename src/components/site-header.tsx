import Link from "next/link";
import { primaryNavigation } from "@/config/navigation";
import { Container } from "@/components/ui/primitives";
import { NavigationList } from "@/components/navigation/navigation-list";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";

export function SiteHeader() {
  return (
    <header className="border-t-4 border-t-accent border-b border-b-border bg-elevated">
      <Container className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4 py-5">
        <Link id="site-brand" href="/" aria-label="CRE Platform home" className="inline-flex min-h-11 items-center gap-3 rounded-control">
          <span aria-hidden="true" className="border-r border-border-strong pr-3 text-2xl font-bold tracking-tight">CRE</span>
          <span className="text-sm font-semibold leading-tight">Knowledge<br />Platform</span>
        </Link>
        <nav aria-label="Primary" className="hidden lg:block">
          <NavigationList items={primaryNavigation} horizontal />
        </nav>
        <MobileNavigation><NavigationList items={primaryNavigation} /></MobileNavigation>
      </Container>
    </header>
  );
}
