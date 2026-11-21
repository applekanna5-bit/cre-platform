import { ownerAuthentication } from "@/feedback/auth";
import { submissionStore } from "@/feedback/submission";
import { handleOwnerAuth, ownerAuthError } from "@/feedback/owner-auth-request";

export async function POST(request: Request) {
  try {
    const auth = await ownerAuthentication();
    if (!auth) return ownerAuthError(404);
    return await handleOwnerAuth(request, {
      origin: auth.config.origin, addressHeader: auth.config.addressHeader,
      ownerId: auth.ownerId, db: auth.db, handler: auth.sdk.handler,
      rateLimit: submissionStore(auth.db, Buffer.from(auth.config.hmacKey, "hex"), "owner-auth").rateLimit,
    });
  } catch {
    return ownerAuthError(503);
  }
}
