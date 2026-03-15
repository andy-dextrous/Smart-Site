# Hosting Modes

SmartSite supports two first-class deployment shapes:

- hosted Mongo plus managed hosting
- self-hosted Mongo appliance

## Mandatory detection rule

Before taking operational action, decide which hosting mode you are in. Do not choose deploy, backup, restore, preview, or recovery commands until that decision is explicit.

## Hosted

Hosted means:

- MongoDB Atlas or another managed MongoDB service
- a Node-compatible host such as Vercel
- platform-managed environment variables and build pipeline

Treat the site as hosted when:

- there is no `smartsite-deployment.json`
- `.smartsite-self-hosted/` may be absent, or may contain stale/generated state left from prior local work
- the deploy flow is driven by the hosting platform rather than the self-hosted command surface

`smartsite-deployment.json` is the deciding source of truth. Do not treat hidden generated self-hosted state by itself as proof that the site should be operated as self-hosted.

Use these docs next:

- [docs/workflows/getting-started.md](../workflows/getting-started.md)
- [docs/workflows/development.md](../workflows/development.md)
- [docs/workflows/deployment.md](../workflows/deployment.md)

## Self-hosted

Self-hosted means:

- Dockerized SmartSite app plus Dockerized MongoDB on a VPS
- `smartsite-deployment.json` is the source of truth
- generated env files and runtime state live under `.smartsite-self-hosted/`
- `pnpm self-hosted:run -- ...` is the operational command surface

Treat the site as self-hosted when:

- `smartsite-deployment.json` exists
- `.smartsite-self-hosted/` exists or is expected to be generated from that manifest
- the workflow refers to `promote`, `preview`, `backup`, `restore`, `rollback`, `probe`, or `status`

Use these docs next:

- [docs/workflows/deployment.md](../workflows/deployment.md)
- [docs/workflows/preview-environments.md](../workflows/preview-environments.md)
- [docs/workflows/troubleshooting.md](../workflows/troubleshooting.md)

## Preview rule

- Hosted preview uses hosted infrastructure.
- Self-hosted preview is optional, uses its own HTTPS URL, its own Mongo data, and should keep indexing disabled.

## Database rule

SmartSite runs on MongoDB in every environment. PostgreSQL drivers remain in the repository for compatibility with legacy tooling, but the canonical configuration sets `DATABASE_PROVIDER=mongoose` and points `DATABASE_URL` at a MongoDB deployment.

## Local development rule

Local development stays on normal MongoDB regardless of deployment shape. Use a separate database name per environment and move content intentionally with `mongodump` and `mongorestore` when promoting data between environments.
