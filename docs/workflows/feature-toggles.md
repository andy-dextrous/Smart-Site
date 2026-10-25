# Feature choices

Browser-safe presentation settings live in `src/site.config.ts`: dark mode, public locale/search presentation, sitemaps, animations, breadcrumbs and image quality. Verify the rendered result after changes.

Server features use normal Payload configuration. Register collections/plugins in `src/payload.config.ts`; configure localization, storage, email and admin options in their native owners. [Configuration](../engineering/configuration-system.md) explains the boundaries and examples.

MCP is enabled by the explicit `smartsiteMcp({ enabled: true })` plugin option. Set it to false to remove the endpoint while preserving stored identities, keys and receipts. Each content collection/global separately opts in with `custom.smartsite.mcp: true`; existing Payload access and key grants still apply. Private/internal targets cannot be exposed through metadata.
