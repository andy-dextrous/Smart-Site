# CMS presentation

`src/components/cms` owns the Payload dashboard’s layout, navigation, widgets and styles. Its `ui` folder contains CMS-specific primitives; the website uses `src/components/ui`. Edit these ordinary components directly.

Native admin metadata and live-preview defaults live in `src/payload/admin.ts`. Collections, globals, access, schema fields, lifecycle hooks, MCP and plugins live under `src/payload`. The server assembly remains `src/payload.config.ts`; URI routing, caching and publication services live in `src/lib`. React hooks remain in `src/hooks`.

There is no protected admin framework or second configuration system. Updates arrive as versioned instructions and reviewed source changes. See [architecture](architecture.md), [configuration](configuration-system.md) and [upgrading](../workflows/upgrading.md).

## Navigation ownership

The active sidebar is `src/components/cms/providers/layout-provider/app-sidebar.tsx`, rendered by the CMS layout provider. Edit its grouping when changing the CMS menu. Dashboard cards have their own grouping in `src/components/cms/dashboard/index.tsx`; icons are shared through `src/components/cms/nav/navIconMap.ts`. The registered legacy `src/components/cms/nav/index.tsx` intentionally returns null because the layout provider supplies navigation. Do not enable a second sidebar as part of a navigation edit.

Website Header/Footer navigation is separate CMS-managed content. Use the content workflow for those menus.
