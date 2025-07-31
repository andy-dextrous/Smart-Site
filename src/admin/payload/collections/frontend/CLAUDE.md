# CLAUDE.md - Frontend Collections System

This file provides guidance for Claude Code when working with the **Frontend Collections System** - the architectural backbone that transforms Payload CMS collections into full-featured frontend website collections.

## System Overview

The frontend collections system is a **critical architectural foundation** that automatically enhances Payload CMS collections with SEO, routing, caching, and preview capabilities. It creates a sophisticated factory system that bridges the gap between CMS admin and Next.js frontend.

**Core Files**:

- `index.ts` - Main factory function and registry system
- `frontend-collections.json` - Runtime registry of enabled collections

## How It Works

### Collection Enhancement Pipeline

```typescript
// Transform any Payload collection into frontend-enabled collection
const MyCollection = enableFrontend(baseConfig, {
  label: "My Collection",
  seoSchemaType: "Article", // WebPage, Article, Service, Person, etc.
})
```

**What `enableFrontend()` automatically adds**:

- ✅ SEO fields (meta title, description, Open Graph, structured data)
- ✅ Slug field with conflict prevention
- ✅ Live preview and preview URLs
- ✅ Universal hooks for routing, caching, URI management
- ✅ Intelligent field organization (Content/SEO tabs)

### Registry System

- **In-Memory Registry**: `Map<string, FrontendCollection>` tracks all enabled collections
- **JSON Persistence**: Syncs to `frontend-collections.json` on Payload startup
- **Query Functions**: `getFrontendCollections()`, `isFrontendCollection()`, `getFrontendCollection()`

## Critical Integration Points

### 1. Universal Hooks (Applied to ALL Frontend Collections)

- **`before-change.ts`**: URI generation before document save
- **`after-change.ts`**: URI index updates + cache revalidation after save
- **`after-delete.ts`**: URI cleanup + redirect management after deletion

### 2. Routing System

- **Archive Detection**: Tracks which pages serve as archives for collections
- **Template Management**: Handles template-to-collection relationships
- **Dependency Analysis**: Understands when changes affect dependent content

### 3. Caching & Performance

- **Smart Revalidation**: Only invalidates cache when necessary
- **Navigation Impact**: Detects when changes affect site-wide navigation
- **Tag-based Caching**: Uses collection-specific cache tags

### 4. SEO & Discoverability

- **Metadata Generation**: Next.js metadata with OpenGraph support
- **Sitemap Generation**: XML sitemaps per collection
- **Structured Data**: Automatic schema.org markup based on collection type

## Development Guidelines - Understanding System Impact

### ⚠️ High-Impact Files - Understand Dependencies Before Modifying

**These files have system-wide effects when modified**:

- `payload.config.ts` - Contains `syncFrontendCollectionsOnInit()` initialization
- `universal/before-change.ts` - URI generation hook applied to all frontend collections
- `universal/after-change.ts` - Cache revalidation hook affecting site-wide performance
- `universal/after-delete.ts` - Cleanup hook managing redirects and URI index
- `dependency-detection.ts` - Archive dependency analysis for routing system
- `navigation-detection.ts` - Navigation impact analysis for cache invalidation
- `revalidation.ts` - Smart cache invalidation affecting entire frontend
- `generate-meta.ts` - SEO metadata generation for all frontend collections
- `sitemaps/config.ts` - Sitemap configuration affecting SEO

**Before modifying these files**: Understand how your changes will affect all frontend collections (pages, posts, team, services) and dependent systems.

### ✅ Recommended Patterns

**Adding New Frontend Collections**:

```typescript
// In your collection file (e.g., products.ts)
import { enableFrontend } from "@/admin/payload/collections/frontend"

const productsConfig: CollectionConfig<"products"> = {
  slug: "products",
  fields: [
    // Your collection fields here
  ],
}

export const Products = enableFrontend(productsConfig, {
  label: "Products",
  seoSchemaType: "Product",
})
```

**Registry will automatically update on next Payload restart**

### ⚠️ High-Risk Modifications - Proceed with Caution

**These changes can break system-wide functionality**:

- Modifying `frontend-collections.json` manually (breaks registry sync)
- Calling `syncFrontendCollectionsOnInit()` outside of `payload.config.ts` (duplicate initialization)
- Overriding universal hooks without understanding dependencies (breaks routing/caching)
- Removing collections from the registry without updating dependent systems (orphaned references)
- Modifying the `enableFrontend()` function without testing all 18+ dependent files (system-wide breakage)

**If you need to make these changes**: Test thoroughly across all frontend collections and dependent systems.

### 🔧 Utility Functions (Safe to Use)

**Archive & Template Field Generation**:

```typescript
import {
  getArchivePageFieldName, // e.g., "postsArchivePage"
  getTemplateFieldName, // e.g., "postsTemplate"
  getAllArchivePageFieldNames,
  getAllTemplateFieldNames,
  getSettingsFieldValue,
} from "@/admin/payload/collections/frontend"
```

**Collection Queries**:

```typescript
import {
  getFrontendCollections, // Get all registered collections
  isFrontendCollection, // Check if collection is frontend-enabled
  getFrontendCollection, // Get specific collection config
} from "@/admin/payload/collections/frontend"
```

## System Dependencies (18 Files)

**Collections Enhanced**: `pages.ts`, `posts.ts`, `team.ts`, `services.ts`
**System Init**: `payload.config.ts`
**Universal Hooks**: `before-change.ts`, `after-change.ts`, `after-delete.ts`
**Routing**: `dependency-detection.ts`
**Caching**: `cache.ts`, `revalidation.ts`, `navigation-detection.ts`
**SEO**: `generate-meta.ts`, `link.ts`
**Sitemaps**: `sitemaps/config.ts`, `sitemap.ts`

## Troubleshooting

**If frontend-collections.json is out of sync**:

1. Restart Payload server - `syncFrontendCollectionsOnInit()` will update it
2. Check that all collections using `enableFrontend()` are properly imported in `payload.config.ts`

**If SEO fields are missing**:

1. Verify collection uses `enableFrontend()` wrapper
2. Check if collection already has custom SEO fields (system won't duplicate)
3. Restart development server to trigger field generation

**If routing/caching issues**:

1. Check `isFrontendCollection()` returns true for your collection
2. Verify universal hooks are not being prevented by `shouldPreventHooks()`
3. Check URI index for conflicts or missing entries

**This system affects the entire frontend architecture - changes require comprehensive testing across all frontend collections.**
