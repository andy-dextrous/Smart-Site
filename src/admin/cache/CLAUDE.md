# Cache & Revalidation – Claude Guide

The cache system in `src/admin/cache/` underpins Smart Site’s O(1) lookups and surgical invalidation strategy. Keep this guide synchronized with the README’s **Routing & Caching** section.

---
## 1. Responsibilities
- **Fetch helpers** – `getByURI`, `getCollection`, `getGlobal`, `getDocument`, `getPostsWithPagination` are the supported read APIs for the frontend.
- **Revalidation** – `revalidateDocument`, `batchRevalidate`, and supporting detectors compute the smallest set of tags to purge after changes.
- **Navigation awareness** – detects when header/footer data changes to avoid unnecessary invalidation.
- **Template + archive awareness** – tracks dependencies across collections, archives, and templates.

---
## 2. Module Map
```
cache/
├── cache.ts                # Public read API
├── revalidation.ts         # Entry point for invalidation
├── change-detection.ts     # Diffing logic (fields, sections, references)
├── navigation-detection.ts # Header/footer impact analysis
├── tags.ts                 # Tag builders for cache + sitemaps
└── README.md               # Extended documentation
```

All public imports must come from `@/admin/cache`. Never call Payload directly from frontend routes; doing so bypasses the routing engine and breaks cache consistency.

---
## 3. Usage Patterns
```typescript
import { cache, revalidateDocument } from "@/admin/cache"

// ✅ Fetch by URI in the universal page route
const result = await cache.getByURI(requestedURI)
if (!result?.document) return notFound()

// ✅ Fetch collections with filters
const posts = await cache.getCollection("posts", {
  where: { _status: { equals: "published" } },
  sort: "-publishedDate",
  limit: 6,
})

// ✅ Trigger surgical invalidation in hooks
await revalidateDocument({
  collection: "pages",
  doc,
  previousDoc,
  action: operation === "create" ? "create" : "update",
})
```

---
## 4. High-Risk Files
- `cache.ts` – alters global fetching behaviour; test pages, globals, archives, and drafts before merging.
- `revalidation.ts` – incorrect tagging causes either stale content or excessive cache clears.
- `change-detection.ts` – determines what actually changed; mistakes here leave pages untouched.
- `tags.ts` – keep tag formats in sync with routing and sitemaps (e.g., `uri:/about`, `collection:pages`, `sitemap:posts`).

---
## 5. Testing Checklist
- Publishing, unpublishing, and updating documents revalidate only the affected URIs.
- Navigation changes invalidate header/footer caches and dependent pages.
- Archive slug changes cascade correctly and update sitemap tags.
- `batchRevalidate` deduplicates tags properly when processing multiple operations.

Keep this guide and the README aligned. Update both whenever cache behaviour changes.
