# URI-Based Sitemaps System

The URI-based sitemaps system provides intelligent, SEO-compliant sitemap generation that integrates seamlessly with the Universal Cache and URI Engine.

## 🎯 **Key Features**

- **Configuration-Driven**: Define sitemap mappings in `SITEMAP_CONFIG`
- **Universal Cache Integration**: Uses your existing cache system for performance
- **URI Engine Integration**: Uses actual URI fields instead of slug concatenation
- **SEO Compliance**: Respects `noIndex` and `canonicalUrl` fields automatically
- **Zero-Config Collections**: New collections automatically get sitemap support
- **Smart Invalidation**: Sitemaps update automatically when content changes

## 📚 **Quick Start**

### Basic Usage

```typescript
import { generateSitemap, createSitemapRoute } from "@/lib/sitemaps"

// Generate a sitemap programmatically
const result = await generateSitemap({
  collectionName: "pages",
  includeStatic: true,
})

// Create a sitemap route handler
export const GET = createSitemapRoute("pages-sitemap.xml")
```

### Adding New Collections to Sitemaps

```typescript
// 1. Add to SITEMAP_CONFIG in config.ts
export const SITEMAP_CONFIG = {
  // ... existing config
  events: {
    sitemap: "events-sitemap.xml", // Creates /events-sitemap.xml automatically
    respectSEO: true,
    priority: 0.6,
    changeFreq: "weekly",
    includeInIndex: true,
  },
}

// 2. That's it! The system automatically:
// ✅ Creates the /events-sitemap.xml route
// ✅ Includes it in robots.txt
// ✅ Adds it to next-sitemap config
// ✅ Generates static params at build time
// ✅ Sets up proper cache invalidation
```

## 🏗️ **Dynamic Architecture Benefits**

### **True Zero-Config Collections**

- **One Config Addition**: Just add to `SITEMAP_CONFIG`
- **Automatic Route Creation**: No route files to create
- **Automatic Discovery**: next-sitemap auto-includes new sitemaps
- **Build-Time Optimization**: Static generation with `generateStaticParams`

### **Single Source of Truth**

```typescript
SITEMAP_CONFIG → Controls everything:
├── Dynamic route generation
├── next-sitemap.config.cjs
├── robots.txt entries
├── Cache invalidation tags
└── SEO filtering rules
```

## 🏗️ **Architecture**

### Module Structure

```
src/lib/sitemaps/
├── config.ts         # Sitemap configuration (mirrors CACHE_CONFIG pattern)
├── seo-filters.ts     # SEO compliance logic (noIndex, canonical URLs)
├── generator.ts       # Universal sitemap generator (uses cache system)
├── route-factory.ts   # Dynamic route creation
├── index.ts          # Clean exports
└── README.md         # This documentation
```

### Integration Points

- **Universal Cache**: All document fetching goes through `cache.getCollection()`
- **URI Engine**: Uses `doc.uri` field instead of manual slug concatenation
- **SEO Fields**: Respects `noIndex` and `canonicalUrl` in all collections
- **Smart Revalidation**: Sitemaps invalidate when content changes

## ⚙️ **Configuration**

### Sitemap Configuration

The `SITEMAP_CONFIG` mirrors the `CACHE_CONFIG` pattern for consistency:

```typescript
export const SITEMAP_CONFIG = {
  default: {
    sitemap: "pages-sitemap.xml",
    respectSEO: true,
    priority: 0.5,
    changeFreq: "weekly",
    includeInIndex: true,
  },

  pages: {
    sitemap: "pages-sitemap.xml",
    respectSEO: true,
    priority: 0.8,
    changeFreq: "weekly",
    includeInIndex: true,
  },

  posts: {
    sitemap: "posts-sitemap.xml",
    respectSEO: true,
    priority: 0.6,
    changeFreq: "weekly",
    includeInIndex: true,
  },
}
```

### Configuration Options

- **`sitemap`**: Which sitemap file to include the collection in
- **`respectSEO`**: Whether to honor `noIndex` and `canonicalUrl` fields
- **`priority`**: Default priority for sitemap entries (0.0 - 1.0)
- **`changeFreq`**: How often content typically changes
- **`includeInIndex`**: Whether to include this collection in sitemaps at all

### Excluding Collections from Sitemaps

```typescript
team: {
  sitemap: "", // Empty string = exclude from sitemaps
  includeInIndex: false,
}
```

## 🔍 **SEO Compliance**

### Supported SEO Fields

The system automatically respects these fields in any collection:

```typescript
// Current schema (frontend collections)
{
  meta: {
    noIndex: true,        // Exclude from sitemaps
    canonicalUrl: "...",  // Use canonical URL instead of doc.uri
  }
}
```

### SEO Filtering Rules

1. **Published Only**: Only `_status: "published"` documents included
2. **No Index Respect**: Documents with `meta.noIndex: true` are excluded
3. **External Canonical**: Documents with external canonical URLs are excluded
4. **Internal Canonical**: Documents with internal canonical URLs use the canonical URL

### Adding SEO Fields to Collections

SEO fields are automatically added when using the `enableFrontend()` function. The fields are structured under a `meta` group:

```typescript
// Frontend collections automatically include:
{
  name: "meta",
  type: "group",
  fields: [
    {
      name: "noIndex",
      type: "checkbox",
      label: "No Index",
      admin: {
        description: "Prevent this content from appearing in search engines",
      },
    },
    {
      name: "canonicalUrl",
      type: "text",
      label: "Canonical URL",
      admin: {
        description: "Override the default canonical URL for this content",
      },
    },
    // ... other SEO fields
  ]
}
```

## 🚀 **Performance & Caching**

### Cache Integration

- **Efficient Queries**: Only fetches required fields using `select`
- **Universal Cache**: Leverages your existing cache system
- **🆕 Surgical Invalidation**: Uses precise cache invalidation (60-80% reduction in unnecessary clearing)
- **Smart Tags**: Automatic cache invalidation when content changes

### Cache Tags Generated

```typescript
// Collection-specific tags
;`collection:posts` // Sitemap-specific tags
`sitemap:all``sitemap:pages``sitemap:posts` // Item-specific tags (for individual changes)
`item:posts:my-blog-post`
```

### Enhanced Cache Invalidation

Sitemaps automatically regenerate when:

- Content is published/unpublished
- SEO fields change (`meta.noIndex`, `meta.canonicalUrl`)
- URI changes (through routing engine)
- Collection configuration changes

**🆕 Surgical Precision**: The enhanced cache system only invalidates sitemaps when content actually affects them, dramatically reducing unnecessary regeneration.

## 📖 **Advanced Usage**

### Custom Sitemap Generation

```typescript
import { generateSitemap, validateSitemapResult } from "@/lib/sitemaps"

const result = await generateSitemap({
  collectionName: "custom",
  siteUrl: "https://example.com",
  includeStatic: false,
})

// Validate results
const validation = validateSitemapResult(result)
if (!validation.isValid) {
  console.warn("Sitemap issues:", validation.warnings)
}

console.log(`Generated ${result.entries.length} entries`)
console.log(`Collections: ${result.collections.join(", ")}`)
console.log(`Filtered: ${result.filteredCount}/${result.totalCount}`)
```

### Debugging Sitemaps

```typescript
import { debugAllSitemaps, testSitemapRoute } from "@/lib/sitemaps"

// Test all active sitemaps
const results = await debugAllSitemaps()
console.log(results)

// Test specific sitemap
const test = await testSitemapRoute("pages-sitemap.xml")
console.log(`Success: ${test.success}`)
console.log(`Entries: ${test.entryCount}`)
console.log(`Collections: ${test.collections.join(", ")}`)
```

### Dynamic Route Architecture

The system now uses a single dynamic route that handles all sitemaps automatically:

```typescript
// app/(frontend)/(sitemaps)/[sitemap]/route.ts
// This one file handles ALL sitemaps based on SITEMAP_CONFIG

// URLs automatically work:
// /pages-sitemap.xml → Uses pages + services collections
// /posts-sitemap.xml → Uses posts collection
// /events-sitemap.xml → Works automatically when you add events to config
```

### Route Factory Usage (For Custom Routes)

```typescript
// If you need custom sitemap routes outside the dynamic system
export const GET = createSitemapRoute("custom-sitemap.xml")

// Specific creators (mainly for reference now)
export const GET = createPagesSitemapRoute() // Includes static entries
export const GET = createPostsSitemapRoute() // Posts only
export const GET = createCollectionSitemapRoute("events") // events-sitemap.xml
```

## 🔧 **Troubleshooting**

### Common Issues

**1. Empty Sitemaps**

```typescript
// Check if collection is configured
import { shouldIncludeInSitemap } from "@/lib/sitemaps"
console.log(shouldIncludeInSitemap("posts")) // Should be true

// Check if documents have URIs
console.log(
  await cache.getCollection("posts", {
    select: { uri: true, _status: true },
  })
)
```

**2. SEO Filtering Too Aggressive**

```typescript
// Check SEO field values
import { filterDocumentsForSitemap } from "@/lib/sitemaps"
const allDocs = await cache.getCollection("posts")
const filtered = filterDocumentsForSitemap(allDocs)
console.log(`${allDocs.length} total, ${filtered.length} after SEO filtering`)
```

**3. Cache Issues**

```typescript
// Force regenerate sitemap
import { revalidateTag } from "next/cache"
revalidateTag("sitemap:all") // Invalidates all sitemaps
revalidateTag("sitemap:pages") // Invalidates specific sitemap
```

### Debug Mode

Set `CACHE_DEBUG=true` to see detailed cache operations:

```bash
CACHE_DEBUG=true npm run dev
```

## 🎯 **Best Practices**

### Collection Configuration

1. **Group Related Content**: Put related collections in the same sitemap
2. **Separate High-Volume**: Put frequently-changing content in separate sitemaps
3. **Exclude Utility Collections**: Don't include team/testimonials in sitemaps
4. **Use Appropriate Priorities**: 0.8+ for important pages, 0.5-0.7 for content

### SEO Fields

1. **Use Frontend Collections**: Use `enableFrontend()` to automatically include SEO fields (`meta.noIndex`, `meta.canonicalUrl`)
2. **Use External Canonicals Sparingly**: Only for republished content
3. **Document Field Purpose**: Admin descriptions are automatically added

### Performance

1. **Monitor Sitemap Size**: Keep individual sitemaps under 50,000 URLs
2. **Use Appropriate Cache TTL**: Sitemaps cache for 1 hour by default
3. **Leverage Static Generation**: Pre-generate sitemaps at build time when possible

This system provides enterprise-grade sitemap functionality while maintaining the "just works" philosophy of your Smart Routing Engine.
