"use client";

import { useId, useRef, useState, type FormEvent } from "react";
import { categories, limits, specializations, type Feedback, type SubmitResult } from "./fields";

const messages = {
  saved: "Thank you. Your feedback was received.",
  invalid: "Check the fields below and try again.",
  unavailable: "Feedback could not be confirmed. Please try again later.",
  rejected: "Feedback could not be submitted. Check your entries and try again.",
  limited: "Too many submissions. Please wait before trying again.",
  conflict: "This submission could not be verified. Review your entries before trying again.",
} as const;

export function FeedbackForm({ submit }: {
  submit: (fields: Record<keyof Feedback, string>, key: string) => Promise<SubmitResult>;
}) {
  const prefix = useId();
  const retry = useRef<{ key: string; payload: string } | null>(null);
  const inFlight = useRef(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const fields = [
    { name: "sourceUrl", label: "Public article or source URL", type: "url", limit: limits.sourceUrl, autoComplete: "off" },
    { name: "name", label: "Name", type: "text", limit: limits.name, autoComplete: "name" },
    { name: "email", label: "Email for follow-up", type: "email", limit: limits.email, autoComplete: "email" },
  ] as const;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setResult(null);
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      category: String(data.get("category") ?? ""), message: String(data.get("message") ?? ""),
      specialization: String(data.get("specialization") ?? ""), sourceUrl: String(data.get("sourceUrl") ?? ""),
      name: String(data.get("name") ?? ""), email: String(data.get("email") ?? ""),
    };
    try {
      const serialized = JSON.stringify(payload);
      if (retry.current?.payload !== serialized) retry.current = { key: crypto.randomUUID(), payload: serialized };
      const response = await submit(payload, retry.current.key);
      setResult(response);
      if (response.kind === "saved") {
        form.reset();
        retry.current = null;
      }
    } catch {
      setResult({ kind: "unavailable" });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const id = (key: string) => `${prefix}-${key}`;
  const errors = result?.kind === "invalid" ? result.errors : {};
  const attrs = (key: keyof Feedback) => ({
    className: "mt-1 block w-full rounded-control border border-border-strong bg-elevated px-3 py-2 text-base min-h-11",
    id: id(key), name: key, "aria-invalid": !!errors[key],
    "aria-describedby": errors[key] ? id(`${key}-error`) : undefined,
  });
  const error = (key: keyof Feedback) => errors[key] && <p className="mt-1 text-warning" id={id(`${key}-error`)}>{errors[key]}</p>;

  return <form className="space-y-4" method="post" onSubmit={handleSubmit} aria-describedby={id("privacy")}>
    <p id={id("privacy")}>Never share confidential borrower, client, employer, or transaction information. Name and email are optional. The site owner reviews submissions and may use your email to follow up. A published correction will describe the change without identifying you.</p>
    <p role="status" aria-atomic="true">{busy ? "Saving feedback…" : result && messages[result.kind]}</p>
    <fieldset className="space-y-4" disabled={busy}>
      <legend>Feedback</legend>
      <div><label htmlFor={id("category")}>Feedback category (required)</label>
        <select {...attrs("category")} required><option value="">Select a category</option>
          {categories.map(category => <option key={category}>{category}</option>)}
        </select>{error("category")}
      </div>
      <div><label htmlFor={id("specialization")}>CRE specialization (optional)</label>
        <select {...attrs("specialization")}><option value="">None selected</option>
          {specializations.map(specialization => <option key={specialization}>{specialization}</option>)}
        </select>{error("specialization")}
      </div>
      <div><label htmlFor={id("message")}>Feedback message (required)</label>
        <textarea {...attrs("message")} required rows={6} maxLength={limits.message} />{error("message")}
      </div>
      {fields.map(field => <div key={field.name}>
        <label htmlFor={id(field.name)}>{field.label} (optional)</label>
        <input {...attrs(field.name)} type={field.type} maxLength={field.limit} autoComplete={field.autoComplete} />{error(field.name)}
      </div>)}
      <button type="submit" className="min-h-11 rounded-control bg-accent px-4 py-2 font-semibold text-on-accent">Send feedback</button>
    </fieldset>
  </form>;
}
