"use client";

import { useState, type ReactNode } from "react";
import { Container, Section } from "@/components/ui/primitives";
import { UnderwritingModel, initialDraft } from "@/components/design-preview/living-ledger/underwriting-lab";
import { calculateIllustration, INPUTS, parseDraft } from "@/components/design-preview/living-ledger/model";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const rent = INPUTS[0];

export function HomepageUnderwriting({ children, photography }: { children: ReactNode; photography: ReactNode }) {
  const [draft, setDraft] = useState(initialDraft);
  const { values, errors } = parseDraft(draft);
  const result = values ? calculateIllustration(values) : null;
  const hasOtherErrors = !values && !errors.monthlyRent;

  return <>
    <Section id="underwriting-preview" aria-labelledby="underwriting-preview-title" className="scroll-mt-24">
      <Container className="grid gap-6 sm:grid-cols-2">
        <div>
          <h2 id="underwriting-preview-title" className="font-editorial text-3xl">Multifamily Underwriting Preview</h2>
          <p className="mt-2 text-muted">Change the monthly rent for a fictional 100-unit property to see how income and value respond.</p>
          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="block font-semibold" htmlFor="preview-rent">Monthly rent per unit (USD)</label>
              <input className="mt-1 min-h-11 w-40 rounded-control border border-border-strong bg-background px-3" id="preview-rent"
                type="number" inputMode="decimal" min={rent.min} max={rent.max} step="any"
                value={draft.monthlyRent} onChange={event => {
                  const monthlyRent = event.currentTarget.value;
                  setDraft(previous => ({ ...previous, monthlyRent }));
                }} aria-invalid={!!errors.monthlyRent} aria-describedby={errors.monthlyRent ? "preview-rent-error" : undefined} />
            </div>
            <button type="button" className="min-h-11 underline underline-offset-4" onClick={() => setDraft(initialDraft())}>Reset to baseline</button>
          </div>
          {errors.monthlyRent && <p id="preview-rent-error" className="mt-2 text-warning">{errors.monthlyRent}</p>}
        </div>
        <div className="rounded-panel border border-border bg-surface p-5">
          <dl className="grid grid-cols-2 gap-4">
            <div><dt id="preview-noi-label">Annual NOI</dt><dd><output aria-labelledby="preview-noi-label" aria-live="off" className="font-editorial text-2xl">{result ? usd.format(result.noi) : "—"}</output></dd></div>
            <div><dt id="preview-value-label">Illustrative property value</dt><dd><output id="preview-value" aria-labelledby="preview-value-label" aria-live="off" className="font-editorial text-2xl">{result ? usd.format(result.propertyValue) : "—"}</output></dd></div>
          </dl>
          {hasOtherErrors && <p className="mt-3 text-muted">Check the assumptions in the complete model.</p>}
          <a href="#property-lab" className="mt-3 inline-flex min-h-11 items-center text-accent underline underline-offset-4">Open the complete model</a>
        </div>
      </Container>
    </Section>
    {children}
    <UnderwritingModel draft={draft} setDraft={setDraft} photography={photography} complete />
  </>;
}
