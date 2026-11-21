export const categories = ["Correction", "Question", "Topic suggestion", "Site issue", "Other"] as const;
export const specializations = ["Underwriting", "Property Types", "Financing & Capital Markets", "Servicing", "Other"] as const;
export const statuses = ["New", "Under Review", "Accepted", "Resolved", "Closed"] as const;

export const limits = { message: 4000, sourceUrl: 2048, name: 100, email: 254, note: 4000 } as const;
export type Status = typeof statuses[number];
export type Feedback = {
  category: typeof categories[number];
  message: string;
  specialization: typeof specializations[number] | null;
  sourceUrl: string | null;
  name: string | null;
  email: string | null;
};
export type FeedbackErrors = Partial<Record<keyof Feedback, string>>;
export type SubmitResult =
  | { kind: "saved" }
  | { kind: "invalid"; errors: FeedbackErrors }
  | { kind: "unavailable" | "rejected" | "limited" | "conflict" };
