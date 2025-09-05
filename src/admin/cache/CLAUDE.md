# Smart Cache System - Surgical Invalidation Engine

The cache system is a **critical foundation** that provides intelligent caching and surgical invalidation for the Smart Site application. It replaces broad cache clearing with precision targeting, maintaining perfect cache consistency while ensuring optimal performance.

## System Architecture

**Core Files**:
- `cache.ts` - Universal cache API with URI Index integration
- `revalidation.ts` - Smart invalidation engine with batch processing
- `change-detection.ts` - Comprehensive change analysis for surgical targeting
- `navigation-detection.ts` - Navigation impact analysis to prevent unnecessary invalidation

**Cache Flow**:
```typescript
// 1. Content retrieval via URI (primary method)
const result = await cache.getByURI("/about/team")
// → Queries URI Index Collection (O(1) lookup)
// → Fetches document via polymorphic relationship
// → Applies template sections if needed
// → Returns cached with precise tags

// 2. Smart invalidation on changes
await revalidate({
  collection: "pages",
  doc: updatedDoc,
  previousDoc: originalDoc,
  action: "update"
})
// → Detects what actually changed
// → Invalidates only affected cache entries
// → Handles cascade operations automatically
```

**What the cache system provides**:
✅ URI-based content resolution with O(1) performance
✅ Surgical cache invalidation based on actual changes
✅ Automatic dependency detection and cascade handling
✅ Batch processing with deduplication
✅ Navigation-aware invalidation (prevents unnecessary header/footer clearing)
✅ Archive page dependency tracking
✅ Template inheritance support

## Integration Points

### 1. URI Index Collection Integration

The cache leverages the URI Index Collection for primary content resolution:

```typescript
// cache.getByURI() flow
const indexResult = await payload.find({
  collection: "uri-index",
  where: {
    uri: { equals: "/about" },
    status: { equals: "published" }
  }
})
// → Single indexed query instead of scanning all collections
// → Returns document reference + metadata
// → Enables polymorphic content retrieval
```

### 2. Payload Hook Integration

All frontend collections use after-change hooks for automatic cache management:

```typescript
// hooks/collections/universal/after-change.ts
export const afterUniversalChange: CollectionAfterChangeHook = async ({
  doc, previousDoc, operation, collection
}) => {
  // Update URI index first
  await updateURIIndex(doc, previousDoc, collection, payload)
  
  // Then trigger smart revalidation
  await revalidateDocument({
    collection: collection.slug,
    doc,
    previousDoc,
    action: operation === "create" ? "create" : "update"
  })
}
```

### 3. Frontend Page Rendering

The universal route handler uses cache for all content:

```typescript
// app/(frontend)/[[...uri]]/page.tsx → uri-renderer.tsx
const routeResponse = await cache.getByURI(URI)
if (!routeResponse?.document) {
  return notFound()
}

// Render with cached content
return <RenderSections 
  sections={document.sections}
  document={document}
  collection={collection}
/>
```

### 4. Cache Tag Architecture

Each cached item receives precisely targeted tags for surgical invalidation:

```typescript
// Tag structure for a page
[
  "all",                    // Emergency clear-all tag
  "item:pages:about",       // Specific document
  "uri:/about",             // Specific URI
  "collection:pages",       // Collection-wide operations
  "global:header",          // Only if navigation affected
  "uri-index:pages"         // Routing consistency
]
```

## Risk-Based Development Guidelines

### ⚠️ High-Impact Files

**`cache.ts`** - Core cache API
- Modifications affect entire content retrieval system
- Changes here impact all frontend pages
- Test thoroughly with different content types

**`revalidation.ts`** - Invalidation engine
- Controls what gets cleared from cache
- Incorrect logic can cause stale content or over-invalidation
- Always test with batch operations

### ✅ Recommended Patterns

**Content Retrieval**:
```typescript
// ✅ Primary method - URI-based (leverages index)
const content = await cache.getByURI("/products/laptop")

// ✅ Fallback for specific needs
const page = await cache.getBySlug("pages", "about")

// ❌ Don't bypass cache for frontend content
const page = await payload.findByID({ ... }) // Wrong for frontend
```

**Cache Invalidation**:
```typescript
// ✅ Use revalidate for single documents
await revalidate({
  collection: "posts",
  doc: updatedPost,
  previousDoc: originalPost,
  action: "update"
})

// ✅ Use batchRevalidate for multiple changes
await batchRevalidate({
  operations: [
    { collection: "pages", doc: page1, previousDoc: old1, action: "update" },
    { collection: "posts", doc: post1, previousDoc: old2, action: "update" }
  ]
})

// ❌ Avoid revalidateAll unless emergency
await revalidateAll() // Nuclear option - use sparingly
```

### ⚠️ High-Risk Modifications

**Never modify these patterns**:
- Cache key generation logic (affects all cached content)
- Tag deduplication in batch operations
- URI normalization in cache keys
- "all" tag usage (reserved for emergency clearing)

## Code Examples & Patterns

### Basic Cache Operations

```typescript
import { cache } from "@/admin/lib/cache"

// Get homepage content
const homepage = await cache.getByURI("/")

// Get collection with filters
const recentPosts = await cache.getCollection("posts", {
  where: { _status: { equals: "published" } },
  sort: "-publishedDate",
  limit: 10
})

// Get global settings
const settings = await cache.getGlobal("settings")
```

### Smart Invalidation Examples

```typescript
import { revalidate, revalidateGlobal } from "@/admin/lib/cache"

// Page update with URI change
await revalidate({
  collection: "pages",
  doc: { id: "1", uri: "/new-about", title: "About Us" },
  previousDoc: { id: "1", uri: "/old-about", title: "About" },
  action: "update"
})
// Automatically invalidates:
// - item:pages:1
// - uri:/new-about
// - uri:/old-about (old URI)
// - global:header (if page appears in nav)

// Global settings change
await revalidateGlobal("settings", newSettings, oldSettings)
// Detects and handles:
// - Homepage designation changes
// - Archive page assignments
// - Template changes
// - Integration code updates
```

### Change Detection Usage

```typescript
import { detectChanges, getChangeImpact } from "@/admin/lib/cache/change-detection"

const changes = detectChanges(newDoc, oldDoc, "update")
const impact = getChangeImpact(changes)

if (impact.requiresURIRegeneration) {
  // Handle URI cascade operations
}

if (impact.requiresNavigationUpdate) {
  // Navigation will be invalidated
}
```

## 🔧 Utility Functions Reference

### Cache API Functions
```typescript
import { cache } from "@/admin/lib/cache"

cache.getByURI(uri: string, draft?: boolean)
cache.getBySlug(collection: string, slug: string, draft?: boolean)  
cache.getByID(collection: string, id: string, draft?: boolean)
cache.getCollection(collection: string, options?: QueryOptions)
cache.getGlobal(globalSlug: string, depth?: number)
cache.getAllURIs(draft?: boolean)
```

### Revalidation Functions
```typescript
import { 
  revalidate, 
  batchRevalidate, 
  revalidateGlobal,
  revalidateCollection,
  revalidateAll 
} from "@/admin/lib/cache"
```

### Change Detection Functions
```typescript
import { 
  detectChanges,
  getChangeImpact,
  analyzeBatchChanges 
} from "@/admin/lib/cache/change-detection"
```

## System Dependencies

**100+ files depend on the cache system**:
- All frontend page components
- Data access layer functions
- Payload collection hooks
- Sitemap generation
- Form submission handlers
- Admin dashboard components

## Troubleshooting

### Common Issues

1. **Stale content after updates**
   - Check if document has `_status: "published"`
   - Verify revalidation hooks are not disabled
   - Check cache tags in debug mode (`CACHE_DEBUG=true`)

2. **Over-invalidation (poor performance)**
   - Review navigation impact detection logic
   - Check for unnecessary archive page dependencies
   - Ensure batch operations use deduplication

3. **Cache key mismatches**
   - Verify URI normalization is consistent
   - Check draft vs published status in keys
   - Ensure collection names match exactly

### Debug Mode

Enable cache debugging:
```bash
CACHE_DEBUG=true pnpm dev
```

This logs all cache operations with:
- Cache keys used
- Tags applied
- Hit/miss status
- Invalidation details

## Critical Warnings

⚠️ **CACHE KEY STRUCTURE IS CRITICAL** - Changes break all cached content
⚠️ **URI NORMALIZATION MUST BE CONSISTENT** - Use routingEngine.normalizeURI()
⚠️ **NEVER INVALIDATE "all" TAG IN NORMAL OPERATIONS** - Reserved for emergency
⚠️ **BATCH OPERATIONS MUST DEDUPLICATE** - Prevents redundant invalidations
⚠️ **NAVIGATION DETECTION PREVENTS UNNECESSARY INVALIDATION** - Don't bypass

Remember: The cache system is the performance foundation of Smart Site. Surgical invalidation ensures fast admin operations while maintaining perfect cache consistency. Always prefer precision over broad clearing.