# Hosting Modes

SmartSite supports two equally valid operating modes:

- hosted
- self-hosted

Neither mode is the "real" product and neither mode is a fallback by default. Always decide the mode first, then stay inside that mode's workflow.

## Mandatory detection rule

Before taking operational action, explicitly decide which mode the site is using. Do not choose deploy, backup, restore, preview, or recovery commands until that decision is clear.

## Hosted

Hosted means:

- MongoDB Atlas or another managed MongoDB service
- a managed Node-compatible host such as Vercel, Netlify, Railway, Render, or App Platform
- build and deploy managed by the hosting platform
- environment variables managed by that platform

Treat the site as hosted when:

- there is no `smartsite-deployment.json`
- deployment is triggered by the hosting platform rather than `pnpm self-hosted:run -- ...`
- the database is remote and managed outside the app host

Bootstrap exception:

- a brand-new repo can still intend to be self-hosted before `smartsite-deployment.json` exists
- if the active task is explicitly creating the self-hosted lane, follow the self-hosted getting-started path rather than routing back to hosted

Hosted next steps:

- [docs/workflows/getting-started.md](../workflows/getting-started.md)
- [docs/workflows/development.md](../workflows/development.md)
- [docs/workflows/deployment.md](../workflows/deployment.md)
- [docs/workflows/preview-environments.md](../workflows/preview-environments.md)

## Self-hosted

Self-hosted means:

- Dockerized SmartSite app
- Dockerized MongoDB owned by the project
- a VPS or similar Linux host running the production stack
- `smartsite-deployment.json` as the source of truth for deployment shape
- `pnpm self-hosted:run -- ...` as the operational command surface

Treat the site as self-hosted when:

- `smartsite-deployment.json` exists and is active
- `.smartsite-self-hosted/` is expected to be generated from that manifest
- the workflow refers to `promote`, `preview`, `backup`, `restore`, `rollback`, `probe`, or `status`

Self-hosted next steps:

- [docs/workflows/getting-started.md](../workflows/getting-started.md)
- [docs/workflows/development.md](../workflows/development.md)
- [docs/workflows/deployment.md](../workflows/deployment.md)
- [docs/workflows/preview-environments.md](../workflows/preview-environments.md)

## The key mental model

The same three concepts exist in both modes:

- code
- build output
- database content

But they move differently:

- code moves through Git
- build output moves through the deployment pipeline
- database content moves only through intentional writes, backups, restores, or migrations

The universal rule is:

- deploys should change code
- deploys should not casually overwrite data

## Local development rule

Local development uses its own MongoDB database in both modes.

- local development should not point at production by default
- production content should only be copied into local intentionally
- local refresh from production should be a one-way backup-and-restore action, not live sync
- self-hosted does not imply a local Docker runtime for everyday work

The normal self-hosted mental model is:

- local development: normal app workflow plus one local Mongo database
- production: Docker on the VPS
- movement between them: `data-pull`, deploy, and `migrate`

## Preview rule

Hosted preview and self-hosted preview are both valid, but they must stay separate from production.

- hosted preview uses separate hosted environment variables and separate Mongo data
- self-hosted preview uses a separate HTTPS URL, separate Mongo data, and separate runtime state
- preview and production should never share the same database

## Database rule

SmartSite runs on MongoDB in every environment. PostgreSQL drivers remain for compatibility with older tooling, but the canonical runtime path uses `DATABASE_PROVIDER=mongoose` and a MongoDB `DATABASE_URL`.

## Agent routing rule

When operating on a SmartSite repo:

1. detect the hosting mode first
2. choose only the docs for that mode
3. avoid mixing hosted and self-hosted commands in the same procedure

Do not infer self-hosted mode from stale hidden files alone. `smartsite-deployment.json` is the deciding signal.
