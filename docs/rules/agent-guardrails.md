# Agent Guardrails

## Always assume

- The current hosting mode must be identified before deploy, backup, restore, preview, or recovery actions.
- The protected admin layer is not a casual customization surface for site-level changes.
- Seed, restore, and other database-writing actions require explicit user approval every time.

## Never do these casually

- do not overwrite `.env`
- do not rerun bootstrap or `smartsite init` on an already configured project without explicit user approval
- do not run seed commands without explicit user approval
- do not seed preview or production
- do not rewrite, restore, or overwrite a non-local database without explicit user approval
- do not restore production without a fresh backup
- do not improvise around the self-hosted command surface
- do not start active task retrieval from `README.md`, `docs/references/`, or `docs/references/legacy/`

## Seeding rule

- Treat seeding as a one-time bootstrap action for a fresh local database unless the user explicitly says otherwise.
- Always warn that seeding can overwrite or replace existing content before proposing or running it.
- If the database already contains meaningful content, stop and get confirmation before any seed, restore, or database reset action.
- SmartSite local seed flows verify that the running site matches the current project before they write data.
- Erasing existing data during seed is a separate explicit choice and requires destructive confirmation; additive seeding should remain possible when the user does not want a wipe.
- SmartSite local seed flows verify that the running site matches the current project before they seed.

## Bootstrap rule

- Treat `.env` plus a working local install as evidence that bootstrap has already been completed.
- Prefer manual edits to the existing configuration over rerunning bootstrap.
- Use `smartsite-deployment.json` to decide whether the site should be operated as self-hosted.
