# Private preview access

This release has no public access mode. Every request reaching Next.js Proxy is
denied unless runtime configuration and HTTP Basic credentials are valid.

Runtime configuration:

```text
PREVIEW_ACCESS_MODE=private
PREVIEW_AUTH_USERNAME=<unique printable ASCII username, 1–128 characters; no colon or whitespace>
PREVIEW_AUTH_PASSWORD=<random high-entropy printable ASCII secret, 32–256 characters; no whitespace>
SITE_ENV=development
SITE_INDEXING_ENABLED=false
SITE_PRODUCTION_ORIGIN absent
NODE_ENV=production
```

Use HTTPS. Enter credentials only in the hosting secret/environment interface;
never commit them, put them in URLs, use NEXT_PUBLIC variables, embed them in
next.config, or record Authorization in logs. Build the ordinary publication-only
release without authentication secrets; Proxy reads them on each request at runtime.
Unknown access modes, missing secrets and malformed configuration return generic
503 denial. Missing/malformed/incorrect credentials return a minimal 401 challenge.
There is no login page, session, public-mode toggle or path exclusion. A future
public release requires a separate reviewed application change.

Both admitted and denied responses request private, no-store caching and noindex,
nofollow. Existing SEO snapshot/environment equality checks and publication
eligibility remain independent: authentication does not publish drafts or fixtures.
No application secrets belong in the SEO snapshot.

Basic authentication uses a shared reviewer secret and is not per-user account
authorization. Rotate compromised credentials through an approved runtime change.
Browsers may retain Basic credentials; closing a tab is not reliable logout.
The gate does not implement durable rate limiting. Use a random secret rather
than a human password. Future APIs and Server Actions require their own authorization.

Hostinger must independently demonstrate runtime secret propagation, Authorization
forwarding, Proxy execution, no static/CDN bypass and no caching of authenticated
responses. Duplicate Authorization headers that the serving layer hides cannot be
detected by Proxy; combined duplicates are rejected. Framework normalization
redirects can precede Proxy and must not disclose protected content. A local
next start result does not establish managed-launcher or CDN behavior. There is
no verified non-destructive Hostinger shutdown/rollback capability. Missing secrets
deny requests that reach Proxy; this is not a hosting-layer shutdown mechanism.

Before deployment, run tests, lint, TypeScript and ordinary production build, then
loopback HTTP tests with synthetic credentials. Cover anonymous and authenticated
articles, search, fixtures, missing routes, assets, images, RSC/prefetch, malformed
headers and encoded paths. Inspect final cache headers and client output. The
deployment acceptance checker must be separately reviewed for private-preview
credentials and unauthenticated denial testing before live use; do not place
credentials into its JSON reports. No deployment or live test is authorized here.
