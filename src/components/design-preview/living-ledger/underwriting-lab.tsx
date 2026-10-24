"use client";

import { Fragment, useState, type ReactNode } from "react";
import { BuildingDiagram } from "./building-diagram";
import { VisualComposition } from "./visual-composition";
import { calculateIllustration, compareToBaseline, INITIAL_ASSUMPTIONS, INPUTS, parseDraft, UNITS, type DraftAssumptions, type AssumptionKey } from "./model";
import styles from "./living-ledger.module.css";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const money = (value: number) => usd.format(value);
const signedMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0, signDisplay: "exceptZero" }).format(Math.abs(value) < .5 ? 0 : value);
const signedPercent = (value: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, signDisplay: "exceptZero" }).format(Math.abs(value) < .005 ? 0 : value);
const driverLessons: Record<AssumptionKey, string> = {
  monthlyRent: "Rent sets potential income. Higher rent raises income and value when the other assumptions stay fixed.",
  vacancyPercent: "Vacancy removes potential rent before expenses. Higher vacancy reduces effective income, NOI, and value.",
  expensePercent: "Expenses consume effective rental income. A higher expense ratio leaves less NOI to capitalize.",
  capRatePercent: "Cap rate translates NOI into value. A higher cap rate lowers value for the same NOI; it does not change income.",
};
const compactMoney = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 }).format(value);
const initialDraft = (): DraftAssumptions => ({
  monthlyRent: String(INITIAL_ASSUMPTIONS.monthlyRent), vacancyPercent: String(INITIAL_ASSUMPTIONS.vacancyPercent),
  expensePercent: String(INITIAL_ASSUMPTIONS.expensePercent), capRatePercent: String(INITIAL_ASSUMPTIONS.capRatePercent),
});

/** Present an already-formatted value; retain one coherent accessible string. */
export function CurrencyText({ formatted }: { formatted: string }) {
  if (!formatted.includes(",")) return formatted;
  const groups = formatted.match(/[^,]+,?/g) ?? [formatted];
  return <span className={styles.currencyText}>
    <span className={styles.srOnly}>{formatted}</span>
    <span aria-hidden="true">{groups.map((group, index) => <Fragment key={index}>
      {index > 0 && <wbr />}
      <span className={styles.currencyGroup}>{group}</span>
    </Fragment>)}</span>
  </span>;
}

export function UnderwritingLab({ photography, compactMobile = false }: { photography?: ReactNode; compactMobile?: boolean } = {}) {
  const [draft, setDraft] = useState(initialDraft);
  const { values, errors } = parseDraft(draft);
  const result = values ? calculateIllustration(values) : null;
  const comparison = values ? compareToBaseline(values) : null;
  const baselineValue = calculateIllustration(INITIAL_ASSUMPTIONS).propertyValue;
  const update = (key: AssumptionKey, value: string) => setDraft(previous => ({ ...previous, [key]: value }));
  const allocations = result ? [
    { label: "Illustrative NOI", value: result.noi, color: "var(--color-foreground)" },
    { label: "Operating expenses", value: result.operatingExpenses, color: "var(--color-steel)" },
    { label: "Vacancy allowance", value: result.vacancyAllowance, color: "var(--color-copper-text)" },
  ] : [];
  const circumference = 2 * Math.PI * 64;
  let offset = 0;

  return <section id="property-lab" aria-labelledby="lab-title" className={`${styles.lab}${compactMobile ? ` ${styles.compactLab}` : ""}`}>
    <noscript><p className={styles.caveat}>JavaScript is required to recalculate this illustration. The initial example, formulas, and research links remain readable.</p></noscript>
    <div className={styles.labHeading}>
      <div><p className={styles.eyebrow}>01 / Illustrative Underwriting Model</p><h2 id="lab-title">One property. Four assumptions.</h2><p>A fictional 100-unit multifamily property. Change an assumption and follow its effect.</p></div>
      <span className={styles.studyTag}>Fictional / Educational only</span>
    </div>
    <div className={styles.mobileReadout} aria-hidden="true"><span>Annual NOI<strong>{result ? compactMoney(result.noi) : "—"}</strong></span><span>Illustrative value<strong>{result ? compactMoney(result.propertyValue) : "—"}</strong></span></div>
    {compactMobile && <a href="#assumption-monthlyRent" className={styles.adjustShortcut}>Adjust assumptions <span aria-hidden="true">↓</span></a>}
    <VisualComposition photography={photography} compactMobile={compactMobile} diagram={<BuildingDiagram assumptions={values} result={result} renderCurrency={formatted => <CurrencyText formatted={formatted} />} />} />
    <div className={styles.labGrid}>
      <div className={styles.controls}>
        <fieldset>
          <legend>Set the assumptions</legend>
          <p className={styles.controlIntro}>Annual model · USD · {UNITS} units fixed</p>
          {INPUTS.map(input => {
            const error = errors[input.key];
            const numeric = Number(draft[input.key]);
            const sliderValue = error || !Number.isFinite(numeric) ? input.min : Math.min(input.max, Math.max(input.min, Math.round((numeric - input.min) / input.step) * input.step + input.min));
            return <div key={input.key} className={styles.control}>
              <label htmlFor={`assumption-${input.key}`}>{input.label}</label>
              <div className={styles.numberField}><span aria-hidden="true">{input.unit}</span>
                <input id={`assumption-${input.key}`} type="number" min={input.min} max={input.max} step="any" inputMode="decimal"
                  value={draft[input.key]} onChange={event => update(input.key, event.target.value)}
                  aria-invalid={!!error} aria-describedby={`help-${input.key}${error ? ` error-${input.key}` : ""}`} />
              </div>
              <label className={styles.srOnly} htmlFor={`slider-${input.key}`}>{input.label} slider</label>
              <input id={`slider-${input.key}`} className={styles.slider} type="range" min={input.min} max={input.max} step={input.step}
                value={sliderValue}
                aria-valuetext={input.unit === "USD" ? money(sliderValue) : `${Number(sliderValue.toFixed(2))}%`}
                aria-describedby={`help-${input.key}`} onChange={event => update(input.key, event.target.value)} />
              <p id={`help-${input.key}`} className={styles.help}>{input.help}</p>
              {error && <p id={`error-${input.key}`} className={styles.error}>{error}</p>}
            </div>;
          })}
        </fieldset>
        <button type="button" className={styles.reset} onClick={() => setDraft(initialDraft())}>Reset to baseline <span aria-hidden="true">↺</span></button>
      </div>
      <div className={styles.results}>
        <div className={styles.valueCard}>
          <p id="illustrative-value-label" className={styles.eyebrow}>Illustrative property value</p>
          <output id="illustrative-value" aria-labelledby="illustrative-value-label" aria-live="off" htmlFor={INPUTS.map(input => `assumption-${input.key}`).join(" ")} className={styles.value}><CurrencyText formatted={result ? money(result.propertyValue) : "—"} /></output>
          <p>{values ? `${money(result!.noi)} annual NOI ÷ ${values.capRatePercent}% cap rate` : "Enter valid assumptions to calculate."}</p>
          <dl className={styles.comparison}>
            <div><dt>Baseline value</dt><dd><CurrencyText formatted={money(baselineValue)} /></dd></div>
            <div><dt>Current vs. baseline</dt><dd id="value-change">{comparison ? <><CurrencyText formatted={signedMoney(comparison.dollarChange)} /> ({signedPercent(comparison.percentChange)}%)</> : "—"}</dd></div>
          </dl>
          <span className={styles.valueFootnote}>Income-capitalization illustration · Not an appraisal</span>
        </div>
        <div className={styles.incomeGrid}>
          {[
            ["Gross potential rent", result?.grossPotentialRent, "gross-rent"],
            ["Effective rental income", result?.effectiveRentalIncome, "effective-income"],
            ["Illustrative NOI", result?.noi, "illustrative-noi"],
          ].map(([label, value, id]) => <div key={String(id)}><p id={`${id}-label`}>{label}</p><output id={String(id)} aria-labelledby={`${id}-label`} aria-live="off"><CurrencyText formatted={typeof value === "number" ? money(value) : "—"} /></output><span>USD / year</span></div>)}
        </div>
        <details className={styles.allocationDisclosure}><summary>See the full income allocation</summary><figure className={styles.chart}>
          <figcaption><p className={styles.eyebrow}>Follow the dollars / USD per year</p><h3>Where the rent goes</h3><p>Each segment represents a share of annual gross potential rental dollars, not a count of units. Vacancy allowance is unearned rent; the remainder funds expenses and NOI.</p></figcaption>
          <div className={styles.chartBody}>
            <svg viewBox="0 0 180 180" role="img" aria-labelledby="income-chart-title income-chart-description" className={styles.donut}>
              <title id="income-chart-title">Annual rent allocation</title>
              <desc id="income-chart-description">{result ? allocations.map(item => `${item.label}: ${money(item.value)}`).join(". ") : "Chart unavailable until all assumptions are valid."}</desc>
              <circle cx="90" cy="90" r="64" fill="none" stroke="var(--color-surface)" strokeWidth="22" />
              {allocations.map(item => {
                const length = result!.grossPotentialRent > 0 ? item.value / result!.grossPotentialRent * circumference : 0;
                const start = offset; offset += length;
                return <circle key={item.label} cx="90" cy="90" r="64" fill="none" stroke={item.color} strokeWidth="22" strokeDasharray={`${length} ${circumference}`} strokeDashoffset={-start} transform="rotate(-90 90 90)" />;
              })}
              <text x="90" y="88" textAnchor="middle" className={styles.donutNumber}>{result ? compactMoney(result.grossPotentialRent) : "—"}</text><text x="90" y="108" textAnchor="middle" className={styles.donutLabel}>USD / YEAR</text>
            </svg>
            <ul className={styles.legend}>
              {allocations.map(item => <li key={item.label}><span className={styles.legendDot} style={{ backgroundColor: item.color }} aria-hidden="true" /><span>{item.label}</span><strong><CurrencyText formatted={money(item.value)} /></strong></li>)}
              {!result && <li>Complete the assumptions to see the income allocation.</li>}
            </ul>
          </div>
        </figure></details>
        <p role="status" aria-live="polite" aria-atomic="true" className={styles.srOnly}>{result && comparison ? `Updated illustration. Annual NOI ${money(result.noi)}. Property value ${money(result.propertyValue)}. Change from baseline ${signedMoney(comparison.dollarChange)}, ${signedPercent(comparison.percentChange)} percent.` : "Calculation unavailable. Check the assumption errors."}</p>
      </div>
    </div>
    <section className={styles.drivers} aria-labelledby="drivers-title">
      <div><p className={styles.eyebrow}>Read the change</p><h3 id="drivers-title">How Assumptions Affect Illustrative Value</h3><p>Each effect below changes one assumption from the original baseline, holding the other three fixed. Effects interact; do not add these dollar changes together.</p></div>
      <ul>{INPUTS.map(input => {
        const driver = comparison?.drivers.find(item => item.key === input.key);
        return <li key={input.key}><h4>{input.label}</h4><p>{driverLessons[input.key]}</p><p className={styles.driverChange} id={`driver-${input.key}`}>{driver ? driver.difference === 0 ? "Unchanged from baseline." : `${input.unit === "USD" ? signedMoney(driver.difference) + " / unit / month" : signedPercent(driver.difference) + " percentage points"} vs. baseline. Isolated value effect: ${signedMoney(driver.isolatedValueChange)}.` : "Enter valid assumptions to compare."}</p></li>;
      })}</ul>
    </section>
    <details className={styles.formulas} open>
      <summary>Open the ledger <span>Formulas &amp; current assumptions</span></summary>
      <p>Fixed baseline: $1,500 monthly rent per unit, 5% vacancy, 40% operating expenses, and 5.5% cap rate. Value change = current value − baseline value. Percentage change = value change ÷ baseline value × 100.</p>
      <ol>
        <li><strong>Gross potential rental income</strong><span>Units × monthly rent × 12</span><code>{values && result ? `100 × ${money(values.monthlyRent)} × 12 = ${money(result.grossPotentialRent)}` : "Awaiting valid assumptions"}</code></li>
        <li><strong>Effective rental income</strong><span>Gross potential rent × (1 − vacancy rate)</span><code>{values && result ? `${money(result.grossPotentialRent)} × (1 − ${values.vacancyPercent / 100}) = ${money(result.effectiveRentalIncome)}` : "Awaiting valid assumptions"}</code></li>
        <li><strong>Illustrative NOI</strong><span>Effective rental income × (1 − operating expense ratio)</span><code>{values && result ? `${money(result.effectiveRentalIncome)} × (1 − ${values.expensePercent / 100}) = ${money(result.noi)}` : "Awaiting valid assumptions"}</code></li>
        <li><strong>Illustrative property value</strong><span>Illustrative NOI ÷ capitalization rate</span><code>{values && result ? `${money(result.noi)} ÷ ${values.capRatePercent / 100} = ${money(result.propertyValue)}` : "Awaiting valid assumptions"}</code></li>
      </ol>
      <p>Percentages are converted to decimals. Calculations use full precision; displayed USD amounts are rounded to whole dollars.</p>
    </details>
    <aside className={styles.caveat} aria-label="Model limitations"><strong>A teaching model, not a lending decision.</strong><p>This fictional example assumes one rent for all units and excludes other income, concessions, bad debt, lease timing, capital expenditures, replacement reserves, financing, and taxes on investment returns. The operating expense ratio is applied to effective rental income. It is not Fannie Mae, Freddie Mac, or lender underwriting, an appraisal, or an investment recommendation.</p></aside>
  </section>;
}
