# CMS presentation

`src/admin` owns the Payload dashboard’s layout, navigation, widgets and styles. Edit it directly when changing those parts of the site.

SmartSite 4.0 removes the former protected admin framework. Collections, globals, fields, access, hooks and plugins now have ordinary folders under `src`. Native server configuration lives in `src/payload.config.ts`; website routing and caching live in `src/website`; content MCP lives in `src/mcp`.

Updates arrive as versioned upgrade instructions and reviewed source changes. They do not replace a protected folder. See [architecture](architecture.md), [configuration](configuration-system.md) and the [4.0 upgrade kit](../upgrades/4.0.0/README.md).
