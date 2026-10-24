import Link from "next/link";
import { primaryNavigation } from "@/config/navigation";
import { Container } from "@/components/ui/primitives";
import { NavigationList } from "@/components/navigation/navigation-list";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import styles from "./site-header.module.css";
import { SearchForm } from "@/components/search/search-form";
import { catalog } from "@/content/.generated";
import { PreviewMobileNavigation } from "@/components/navigation/preview-mobile-navigation";
import { MobileLearningNavigation } from "@/components/design-preview/living-ledger-cinematic/mobile-learning-navigation";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <div className={styles.identity}>
          <Link id="site-brand" href="/" aria-label="The CRE Ledger home" className={styles.brand}>
            The CRE Ledger<span aria-hidden="true" className={styles.brandRule} />
          </Link>
          <p className={styles.descriptor}>Commercial real estate research &amp; education</p>
        </div>
        <SearchForm id="header-query" label="Site-wide research search" compact />
        <nav aria-label="Primary" className={`hidden lg:block ${styles.navigation}`}>
          <NavigationList items={primaryNavigation} horizontal />
        </nav>
        {process.env.NODE_ENV === "development"
          ? <PreviewMobileNavigation standard={<NavigationList items={primaryNavigation} />} cinematic={<MobileLearningNavigation catalog={catalog} preview />} publicNavigation={<MobileLearningNavigation catalog={catalog} />} />
          : <MobileNavigation><MobileLearningNavigation catalog={catalog} /></MobileNavigation>}
      </Container>
    </header>
  );
}
