# SmartSite

SmartSite is a portable, field-driven, section-first website starter built with Next.js, Payload CMS, MongoDB, Tailwind CSS, and GSAP.

## Start Here

1. [AGENTS.md](AGENTS.md)
2. [docs/index.md](docs/index.md)
3. [docs/DOCS.md](docs/DOCS.md)
4. [docs/PRODUCT.md](docs/PRODUCT.md)
5. [docs/product-specs/hosting-modes.md](docs/product-specs/hosting-modes.md)
6. [docs/workflows/index.md](docs/workflows/index.md)

## What This File Is

This README is now a lightweight entrypoint for humans and GitHub.

- The docs harness owns the canonical operating and engineering guidance.
- The preserved longform manuscript lives at [docs/references/source-manuscript-readme.md](docs/references/source-manuscript-readme.md).
- Legacy material lives under [docs/references/legacy/index.md](docs/references/legacy/index.md).

Agents should stop here and move into the docs harness. This file is not the canonical task-retrieval surface.

## Quick Rules

- Treat this folder as if it is its own repository.
- Identify the hosting mode before deploy, backup, restore, preview, or recovery work.
- Use hosted workflows for managed hosting.
- Use `pnpm self-hosted:run -- ...` only for the self-hosted Mongo profile.

## Core Commands

```bash
pnpm install
pnpm dev
pnpm lint
pnpm type-check
pnpm build
```

Self-hosted operator commands are documented in [docs/workflows/deployment.md](docs/workflows/deployment.md).
