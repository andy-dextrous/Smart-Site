# Smart Routing Engine - Unified URI & Cache System

## 🎯 **System Overview**

The Smart Routing Engine provides a streamlined routing and cache management system with **O(1) URI resolution and intelligent cache invalidation**. This unified system handles URI synchronization and performance optimization through a centralized URI Index Collection with automatic dependency management.

## ✨ **Key Features**

### **🎯 O(1) URI Resolution**

Single database query through URI Index Collection eliminates routing bottlenecks

### **🔄 Automatic Dependency Updates**

Archive page changes, hierarchy updates, and settings changes automatically propagate to dependent content via background jobs

### **🎯 Smart Cache Invalidation**

Intelligent invalidation system eliminates unnecessary cache clearing

### **⚡ Real-time Processing**

Payload Jobs integration ensures admin interface stays fast while handling complex background operations

## 📊 **System Architecture**

### **1. 🎯 URI Index Collection** `src/payload/collections/uri-index.ts`

Central database table providing O(1) URI resolution and redirect management.

- **URI Field**: Primary indexed field for instant lookups (`/about`, `/blog/my-post`)
- **Document Relationship**: Direct connection to source documents via polymorphic relationship
- **Collection Metadata**: Source collection tracking (`pages`, `posts`, `services`, etc.)
- **Status Management**: Published/draft state handling
- **Redirect History**: Automatic redirect creation for changed URIs

### **2. 🔄 Smart Cache System** `src/lib/cache/`

Intelligent cache management with precision invalidation.

#### **Universal Cache API** `src/lib/cache/cache.ts`

```typescript
import { cache } from "@/lib/cache"

// URI-based resolution (O(1) via URI Index)
const document = await cache.getByURI("/about/team")

// Collection and slug-based access
const page = await cache.getBySlug("pages", "about")

// Collection queries with filtering
const posts = await cache.getCollection("posts", { limit: 10 })

// Global singleton access
const settings = await cache.getGlobal("settings")
```

#### **Smart Revalidation** `src/lib/cache/revalidation.ts`

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
```

### **3. 🏗️ Dependency Updates System** `src/lib/routing/`

Background processing for complex URI dependency updates.

#### **Dependency Detection** `src/lib/routing/dependency-detection.ts`

```typescript
// Archive dependency detection
const dependencies = await getArchiveChildCollections(pageId)
// Returns: [{ collection: "posts", archivePageId: "...", itemCount: 25 }]

// Hierarchy analysis
const descendants = await findDescendantPages(parentId)
// Returns: [childPage1, childPage2, grandChildPage1, ...]

// Settings change detection
const changes = detectAllSettingsChanges(oldSettings, newSettings)
// Returns: { archiveChanges: [...], homepageChange: { changed: true, ... } }
```

#### **URI Engine** `src/lib/routing/uri-engine.ts`

```typescript
// Core URI generation
const uri = await routingEngine.generateURI({
  collection: "pages",
  slug: "about-us",
  data: { parent: parentPageId },
})

// Get all URIs for static generation
const allURIs = await routingEngine.getAllURIs()

// Conflict detection
const conflict = await routingEngine.checkConflicts("/about-us")
```

#### **Index Manager** `src/lib/routing/index-manager.ts`

```typescript
// Update URI with automatic redirect creation
await updateURI({
  uri: "/about/team",
  collection: "pages",
  documentId: "doc123",
  status: "published",
  previousURI: "/about/staff", // Creates automatic redirect
})

// Bulk populate URI index
const stats = await regenerateURIs()
// Returns: { totalFound: 156, populated: 150, errors: 0 }
```

### **4. 🎯 Background Jobs System** `src/payload/jobs/`

Payload Jobs integration for non-blocking dependency updates.

```typescript
// Job configuration supports:
// - archive-page-update: When archive page slugs change
// - page-hierarchy-update: When parent pages change
// - homepage-change: When homepage designation changes
// - settings-change: When global archive assignments change
// - template-change: When template assignments change
```

## 🚀 **Quick Start Guide**

### **1. Using the URI Engine**

```typescript
import { routingEngine } from "@/lib/routing"

// Generate URI
const uri = await routingEngine.generateURI({
  collection: "pages",
  slug: "about-us",
  data: { parent: parentPageId },
})

// Get all URIs for static generation
const allURIs = await routingEngine.getAllURIs()
```

### **2. Using the Cache System**

```typescript
import { cache, revalidate } from "@/lib/cache"

// Get document by URI
const document = await cache.getByURI("/about/team")

// Smart cache invalidation
await revalidate({
  collection: "pages",
  doc: updatedDoc,
  previousDoc: originalDoc,
  action: "update",
})
```

### **3. Managing URI Index**

```typescript
import { updateURI, regenerateURIs } from "@/lib/routing"

// Update single URI with redirect
await updateURI({
  uri: "/new-path",
  collection: "pages",
  documentId: "doc123",
  status: "published",
  previousURI: "/old-path",
})

// Bulk regenerate
const stats = await regenerateURIs()
```

## 📈 **Performance & Features**

- **O(1) URI Resolution**: Single database query via URI Index
- **Automatic Redirects**: SEO-safe 301 redirects for all URI changes
- **Smart Cache Invalidation**: Only invalidates what actually changed
- **Background Processing**: Admin interface stays fast (< 1 second saves)
- **Dependency Updates**: Archive pages, hierarchy changes, homepage changes all handled automatically
- **Error Handling**: Graceful failure without breaking content saves

This streamlined system provides enterprise-grade routing functionality while maintaining simplicity and reliability.
