# Agent Guardrails

## Always assume

- SmartSite is being operated as a standalone starter repository.
- The current hosting mode must be identified before deploy, backup, restore, preview, or recovery actions.
- The protected admin layer is not a casual customization surface for downstream sites.

## Never do these casually

- do not overwrite `.env`
- do not seed production
- do not restore production without a fresh backup
- do not treat root monorepo workflows as if they were starter-local workflows
- do not improvise around the self-hosted command surface
- do not start active task retrieval from `README.md`, `docs/references/`, or `docs/references/legacy/`
