# CLAUDE.md - URI-Based Sitemaps System

This file provides guidance for Claude Code when working with the **URI-Based Sitemaps System** - a critical foundation component that provides intelligent, SEO-compliant sitemap generation integrated with the Universal Cache and URI Engine.

## System Overview

The URI-based sitemaps system is a **critical architectural foundation** that automatically generates XML sitemaps for all frontend collections using configuration-driven rules, SEO compliance filtering, and surgical cache invalidation. This system transforms raw Payload CMS collections into search engine optimized, performant sitemap entries.

**Core Files**:

- **`config.ts`** - Central configuration system mirroring cache patterns
- **`generator.ts`** - Universal generation engine with cache integration  
- **`seo-filters.ts`** - SEO compliance filtering and canonical URL handling
- **`index.ts`** - Clean module exports and API surface
- **`README.md`** - Comprehensive system documentation

## Technical Architecture

### Core Process Flow

```typescript
// 1. Configuration Discovery
const frontendCollections = getFrontendCollectionKeys()
// → ["pages", "posts", "team", "services"]

// 2. Collection-Specific Generation
const result = await generateSitemap({
  collectionName: "posts",
  siteUrl: "https://example.com"
})

// 3. SEO Filtering Pipeline
const filteredDocs = filterDocumentsForSitemap(allDocuments)
// → Filters out: unpublished, noIndex, external canonical URLs

// 4. Entry Creation
const entries = filteredDocs.map(doc => 
  createSitemapEntry(doc, siteUrl, priority, changeFreq)
)

// 5. Next.js Integration
export default async function sitemap({ id }): Promise<MetadataRoute.Sitemap>
```

**What the system provides**:

✅ **Zero-Config Collections**: New collections automatically get sitemap support  
✅ **Configuration-Driven**: Single config controls all sitemap behavior  
✅ **Universal Cache Integration**: Leverages existing cache system for performance  
✅ **URI Engine Integration**: Uses actual URI fields instead of slug concatenation  
✅ **SEO Compliance**: Respects `noIndex` and `canonicalUrl` fields automatically  
✅ **Smart Invalidation**: Sitemaps update automatically when content changes  
✅ **Build-Time Generation**: Static sitemap index generation via post-build script

## Integration Points Structure

### 1. Frontend Collections Registry Integration

**What it connects to**: `src/admin/payload/collections/frontend/index.ts` and `frontend-collections.json`  
**Files involved**: `config.ts:54-78`  
**Functionality provided**: Dynamic discovery of frontend-enabled collections for automatic sitemap inclusion

```typescript
// Reads frontend-collections.json at runtime
const frontendCollections = getFrontendCollectionKeys()
// → Auto-discovers: pages, posts, team, services

// Automatically filters by sitemap inclusion rules
const sitemapCollections = frontendCollections.filter(collection => {
  const config = getSitemapConfig(collection)
  return config.includeInIndex
})
```

### 2. Universal Cache System Integration

**What it connects to**: `src/admin/lib/cache/index.ts` and revalidation system  
**Files involved**: `generator.ts:38-42`, cache tag generation in `config.ts:106-115`  
**Functionality provided**: High-performance document fetching with surgical cache invalidation

```typescript
// Efficient document fetching with field selection
const allDocuments = await cache.getCollection("posts", {
  select: getSEOFieldSelection(), // Only required fields
  depth: 0,
  limit: 10000,
})

// Surgical cache invalidation tags
const tags = getSitemapCacheTags("posts")
// → ["sitemap:posts", "sitemap:all"]
```

### 3. SEO Fields and Canonical URL System

**What it connects to**: SEO field groups from `enableFrontend()` collections  
**Files involved**: `seo-filters.ts:29-45`, field selection in `seo-filters.ts:106-114`  
**Functionality provided**: Automatic SEO compliance filtering and canonical URL resolution

```typescript
// SEO field structure expected
{
  seo: {
    meta: {
      noIndex: boolean,        // Exclude from sitemaps
      canonicalUrl: string     // Override default URL
    }
  }
}

// Filtering rules applied
shouldIncludeInSitemap(doc) // Published + !noIndex + !external canonical
```

### 4. URI Engine and Routing Integration

**What it connects to**: `src/admin/lib/routing` URI engine and normalization  
**Files involved**: Document URI field usage, canonical URL resolution  
**Functionality provided**: Uses actual URI fields instead of manual slug concatenation

```typescript
// Uses document URI field directly
const canonicalUrl = `${siteUrl}${doc.uri}`

// Integrates with routing engine normalization
const normalizedUri = routingEngine.normalizeURI(doc.uri)
```

### 5. Next.js Sitemap Integration

**What it connects to**: `src/app/(frontend)/sitemap.ts` and Next.js metadata routes  
**Files involved**: Dynamic sitemap generation using collection ID parameter  
**Functionality provided**: Automatic sitemap route creation using Next.js 15 built-in functionality

```typescript
// Dynamic sitemap generation by collection
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

### 6. Build-Time Index Generation

**What it connects to**: `scripts/generate-sitemap-index.js` post-build script  
**Files involved**: Post-build script reads `frontend-collections.json`  
**Functionality provided**: Static sitemap index creation in `public/sitemap.xml`

```typescript
// Package.json integration
"scripts": {
  "postbuild": "node scripts/generate-sitemap-index.js"
}

// Generates sitemap index XML
<sitemapindex>
  <sitemap>
    <loc>https://example.com/sitemap/pages</loc>
  </sitemap>
  <sitemap>
    <loc>https://example.com/sitemap/posts</loc>
  </sitemap>
</sitemapindex>
```

## Risk-Based Development Guidelines

### ⚠️ High-Impact Files - System-Wide Effects

**These files affect the entire sitemap generation system**:

- **`config.ts`** - Changes affect all collection sitemap configurations and cache tagging
- **`generator.ts`** - Changes affect universal sitemap generation for all collections  
- **`seo-filters.ts`** - Changes affect SEO compliance filtering across all frontend collections
- **`frontend-collections.json`** - Manual changes break automatic registry sync
- **`src/app/(frontend)/sitemap.ts`** - Changes affect Next.js sitemap route functionality
- **`scripts/generate-sitemap-index.js`** - Changes affect build-time sitemap index generation

**Before modifying these files**: Understand impact on all frontend collections (pages, posts, team, services) and dependent SEO systems.

### ✅ Recommended Patterns - Safe Approaches

**Adding Collections to Sitemaps**:

```typescript
// In config.ts - Add collection-specific config
export const SITEMAP_CONFIG: SitemapConfig = {
  default: {
    respectSEO: true,
    priority: 0.8,
    changeFreq: "weekly", 
    includeInIndex: true,
  },
  
  // ✅ Add new collection config
  products: {
    respectSEO: true,
    priority: 0.6,        // Lower priority for products
    changeFreq: "daily",  // Products change more frequently
    includeInIndex: true,
  },
}
```

**Testing Sitemap Generation**:

```typescript
// ✅ Safe testing pattern
import { generateSitemap, validateSitemapResult } from "@/admin/lib/sitemaps"

const result = await generateSitemap({
  collectionName: "posts",
  siteUrl: "https://example.com"
})

console.log(`Generated ${result.entries.length} entries`)
console.log(`Filtered ${result.filteredCount}/${result.totalCount} documents`)
```

**Debugging SEO Filtering**:

```typescript
// ✅ Debug SEO filtering issues
import { filterDocumentsForSitemap, shouldIncludeDocumentInSitemap } from "@/admin/lib/sitemaps"

const allDocs = await cache.getCollection("posts")
const filtered = filterDocumentsForSitemap(allDocs)

// Check specific document
console.log(shouldIncludeDocumentInSitemap(doc))
// Checks: published status, noIndex flag, external canonical
```

### ⚠️ High-Risk Modifications - Can Break System

**These changes can break system-wide sitemap functionality**:

- **Modifying SITEMAP_CONFIG structure** without updating dependent functions (breaks config system)
- **Changing SEO field structure** without updating field selection (breaks filtering)
- **Modifying URI field usage** without updating routing integration (breaks URL generation)  
- **Removing collections from frontend-collections.json** without registry sync (orphaned references)
- **Changing cache tag patterns** without updating revalidation system (breaks invalidation)
- **Modifying Next.js sitemap function signature** without testing (breaks route generation)

**If you need to make these changes**: Test thoroughly across all frontend collections and verify sitemap generation still works.

## Code Examples & Patterns

### Collection Configuration Examples

```typescript
// ✅ CORRECT - Standard collection config
posts: {
  respectSEO: true,       // Honor noIndex and canonical fields
  priority: 0.6,         // Medium priority
  changeFreq: "weekly",  // Standard frequency
  includeInIndex: true,  // Include in sitemaps
}

// ✅ CORRECT - High-priority pages
pages: {
  respectSEO: true,
  priority: 0.8,         // Higher priority for main pages
  changeFreq: "monthly", // Pages change less frequently
  includeInIndex: true,
}

// ❌ INCORRECT - Missing required fields
events: {
  priority: 0.5, // Missing other required config
}

// ❌ INCORRECT - Invalid frequency value
services: {
  respectSEO: true,
  priority: 0.7,
  changeFreq: "sometimes", // Invalid - must be standard sitemap frequency
  includeInIndex: true,
}
```

### SEO Filtering Usage

```typescript
// ✅ CORRECT - Check document SEO compliance
import { shouldIncludeDocumentInSitemap } from "@/admin/lib/sitemaps"

const doc = await cache.getDocument("posts", "my-post")
if (shouldIncludeDocumentInSitemap(doc)) {
  // Safe to include in sitemap
  const entry = createSitemapEntry(doc, siteUrl, 0.6, "weekly")
}

// ✅ CORRECT - Batch filtering
import { filterDocumentsForSitemap } from "@/admin/lib/sitemaps"

const allPosts = await cache.getCollection("posts")
const sitemapPosts = filterDocumentsForSitemap(allPosts)
// Automatically filters: unpublished, noIndex, external canonical

// ❌ INCORRECT - Manual filtering
const posts = await cache.getCollection("posts")
const published = posts.filter(p => p._status === "published") // Missing SEO filtering
```

### Cache Integration Examples

```typescript
// ✅ CORRECT - Use efficient field selection
import { getSEOFieldSelection } from "@/admin/lib/sitemaps"

const documents = await cache.getCollection("posts", {
  select: getSEOFieldSelection(), // Only fetches required fields
  depth: 0,                      // No relations needed
  limit: 10000,                  // Reasonable limit
})

// ✅ CORRECT - Cache invalidation integration
import { getSitemapCacheTags } from "@/admin/lib/sitemaps"

const tags = getSitemapCacheTags("posts")
// → ["sitemap:posts", "sitemap:all"]
revalidateTag("sitemap:posts") // Invalidate specific sitemap
revalidateTag("sitemap:all")   // Invalidate all sitemaps

// ❌ INCORRECT - Fetching unnecessary data
const documents = await cache.getCollection("posts", {
  depth: 2, // Unnecessary relation fetching
}) // Missing field selection - fetches all fields
```

## Utility Functions Reference

### 🔧 Configuration Utilities (Safe to Use)

```typescript
import {
  getSitemapConfig,                    // Get config for any collection
  shouldIncludeCollectionInSitemap,   // Check if collection should be in sitemaps
  getSitemapCacheTags,               // Get cache tags for collection
  getFrontendCollectionKeys,         // Get all frontend collection slugs
} from "@/admin/lib/sitemaps/config"

// Usage examples
const config = getSitemapConfig("posts")
const shouldInclude = shouldIncludeCollectionInSitemap("team")
const cacheTags = getSitemapCacheTags("pages")
```

### 🔧 Generation Utilities (Safe to Use)

```typescript
import {
  generateSitemap,
  type SitemapGenerationResult,
} from "@/admin/lib/sitemaps/generator"

// Generate sitemap for any collection
const result = await generateSitemap({
  collectionName: "posts",
  siteUrl: "https://example.com",
})

// Result includes comprehensive metrics
console.log(result.totalCount)    // Total documents found
console.log(result.filteredCount) // Documents after SEO filtering  
console.log(result.entries)       // Final sitemap entries
```

### 🔧 SEO Filtering Utilities (Safe to Use)

```typescript
import {
  shouldIncludeDocumentInSitemap,    // Check single document
  filterDocumentsForSitemap,         // Filter document array
  createSitemapEntry,                // Create sitemap entry
  getSEOFieldSelection,              // Get required fields for queries
} from "@/admin/lib/sitemaps/seo-filters"

// Check individual document
const include = shouldIncludeDocumentInSitemap(doc)

// Batch filter documents
const filtered = filterDocumentsForSitemap(documents)

// Create properly formatted entry
const entry = createSitemapEntry(doc, siteUrl, 0.6, "weekly")
```

### 🔧 URL Utilities (Safe to Use)

```typescript
import { isExternalUrl } from "@/admin/utilities/url-helpers"

// Check if canonical URL is external
const isExternal = isExternalUrl("https://external-site.com/page")
// → true (excludes from sitemap)

const isInternal = isExternalUrl("/internal-page")  
// → false (includes in sitemap)
```

## System Dependencies (18 Files)

**Core Module Files**: `config.ts`, `generator.ts`, `seo-filters.ts`, `index.ts`  
**Integration Files**: `frontend-collections.json`, `cache/index.ts`, `cache/revalidation.ts`  
**Frontend Collections**: `pages.ts`, `posts.ts`, `team.ts`, `services.ts`  
**Route Integration**: `app/(frontend)/sitemap.ts`, `app/(frontend)/robots.ts`  
**Build Integration**: `scripts/generate-sitemap-index.js`, `package.json`  
**Utility Dependencies**: `utilities/get-url.ts`, `utilities/url-helpers.ts`, `lib/routing/index.ts`

## Troubleshooting

### Common Issues

**1. Empty Sitemaps Generated**

Diagnostic steps:
1. Check if collection is included: `shouldIncludeCollectionInSitemap("posts")`
2. Verify documents have URIs: Check document `uri` field values  
3. Check SEO filtering: Documents may be filtered by `noIndex` or external canonical URLs
4. Verify collection is in frontend-collections.json

**2. Documents Missing from Sitemaps**

Diagnostic steps:
1. Verify document status: Only `_status: "published"` documents included
2. Check SEO fields: `meta.noIndex: true` excludes from sitemaps
3. Check canonical URLs: External canonical URLs exclude from sitemaps
4. Verify URI generation: Documents need valid `uri` field

**3. Sitemap Routes Not Working**

Diagnostic steps:
1. Check Next.js sitemap function: Verify `src/app/(frontend)/sitemap.ts` exports
2. Verify collection IDs match: Frontend collection slugs must match sitemap IDs
3. Check build process: Ensure post-build script runs successfully
4. Verify sitemap index: Check `public/sitemap.xml` generation

**4. Cache Issues with Sitemaps**

System restart/rebuild instructions:
1. Force sitemap regeneration: `revalidateTag("sitemap:all")`
2. Clear collection cache: `revalidateTag("collection:posts")`  
3. Restart development server: Cache tags regenerate automatically
4. Rebuild project: Post-build script regenerates sitemap index

**5. SEO Fields Not Recognized**

Diagnostic steps:
1. Verify collection uses `enableFrontend()`: SEO fields added automatically
2. Check field structure: Must be nested under `seo.meta.noIndex` and `seo.meta.canonicalUrl`
3. Update field selection: Use `getSEOFieldSelection()` in queries
4. Restart Payload: Field changes require server restart

### Critical Warnings & System Impact Reminders

⚠️ **Configuration Changes**: Modifying `SITEMAP_CONFIG` affects all frontend collections immediately  
⚠️ **SEO Field Changes**: Changes to SEO filtering logic affect search engine discoverability  
⚠️ **Cache Integration**: Sitemap cache invalidation affects overall site performance  
⚠️ **Build Process**: Post-build script failure prevents sitemap index generation  
⚠️ **Frontend Collections**: Changes to frontend collection registry affect automatic discovery

**This system is foundational to SEO performance - changes require comprehensive testing across all frontend collections and search engine validation.**