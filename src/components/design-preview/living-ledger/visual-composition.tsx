import type { ReactNode } from "react";
import styles from "./living-ledger.module.css";

/** Separate real-world architectural context from the fictional financial diagram. */
export function VisualComposition({ photography, diagram, compactMobile = false }: { photography?: ReactNode; diagram: ReactNode; compactMobile?: boolean }) {
  return <div className={`${styles.visualComposition}${compactMobile ? ` ${styles.compactMobile}` : ""}`}>
    <div className={styles.photoArea}>
      <p className={styles.eyebrow}>Architectural context / Multifamily</p>
      {photography ?? <div className={styles.photoPlaceholder}>Architectural image area</div>}
      <p className={styles.photoDisclaimer}>Architectural context only. This representative AI-generated image illustrates building character, never this fictional example.</p>
    </div>
    <div className={styles.diagramArea}>{diagram}</div>
  </div>;
}
