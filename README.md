# SmartSite

A standalone website-building kit with Next.js, Payload CMS, native MCP content access and local Codex/Claude skills.

Open this project in your coding agent and say **“Set up this site, then help me build my website.”** The agent reads [AGENTS.md](AGENTS.md) or [CLAUDE.md](CLAUDE.md), prepares local development, and uses the [documentation](docs/index.md). No global SmartSite CLI or hosted AI account is needed.

The pinned Node/pnpm versions and an installed MongoDB 8 binary are prerequisites. See [getting started](docs/workflows/getting-started.md) for setup, private state, client trust and supported-platform limits. The app owns its database and preview processes; other local sites remain independent.

For maintainers: frozen install, `pnpm bootstrap`, `pnpm doctor`, `pnpm type-check`, `pnpm lint`, `pnpm test:unit`. Integration/build/transfer fixtures run only in clean disposable copies, as explained in [development](docs/workflows/development.md). Read [first launch](docs/workflows/first-launch.md) before moving local content to a destination.
