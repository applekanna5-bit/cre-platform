import Link from "next/link";
import { primaryNavigation } from "@/config/navigation";
import { Container } from "@/components/ui/primitives";
import { NavigationList } from "@/components/navigation/navigation-list";
import { MobileNavigation } from "@/components/navigation/mobile-navigation";
import styles from "./site-header.module.css";

export function SiteHeader() {
  return (
    <header className={styles.header}>
      <Container className={styles.inner}>
        <div className={styles.identity}>
          <Link id="site-brand" href="/" aria-label="CRE Commercial Real Estate Knowledge Platform home" className={styles.brand}>
            <span aria-hidden="true" className={styles.mark}>CRE</span>
            <span className={styles.wordmark}>Commercial Real Estate<br /><span>Knowledge Platform</span></span>
          </Link>
          <p className={styles.identityLine}>Concepts <span aria-hidden="true">|</span> Analysis <span aria-hidden="true">|</span> Underwriting <span aria-hidden="true">|</span> Real-world insight</p>
        </div>
        <nav aria-label="Primary" className={`hidden lg:block ${styles.navigation}`}>
          <NavigationList items={primaryNavigation} horizontal />
        </nav>
        <MobileNavigation><NavigationList items={primaryNavigation} /></MobileNavigation>
      </Container>
    </header>
  );
}
