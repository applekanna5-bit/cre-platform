import { feedbackRuntime } from "@/feedback/runtime";
import { privateFeedbackHeaders } from "@/feedback/staging";
import { submissionStore, submitFeedback } from "@/feedback/submission";
import type { SubmitResult } from "@/feedback/fields";

const statusCodes: Record<SubmitResult["kind"], number> = {
  saved: 200, invalid: 422, unavailable: 503, rejected: 400, limited: 429, conflict: 409,
};

export async function POST(request: Request) {
  const env = feedbackRuntime();
  if (!env) return new Response(null, { status: 404, headers: privateFeedbackHeaders });
  const { config, db } = env;
  const result = await submitFeedback(request, {
    origin: config.origin,
    trustedAddress: async incoming => incoming.headers.get(config.addressHeader),
    store: submissionStore(db, Buffer.from(config.hmacKey, "hex")),
  });
  return Response.json(result, { status: statusCodes[result.kind], headers: privateFeedbackHeaders });
}
