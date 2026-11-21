const stagingOrigin = "https://darkseagreen-termite-651622.hostingersite.com";

export function feedbackStaging(env: Record<string, string | undefined>) {
  if (env.CRE_FEEDBACK_STAGE !== "enabled" || env.SITE_ENV !== "staging" ||
      env.SITE_INDEXING_ENABLED !== "false" || env.PREVIEW_ACCESS_MODE !== "private" ||
      env.APP_BASE_URL !== stagingOrigin || env.FEEDBACK_DB_NAME !== "u926782974_crefb_stage" ||
      env.FEEDBACK_DB_USER !== "u926782974_crefb_app" || env.FEEDBACK_DB_HOST !== "127.0.0.1" ||
      env.FEEDBACK_TRUSTED_PROXY_VERIFIED !== "true") return null;

  const addressHeader = env.FEEDBACK_CLIENT_IP_HEADER;
  const hmacKey = env.FEEDBACK_HMAC_KEY;
  const secret = env.AUTH0_SECRET;
  if (!addressHeader || !/^[a-z0-9-]+$/.test(addressHeader) ||
      !hmacKey || !/^[0-9a-f]{64}$/i.test(hmacKey) ||
      !secret || !/^[0-9a-f]{64}$/i.test(secret) || secret.toLowerCase() === hmacKey.toLowerCase() ||
      !env.FEEDBACK_DB_PASSWORD || !env.AUTH0_CLIENT_ID || !env.AUTH0_CLIENT_SECRET ||
      !env.AUTH0_DOMAIN || !/^[a-z0-9][a-z0-9.-]*\.auth0\.com$/i.test(env.AUTH0_DOMAIN) ||
      !env.FEEDBACK_OWNER_SUBJECT) return null;

  return {
    origin: stagingOrigin, addressHeader, hmacKey, secret, password: env.FEEDBACK_DB_PASSWORD,
    domain: env.AUTH0_DOMAIN, clientId: env.AUTH0_CLIENT_ID, clientSecret: env.AUTH0_CLIENT_SECRET,
    ownerSubject: env.FEEDBACK_OWNER_SUBJECT,
  };
}

export const privateFeedbackHeaders = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "Referrer-Policy": "no-referrer",
};
