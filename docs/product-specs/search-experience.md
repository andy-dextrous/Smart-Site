# Search Experience

The preserved search-experience guidance from the source manuscript is reproduced below.


Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## Search Experience

### Feature Overview

- **Payload Search Plugin**: The starter wires `@payloadcms/plugin-search` through `src/admin/payload/plugins/index.ts`. It syncs every front-end collection and maintains a dedicated `search` collection that the frontend queries.
- **Config-driven toggle**: Enable or disable search (and choose modal/page/hybrid modes) from `src/smartsite.config.ts`. The feature integrates with the navigation components, the `/search` results page, and the command palette.
- **Realtime command palette**: A client-side modal (⌘/Ctrl + K) fetches results from `/api/search?q=…` and runs lightweight fuzzy scoring before grouping by collection label.
- **Server-rendered results page**: `/search` swaps between an SEO-friendly results screen or redirects to the command palette depending on the configured mode.

### Data Flow

1. **Index population**  
   - When a document is created or updated in a front-end collection, the search plugin’s `beforeSyncWithSearch` hook flattens key metadata (slug, URI, meta fields, categories) and populates the search record.  
   - `searchText` accumulates all relevant terms so the frontend can perform case-insensitive `contains` queries without a heavy database index.

2. **Fetching results**  
   - Server requests use `getSearchResults` (`src/admin/data/search.ts`), which calls the universal cache helper (`cache.getCollectionWithPagination`) to query the `search` collection with `contains` filters.  
   - The API route (`src/app/(frontend)/api/search/route.ts`) returns JSON for the command palette, and the `/search/page.tsx` renders the same data on the server.

3. **Frontend rendering**  
   - The command palette (`src/components/search/search-dialog.tsx`) manages modal state, debounces input, fetches JSON, and groups results by collection label.  
   - The classic results page uses the same helper but renders cards with pagination and search form controls.

### Configuration

```ts
// src/smartsite.config.ts
features: {
  search: {
    enabled: true,
    mode: "hybrid", // "page" | "modal" | "hybrid"
  },
}
```

- `enabled`: toggles the entire search stack. When `false`, the plugin isn’t registered, navigation hides search affordances, and the `/search` route returns 404.
- `mode`:  
  - `page` – only the server-rendered results page is available.  
  - `modal` – only the command palette is exposed.  
  - `hybrid` – both are available; the palette offers a “View all results” action.

### Maintenance & Troubleshooting
