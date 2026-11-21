"use client";

import { FeedbackForm } from "./feedback-form";
import type { SubmitResult } from "./fields";

export function StagingFeedbackForm() {
  return <FeedbackForm submit={async (fields, key): Promise<SubmitResult> => {
    const response = await fetch("/api/feedback", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "X-CRE-Feedback": "1", "Idempotency-Key": key },
      body: JSON.stringify(fields),
    });
    if (![200, 400, 409, 422, 429, 503].includes(response.status)) return { kind: "unavailable" };
    return await response.json() as SubmitResult;
  }} />;
}
