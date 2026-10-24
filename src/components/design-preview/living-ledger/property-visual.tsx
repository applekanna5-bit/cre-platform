import type { ReactNode } from "react";
import Image from "next/image";
import multifamily from "./assets/living-ledger-multifamily.webp";
import styles from "./living-ledger.module.css";

/** Approved representative architecture, separate from the educational model. */
export function PropertyVisual({ image, loading = "eager" }: { image?: ReactNode; loading?: "eager" | "lazy" }) {
  return <figure className={styles.heroVisual}>
    <div className={styles.propertyFrame}>{image ?? <Image
      src={multifamily}
      alt="Contemporary multifamily apartment building with pale stone facades, glass balconies, wood accents, and landscaped grounds in warm sunlight."
      sizes="(min-width: 1280px) 540px, (min-width: 1024px) 45vw, calc(100vw - 66px)"
      placeholder="blur"
      loading={loading}
      className={styles.propertyImage}
    />}</div>
    <figcaption><span>Representative AI-generated architecture</span><span>Not the fictional 100-unit example</span></figcaption>
  </figure>;
}
