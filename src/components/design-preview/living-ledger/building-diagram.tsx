"use client";

import { useId, useState, type ReactNode } from "react";
import { BUILDING_MODES, buildingView, type BuildingMode, type Illustration } from "./building-model";
import type { Assumptions } from "./model";
import styles from "./building-diagram.module.css";

const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);

export function BuildingDiagram({ assumptions, result, renderCurrency }: { assumptions: Assumptions | null; result: Illustration | null; renderCurrency?: (formatted: string) => ReactNode }) {
  const [mode, setMode] = useState<BuildingMode>("Rent");
  const id = useId();
  const view = assumptions && result ? buildingView(mode, assumptions, result) : null;
  const description = view && assumptions && result ? mode === "Rent"
    ? `100 units × ${money(assumptions.monthlyRent)} per month × 12 = ${money(result.grossPotentialRent)} annual gross potential rent.`
    : mode === "Vacancy"
      ? `${assumptions.vacancyPercent}% financial vacancy: ${money(result.vacancyAllowance)} unearned rent; ${money(result.effectiveRentalIncome)} effective income. ${view.highlightedUnits} of 100 conceptual markers highlighted, rounded to the nearest whole marker. Not a rent roll or actual occupancy.`
      : `${assumptions.expensePercent}% of ${money(result.effectiveRentalIncome)} effective income = ${money(result.operatingExpenses)} annual operating expenses; ${money(result.noi)} illustrative NOI. No apartment-level expense allocation.`
    : "Enter valid assumptions in the laboratory. Financial overlays are unavailable.";

  return <section className={styles.diagram} aria-labelledby={`${id}-heading`} data-building-mode={mode}>
    <p className={styles.eyebrow}>Conceptual model / 100 fictional units</p>
    <h3 id={`${id}-heading`}>Read the building.</h3>
    <fieldset className={styles.modes}>
      <legend>Explore the income story</legend>
      {BUILDING_MODES.map(item => <label key={item} className={mode === item ? styles.selected : undefined}>
        <input type="radio" name={`${id}-mode`} value={item} checked={mode === item} onChange={() => setMode(item)} aria-controls={`${id}-story`} />
        <span>{item}</span>
      </label>)}
    </fieldset>
    <svg className={styles.building} viewBox="0 0 600 300" role="img" aria-labelledby={`${id}-svg-title ${id}-svg-description`}>
      <title id={`${id}-svg-title`}>{`Fictional multifamily building — ${mode} study`}</title>
      <desc id={`${id}-svg-description`}>{description}</desc>
      <defs><pattern id={`${id}-vacancy`} width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="var(--color-background)" /><path d="M-2 2 2-2 M0 8 8 0 M6 10 10 6" stroke="var(--color-copper-text)" strokeWidth="2" /></pattern></defs>
      <g aria-hidden="true">
        <path d="M20 269H580 M36 278H564" stroke="var(--color-border-strong)" />
        <path d="M51 72 300 30 549 72V253H51Z" fill="var(--color-surface)" stroke="var(--color-steel)" />
        <path d="M51 72H549 M45 83H555 M51 234H549" fill="none" stroke="var(--color-steel)" strokeWidth="3" />
        <path d="M300 30V72 M283 33V69 M317 33V69" stroke="var(--color-border-strong)" />
        {[0, 1, 2, 3, 4].map(row => <path key={row} d={`M51 ${94 + row * 28}H549`} stroke="var(--color-border)" />)}
        {Array.from({ length: 100 }, (_, index) => {
          const highlighted = mode === "Vacancy" && !!view && index < view.highlightedUnits;
          return <rect key={index} data-conceptual-vacancy={highlighted || undefined} x={65 + index % 20 * 24} y={100 + Math.floor(index / 20) * 28} width="13" height="18"
            fill={highlighted ? `url(#${id}-vacancy)` : mode === "Rent" && view ? "var(--color-copper-text)" : "var(--color-steel)"} stroke="var(--color-foreground)" strokeWidth=".6" />;
        })}
        <path d="M263 253V233H337V253 M278 253V236H322V253 M300 236V253" fill="var(--color-foreground)" stroke="var(--color-steel)" />
        <path d="M249 232H351 M242 229H358" stroke="var(--color-copper-text)" strokeWidth="3" />
        <path d="M278 254 261 275H339L322 254" fill="var(--color-border)" />
        {[30, 570].map(x => <g key={x}><path d={`M${x} 250V223`} stroke="var(--color-steel)" /><circle cx={x} cy="216" r="16" fill="var(--color-steel)" /></g>)}
      </g>
    </svg>
    <div id={`${id}-story`} className={styles.story}>
      <h4>{view?.title ?? "The model needs valid assumptions."}</h4>
      <p>{view?.explanation ?? "Check the assumption fields. No financial result is shown until every input is valid."}</p>
      {view && result && assumptions && <>
        <div className={styles.flow} aria-hidden="true">
          {mode === "Rent" ? <div className={styles.months}>{Array.from({ length: 12 }, (_, i) => <span key={i} />)}</div>
            : <div className={styles.bar}><span style={{ width: `${view.share * 100}%` }} /><span style={{ width: `${(1 - view.share) * 100}%` }} /></div>}
        </div>
        <p className={styles.formula}>{mode === "Rent" ? `100 units × ${money(assumptions.monthlyRent)} / month × 12 months` : mode === "Vacancy" ? `${money(result.grossPotentialRent)} − ${money(result.vacancyAllowance)} vacancy allowance (${assumptions.vacancyPercent}%)` : `${money(result.effectiveRentalIncome)} − ${money(result.operatingExpenses)} operating expenses (${assumptions.expensePercent}%)`}</p>
        <p className={styles.outcome} data-building-outcome><strong>{renderCurrency ? renderCurrency(money(view.amount)) : money(view.amount)}</strong><span>{view.label}</span></p>
        {mode === "Vacancy" && <p className={styles.note}>{view.highlightedUnits} of 100 conceptual markers hatched: vacancy percentage × 100, rounded to the nearest whole marker. Approximate teaching aid only; not a real rent roll or actual physical occupancy. The dollar calculation uses the unrounded vacancy rate.</p>}
        {mode === "Expenses" && <p className={styles.note}>Copper bar: operating expenses. Navy bar: remaining NOI. This is an income split in USD, not a cost allocation to apartments.{result.effectiveRentalIncome === 0 ? " Effective income is $0; both dollar amounts are $0. Bar widths show the assumed ratio only." : ""}</p>}
        {mode === "Vacancy" && <p className={styles.note}>Copper bar: unearned rental dollars. Navy bar: effective rental income.{result.grossPotentialRent === 0 ? " Gross potential rent is $0; bar widths show the assumed ratio only." : ""}</p>}
      </>}
    </div>
    <p className={styles.srOnly} role="status" aria-live="polite" aria-atomic="true">{description}</p>
  </section>;
}
