# URI-Based Sitemaps – Claude Guide

Smart Site generates XML sitemaps through the modules in `src/admin/sitemaps/`. The system mirrors the behaviour described in the README’s **Routing & Caching** and **Sitemaps** sections: configuration-driven, cache-aware, and fully aligned with the URI index.

---
## 1. Responsibilities
- Discover frontend-enabled collections from `frontend-collections.json`.
- Respect per-collection sitemap configuration (`config.ts`).
- Fetch documents via the cache layer for performance.
- Filter entries for SEO compliance (`noIndex`, external canonical URLs, draft status).
- Emit collection-specific sitemap routes and a sitemap index during the build step.

---
## 2. Module Map
```
sitemaps/
├── config.ts          # Default + per-collection options (priority, changefreq, tags)
├── generator.ts       # Core generation + cache integration
├── seo-filters.ts     # Filters + canonical URL handling
├── index.ts           # Module exports
└── README.md          # Extended documentation
```

- `scripts/generate-sitemap-index.js` runs post-build to emit `public/sitemap.xml`.
- Next.js routes under `app/(frontend)/sitemap.ts` defer to `generateSitemap()` for each collection.

---
## 3. Safe Usage Patterns
```typescript
import { generateSitemap } from "@/admin/sitemaps"

export default async function sitemap({ id }: { id: string }) {
  const result = await generateSitemap({ collectionName: id })
  return result.entries.map(entry => ({
    url: entry.loc,
    lastModified: new Date(entry.lastmod),
    changeFrequency: entry.changefreq,
    priority: entry.priority,
  }))
}
```

- Add new collections by extending `SITEMAP_CONFIG` in `config.ts` and ensuring the collection is marked `frontend` in `smartsite.config.ts`.
- Always fetch documents through the cache layer (`cache.getCollection`) to ensure URI + status data stays in sync.

---
## 4. High-Risk Areas
- `config.ts` – controls cache tags and inclusion rules; keep defaults aligned with README guidance.
- `seo-filters.ts` – mistakes can leak drafts or exclude valid documents.
- `generator.ts` – drives cache integration and entry assembly; test with pages, archives, and excluded documents.
- Post-build script – confirm new sitemap files are appended to the index.

---
## 5. Testing Checklist
- Collections marked `frontend` appear in the sitemap index.
- `noIndex` pages and entries with external canonical URLs are excluded.
- Cache invalidation tags (`sitemap:*`) trigger rebuilds when relevant content changes.
- Build step emits `public/sitemap.xml` containing all collection sitemap URLs.

Keep this guide aligned with the README and update both whenever sitemap behaviour changes.
