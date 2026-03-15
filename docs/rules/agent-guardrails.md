# Agent Guardrails

## Always assume

- The current hosting mode must be identified before deploy, backup, restore, preview, or recovery actions.
- The protected admin layer is not a casual customization surface for site-level changes.
- Seed, restore, and other database-writing actions require explicit user approval every time.

## Never do these casually

- do not overwrite `.env`
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
