# Feature toggles

Use `src/smartsite.config.ts`. Its type and `src/admin/config/defaults.ts` are the schema truth. Search, analytics, dark mode, i18n, sitemaps and animations have their own configuration; inspect the current type before editing. Verify the rendered result, not only compilation.

MCP is enabled by default. Disable it with `mcp: { enabled: false }` if the site does not need content tools. Optional custom content targets use `mcp.collections` and `mcp.globals`; audit access and projection first. Private/auth collections cannot be exposed by this switch. The old AI feature, chat UI and provider-key configuration have been removed.
