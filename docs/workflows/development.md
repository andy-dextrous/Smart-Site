# Development

Start at [getting started](getting-started.md), then choose a local skill from the [index](../index.md). User-facing content edits use [Content MCP](content-mcp.md). Code, component and schema changes use normal files, generated types and an actual browser. There is no global SmartSite CLI.

Use the project's pinned Node and pnpm. `pnpm install --frozen-lockfile` is reproducible. Start or resume the owned local runtime with `pnpm bootstrap`, inspect it with `pnpm doctor`, and stop it with `pnpm local:stop` (data is retained). Do not kill unrelated ports/processes. The private `.smartsite/local/state.json` records exact ports and ownership.

Before substantial work, record the agreed brief/design and a living execution plan. Change the smallest relevant source files. After schema changes run `pnpm generate:types` and `pnpm generate:importmap` against the intended local environment. Run `pnpm type-check`, `pnpm lint`, `pnpm test:unit` and relevant integration tests. Use `pnpm test:integration` and `pnpm test:build` only in a clean disposable copy without `.env` or `.smartsite`; they create and tear down their own fixtures. Integration and build fixtures must not run concurrently in one folder.

See [standalone verification](../../tests/README.md) for startup-interruption, transfer, browser and Docker upgrade suites.

For acceptance, inspect the actual application and CMS in an external browser, including narrow screens, keyboard interaction and relevant themes. A screenshot of a mock component is not app acceptance. Save changes as drafts unless publication is within the request. Missing browser access remains an explicit limitation.

Do not commit `.env`, `.smartsite`, client credentials, uploaded media, test traces or personal agent settings. A copied project must omit those files so it receives a new local identity. Source changes and content changes are separate: deploying code must preserve live data.
