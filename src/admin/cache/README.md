# Smart Cache System - Intelligent Invalidation & Performance

> **A streamlined caching system with intelligent invalidation that eliminates unnecessary cache clearing while maintaining perfect cache consistency**

## 🎯 **System Overview**

This cache system provides **smart cache invalidation** through intelligent change detection and dependency management. The system integrates seamlessly with the Smart Routing Engine's URI Index Collection and automatically handles dependency updates with minimal performance impact.

## ✨ **Key Features**

### **🎯 Smart Invalidation**

Intelligent detection ensures only truly affected cache entries are invalidated

### **🔍 Change Detection**

Comprehensive analysis determines exactly what changed and what's impacted

### **🔄 Batch Processing**

Deduplication and optimization for operations affecting multiple documents

### **⚡ Real-time Performance**

Admin interface stays fast while handling complex background invalidation

## 📁 **File Structure**

```
src/lib/cache/
├── README.md                    # This documentation
├── index.ts                     # Clean exports for all cache functionality
├── cache.ts                     # Universal cache API
└── revalidation.ts              # Smart invalidation & batch processing
```

## 🏗️ **System Architecture**

### **1. Universal Cache API (`cache.ts`)**

Single interface for all caching operations with URI Index integration:

```typescript
import { cache } from "@/lib/cache"

// PRIMARY METHOD: URI-based resolution (O(1) via URI Index)
const document = await cache.getByURI("/about/team")

// Collection and slug-based access
const page = await cache.getBySlug("pages", "about")

// Collection queries with filtering
const posts = await cache.getCollection("posts", { limit: 10 })

// Global singleton access
const settings = await cache.getGlobal("settings")
```

### **2. Smart Invalidation (`revalidation.ts`)**

Intelligent cache invalidation that replaces broad cache clearing with precision targeting:

```typescript
import { revalidate, batchRevalidate, revalidateGlobal } from "@/lib/cache"

// Smart invalidation for single document changes
await revalidate({
  collection: "pages",
  doc: updatedDoc,
  previousDoc: originalDoc,
  action: "update",
})

// Optimized batch processing for cascade operations
await batchRevalidate({
  operations: [
    { collection: "pages", doc: doc1, previousDoc: prev1, action: "update" },
    { collection: "posts", doc: doc2, previousDoc: prev2, action: "update" },
  ],
})

// Global settings invalidation
await revalidateGlobal("settings", newSettings, oldSettings)
```

#### **Core Functions**

**`revalidate(options): Promise<InvalidationResult>`**
Main invalidation function with smart precision:

```typescript
// Intelligent invalidation based on what actually changed
const result = await revalidate({
  collection: "pages",
  doc: updatedDoc,
  previousDoc: originalDoc,
  action: "update",
})

// Automatically handles:
// ✅ Specific document invalidation (always)
// ✅ URI-specific invalidation (when changed)
// ✅ Smart navigation detection (when navigation affected)
// ✅ Archive dependency invalidation (when archive pages change)
// ✅ Hierarchy invalidation (when parent changes)
```

**`batchRevalidate(options): Promise<BatchInvalidationSummary>`**
Optimized batch processing with deduplication:

```typescript
// Process multiple changes efficiently
const summary = await batchRevalidate({
  operations: [
    { collection: "pages", doc: doc1, previousDoc: prev1, action: "update" },
    { collection: "posts", doc: doc2, previousDoc: prev2, action: "update" },
  ],
})
// Automatically deduplicates overlapping cache tags
// Returns: { totalOperations: 2, uniqueTagsInvalidated: 5, totalDuration: 78 }
```

**`revalidateGlobal(globalSlug, doc, previousDoc): Promise<InvalidationResult>`**
Global settings invalidation with dependency detection:

```typescript
// Settings changes trigger appropriate downstream invalidation
await revalidateGlobal("settings", newSettings, oldSettings)
// Automatically detects and handles:
// - Archive page assignment changes
// - Homepage designation changes
// - Template assignment changes
// - Integration changes (full site invalidation when needed)
```

## 🎯 **Smart Invalidation Logic**

### **Document-Level Invalidation**

The system automatically invalidates cache entries based on what actually changed:

```typescript
// Always invalidated for any change:
// - item:pages:about-us (specific document)
// - uri:/about-us (specific URI)

// Conditionally invalidated based on changes:
// - uri:/old-path (if URI changed)
// - global:header (if navigation affected)
// - global:footer (if navigation affected)
// - collection:posts (if this page is an archive for posts)
// - item:pages:parent-id (if parent changed)
```

### **Navigation Impact Detection**

Smart detection prevents unnecessary header/footer invalidation:

```typescript
// Only invalidates navigation when:
// ✅ Publication status changes (affects visibility)
// ✅ Archive pages change (often appear in navigation)
// ✅ Navigation-enabled pages change (includeInNav: true)
// ❌ Content-only changes DON'T invalidate navigation
// ❌ Draft changes DON'T affect navigation
```

### **Archive Dependency Detection**

Automatically detects when archive pages affect collections:

```typescript
// If a page is used as archive for collections:
// - Changing the page slug invalidates ALL items in those collections
// - Uses collection:posts tag to invalidate entire collection efficiently
// - Also invalidates uri-index:posts for routing consistency
```

## 🔧 **Integration Points**

### **URI Index Integration**

The primary cache method leverages the URI Index Collection:

```typescript
// Single query resolution via URI Index
const result = await cache.getByURI("/about/team")
// How it works:
// 1. Query URI Index Collection for URI
// 2. Get document via polymorphic relationship
// 3. Cache result with smart cache tags
// 4. Return unified document object
```

### **Cache Key Structure**

```typescript
// URI-based caches use precise cache keys:
;["uri", normalizedURI, status][
  // Examples:
  ("uri", "", "published")
][("uri", "/about", "published")][("uri", "/blog/my-post", "draft")] // Homepage // About page // Draft post preview
```

### **Smart Cache Tags**

```typescript
// Each cached document gets precisely targeted tags:
;[
  "item:pages:about", // Specific item (always)
  "uri:/about", // Specific URI (always)
  "collection:pages", // Source collection (when needed)
  "global:header", // Only if navigation affected
  "uri-index:pages", // Only for routing consistency
]
```

## 📝 **Usage Examples**

### **Basic Cache Operations**

```typescript
import { cache } from "@/lib/cache"

// Get by URI (primary method)
const page = await cache.getByURI("/about")

// Get by collection and slug
const post = await cache.getBySlug("posts", "my-blog-post")

// Get collection with filtering
const posts = await cache.getCollection("posts", {
  where: { _status: { equals: "published" } },
  limit: 10,
})

// Get global data
const settings = await cache.getGlobal("settings")
```

### **Manual Cache Invalidation**

```typescript
import { revalidate, revalidateCollection, revalidateAll } from "@/lib/cache"

// Revalidate specific document after manual update
await revalidate({
  collection: "pages",
  doc: updatedDoc,
  previousDoc: originalDoc,
  action: "update",
})

// Revalidate entire collection
await revalidateCollection("posts", "posts-collection-update")

// Emergency full revalidation (use sparingly)
await revalidateAll()
```

### **Batch Operations**

```typescript
import { batchRevalidate } from "@/lib/cache"

// Process multiple document updates efficiently
const operations = [
  { collection: "pages", doc: page1, previousDoc: oldPage1, action: "update" },
  { collection: "pages", doc: page2, previousDoc: oldPage2, action: "update" },
  { collection: "posts", doc: post1, previousDoc: oldPost1, action: "update" },
]

const summary = await batchRevalidate({ operations })
console.log(`Processed ${summary.totalOperations} operations`)
console.log(`Invalidated ${summary.uniqueTagsInvalidated} unique cache tags`)
```

## 🚀 **Performance Features**

### **Automatic Optimizations**

- **Tag Deduplication**: Prevents redundant invalidation during batch operations
- **Smart Dependencies**: Only invalidates what's actually affected by changes
- **Parallel Processing**: Batch operations run invalidations in parallel
- **Error Isolation**: One failed invalidation doesn't break others

### **Monitoring & Debug**

```typescript
// All operations return detailed results for monitoring:
const result = await revalidate({...})
console.log(`Invalidated ${result.tagsInvalidated.length} tags in ${result.duration}ms`)
console.log(`Reason: ${result.reason}`)
console.log(`Tags: ${result.tagsInvalidated.join(", ")}`)
```

## 🎯 **Best Practices**

### **When to Use Each Function**

- **`revalidate()`**: Single document changes (content edits, status changes)
- **`batchRevalidate()`**: Multiple document updates (imports, cascade operations)
- **`revalidateGlobal()`**: Global settings changes
- **`revalidateCollection()`**: Collection-wide updates (rare)
- **`revalidateAll()`**: Emergency situations only

### **Error Handling**

```typescript
try {
  await revalidate({...})
} catch (error) {
  // Cache invalidation failures are logged but don't break saves
  console.error("Cache invalidation failed:", error)
  // Document save still succeeds
}
```

This streamlined cache system provides intelligent invalidation with minimal complexity while maintaining perfect cache consistency and excellent performance.
