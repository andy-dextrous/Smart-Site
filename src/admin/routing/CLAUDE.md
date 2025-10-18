# Routing Engine – Claude Guide

The routing engine under `src/admin/routing/` powers Smart Site’s URI index, archive relationships, breadcrumbs, and redirect orchestration. It enforces the O(1) resolution guarantee described in the starter README and must stay synchronized with the cache and sitemap subsystems.

---
## 1. Core Responsibilities
- **URI index management** – writes canonical URIs, breadcrumbs, and template bindings into the `uri-index` collection.
- **Hierarchy detection** – tracks parent/child relationships for pages and archives.
- **Dependency cascades** – queues Payload Jobs when parents, archives, or homepages change.
- **Redirect handling** – maintains historical URIs to protect SEO.
- **Validation** – guards against duplicates, circular references, and unsupported depth.

---
## 2. Key Modules
```
routing/
├── collection-config.ts     # Frontend collection metadata (archives, templates)
├── jobs/                    # Payload Job handlers for background cascades
├── operations/              # CRUD helpers (generateURI, updateIndex, etc.)
├── selectors/               # Extractors for hierarchy + archive data
├── utilities/               # Normalization, validation, diff helpers
└── README.md                # Detailed documentation
```

- `operations/generate-uri.ts` (and friends) are the only supported way to build URIs. Never concatenate strings manually.
- Job handlers (`jobs/archive-update.ts`, `jobs/page-hierarchy-update.ts`, etc.) ensure heavy recalculations run asynchronously.
- Index reads/writes always go through cache utilities (`@/admin/cache`) so the frontend stays synchronized.

---
## 3. Request Lifecycle
1. **Write**: collection hooks invoke `ensureURIIndexEntry` and queue relevant jobs.
2. **Async updates**: Payload Jobs process cascades (descendants, archive children, redirect history).
3. **Cache**: revalidation tags target exactly the URIs affected by the change.
4. **Frontend**: `app/(frontend)/[[...uri]]/page.tsx` calls `cache.getByURI`, which resolves instantly through the index.

---
## 4. High-Risk Areas
- `operations/generate-uri.ts` – changes impact every document; ensure conflict detection and normalization stay intact.
- `jobs/` – bugs here can leave URIs stale or create redirect loops. Always test parent changes, archive slugs, and homepage swaps.
- `collection-config.ts` – drives archive routing and sitemap integration; keep definitions in sync with `smartsite.config.ts` defaults.
- `regenerate-uris.ts` – the nuclear rebuild script. Use for disaster recovery only, as noted in the README.

---
## 5. Safe Patterns
```typescript
import { generateURI } from "@/admin/routing/operations/generate-uri"
import { routingEngine } from "@/admin/routing"

// ✅ Generate URIs through the engine
const uri = await generateURI({
  collection: "pages",
  slug: "about",
  data: pageDoc,
})

// ✅ Resolve URIs via cache integration
const result = await routingEngine.getByURI("/about/team")

// ❌ Do not build URIs manually
const badUri = `/${parentSlug}/${childSlug}`
```

---
## 6. Testing Checklist
- Parent page changes cascade to descendants and create redirects.
- Archive slugs update child documents and regenerate redirects.
- Homepage reassignments swap `/` correctly and fix old URIs.
- Breadcrumb output matches expected hierarchy depth.
- `regenerateURIs()` rebuilds the index without duplications.

Keep this guide aligned with the README’s **Routing & Caching** section. Update both whenever routing behaviour changes.
