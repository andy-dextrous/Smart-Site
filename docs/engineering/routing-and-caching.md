# Routing and Caching

SmartSite routes every public page through the catch-all App Router entry at `src/app/(frontend)/[[...uri]]/page.tsx`.

That page delegates to the published URI renderer, which resolves the request through the URI index instead of rebuilding page hierarchy by hand.

Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## Current route contract

- the App Router param is `uri`, not `slug`
- published pages render through `SmartSitePublishedURIRenderer`
- static params are generated from the URI index so prerendering and centralized routing stay aligned

## URI index

The URI index is the source of truth for public URL resolution.

It maps normalized public URIs to documents such as pages, posts, and other frontend collections. When content changes, hooks and routing helpers update that index so the frontend route can resolve the new URI quickly.

## Cache model

SmartSite mostly uses tag-based caching and explicit revalidation, not a single global TTL table.

The important behavior is:

- URI lookups and collection reads are cached behind shared cache helpers
- saves and deletes invalidate the relevant tags through the admin-layer revalidation hooks
- some API routes are explicitly `no-store` or use short revalidation windows when they proxy dynamic services

Do not assume generic durations like “API is always 60 seconds.” Check the route or cache helper when a task depends on exact cache behavior.

## Stale page recovery

When a page looks stale after slug or content changes:

1. confirm the content actually saved
2. confirm the URI index and related hooks ran
3. trigger URI regeneration if needed with `pnpm regenerate-uris`
4. verify the published URI shown in admin
5. if the issue is still unclear, inspect:
   - `src/admin/routing/index-manager.ts`
   - `src/admin/payload/hooks/collections/universal/after-change.ts`
   - `src/admin/cache/revalidation.ts`
   - `src/admin/components/published-uri-renderer.tsx`

For step-by-step operational recovery, also read [docs/workflows/troubleshooting.md](../workflows/troubleshooting.md).
