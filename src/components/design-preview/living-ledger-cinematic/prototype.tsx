import Image from "next/image";
import Link from "next/link";
import { LivingLedgerPrototype } from "../living-ledger/prototype";
import { catalog } from "@/content/.generated";
import { LearningDiscovery } from "./learning-discovery";
import architecture from "../living-ledger/assets/living-ledger-multifamily.webp";
import styles from "./cinematic.module.css";

export function CinematicLedgerPrototype({ presentation = "preview" }: { presentation?: "public" | "preview" } = {}) {
  return <div className={styles.cinematic}>
    {presentation === "preview" && <p className={styles.notice}>Local design study / 4C — The Living Ledger</p>}
    <section className={styles.hero} aria-labelledby="cinematic-title">
      <figure className={styles.photography}>
        <Image src={architecture}
          alt="Contemporary multifamily architecture with glass balconies, pale stone facades, wood accents, and sunlit landscaped grounds."
          sizes="100vw" placeholder="blur" loading="eager" fetchPriority="high"
          className={styles.image} />
        <figcaption className={styles.caption}>Representative AI-generated architecture.<br />Not the fictional 100-unit example.</figcaption>
      </figure>
      <div className={styles.heroInner}>
        <div className={styles.copy}>
          <p className={styles.eyebrow}>The CRE Ledger / CRE Financial Analysis, Explained</p>
          <h1 id="cinematic-title">Understand Property Financials.<br /><em>Analyze Income and Value.</em></h1>
          <p className={styles.deck}>Explore CRE underwriting, one assumption at a time. Follow rent through income, expenses, and value in an interactive property income model.</p>
          <div className={styles.actions}>
            <a href="#property-lab" className={styles.primary}>Explore the Underwriting Model <span aria-hidden="true">↗</span></a>
            <Link href="/library" className={styles.secondary}>Read published research <span aria-hidden="true">→</span></Link>
          </div>
          <p className={styles.method}>100 fictional units / Four connected assumptions</p>
        </div>
      </div>
    </section>
    <div className={styles.laboratory}>
      <LivingLedgerPrototype showIntroduction={false} compactLaboratory discovery={<LearningDiscovery catalog={catalog} />} />
    </div>
  </div>;
}
