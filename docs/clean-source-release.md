# Eight-article public-source release

This export is a separate delivery boundary from the private editorial workspaces. It contains eight approved public article pairs, public support records, reusable engine/UI code, and source-safe regression tests. It has no draft bodies, private editorial records, development content fixtures, or date-preview runner. Historical editorial source remains privately retained outside this export.

Use Node.js 24.x and npm. From root `./`, run `npm ci`, `npm test`, `npm run lint`, and `npm run build`. Output is `.next`. Build dependencies must be installed. The lockfile is retained; no dependency version was changed. The public-content hash inventory must match every content file before generation. Updating that inventory requires a separately reviewed release. Preview/date modes are rejected rather than exposed as public-source commands.

Set SITE_ENV=production, PREVIEW_ACCESS_MODE=public, SITE_PRODUCTION_ORIGIN=https://thecreledger.com, and explicit SITE_INDEXING_ENABLED=false or true for matching build and runtime. Never change a live indexing flag on an old build. No local secret, simulation date, or credential value belongs in Git. Security tests use synthetic in-memory inputs only.

The optional `release:build` and `release:package` tools assemble a separately guarded standalone runtime for acceptance; they do not replace the Git source project. Indexed assembly requires CRE_RELEASE_PROFILE=production-candidate and no preview credentials or simulation flag. Noindex private acceptance uses isolated synthetic runtime credentials. The actual Hostinger launcher/adapter remains unverified. A local successful build is not proof that Hostinger invokes the guarded package entrypoint.

Production auto-deploy is enabled. A production push is a deployment action requiring separate owner authorization. No commit, push, PR, deployment, Hostinger change, or live indexing change is authorized by this source preparation.
