import { isIP } from "node:net";
import { categories, limits, specializations, type Feedback, type FeedbackErrors } from "./fields";

const controls = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/u;
const keys = new Set(["category", "message", "specialization", "sourceUrl", "name", "email"]);

function publicUrl(value: string): boolean {
  if (!/^https?:\/\//i.test(value) || /[\s\\]/u.test(value)) return false;
  try {
    const url = new URL(value);
    const host = url.hostname.replace(/\.$/, "").replace(/^\[|\]$/g, "");
    return !url.username && !url.password && !isIP(host) && host.includes(".") &&
      !/\.(?:localhost|local|internal|test|invalid|example|onion)$/i.test(host);
  } catch {
    return false;
  }
}

export function validateFeedback(value: unknown): { data: Feedback } | { errors: FeedbackErrors } {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.keys(value).some(key => !keys.has(key))) {
    return { errors: {} };
  }
  const input = value as Record<string, unknown>;
  const errors: FeedbackErrors = {};
  function field(key: keyof Feedback, max: number, required = false): string {
    const raw = Object.hasOwn(input, key) ? input[key] : undefined;
    if (raw === undefined && !required) return "";
    if (typeof raw !== "string" || raw.length > max || controls.test(raw) || (required && !raw.trim())) {
      errors[key] = required ? `Enter a value of up to ${max} characters.` : `Use up to ${max} characters.`;
      return "";
    }
    return raw.trim();
  }
  const category = categories.find(option => option === field("category", 24));
  if (!category) errors.category = "Select a feedback category.";
  const message = field("message", limits.message, true);
  const specialty = field("specialization", 32);
  const specialization = specializations.find(option => option === specialty);
  if (specialty && !specialization) errors.specialization = "Select a listed specialization.";
  const sourceUrl = field("sourceUrl", limits.sourceUrl);
  if (sourceUrl && !publicUrl(sourceUrl)) errors.sourceUrl = "Enter a public HTTP or HTTPS address.";
  const name = field("name", limits.name);
  if (/[\r\n\t]/u.test(name)) errors.name = "Enter your name on one line.";
  const email = field("email", limits.email);
  if (email && !/^[^@\s<>]+@[^@\s<>]+\.[^@\s<>]+$/u.test(email)) errors.email = "Enter an email address for follow-up.";
  if (!category || Object.keys(errors).length) return { errors };
  return { data: { category, message, specialization: specialization ?? null, sourceUrl: sourceUrl || null, name: name || null, email: email || null } };
}
