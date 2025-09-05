# URI Engine & Dependency Management Documentation

The Smart Routing Engine provides intelligent, hierarchical URI generation with **automatic dependency updates** and **intelligent analysis** through a centralized URI Index Collection and Payload Jobs integration.

## 🎯 **Key Features**

- **O(1) URI Resolution**: Single database query via URI Index Collection
- **Automatic Dependency Updates**: Archive pages, hierarchy changes, settings changes automatically propagate
- **Background Job Processing**: Payload Jobs integration for non-blocking dependency operations
- **Dependency Analysis**: Smart detection of what needs updating when changes occur
- **Hierarchical URI Generation**: Supports parent/child page relationships with dependency detection
- **Archive Page Integration**: Uses designated archive pages with dependency tracking
- **Conflict Detection**: Prevents URI collisions with priority-based resolution
- **Settings-Driven**: Configuration through global settings with change detection
- **Real-time Index Maintenance**: Automatic updates via Payload hooks
- **Redirect Management**: Automatic 301 redirect creation for all URI changes
- **Bulk Operations**: Efficient population and management tools with batch processing

## 📚 **Quick Start**

### Basic Usage

```typescript
import { routingEngine } from "@/lib/routing"

// Generate URI programmatically with dependency detection
const uri = await routingEngine.generateURI({
  collection: "pages",
  slug: "about-us",
  data: { parent: parentPageId },
})

// Get all URIs for static generation (enhanced with dependency tracking)
const allURIs = await routingEngine.getAllURIs()

// Check for conflicts with dependency analysis
const conflict = await routingEngine.checkConflicts("/about-us")
```

### Dependency Operations

```typescript
import {
  getArchiveChildCollections,
  findDescendantPages,
  detectAllSettingsChanges,
} from "@/lib/routing/dependency-detection"

// Archive page dependency analysis
const dependencies = await getArchiveChildCollections("archive-page-id")
// Returns: [{ collection: "posts", archivePageId: "...", itemCount: 25 }]

// Page hierarchy analysis
const descendants = await findDescendantPages("parent-page-id")
// Returns: [childPage1, childPage2, grandChildPage1, ...]

// Settings change detection
const changes = detectAllSettingsChanges(oldSettings, newSettings)
// Returns: { archiveChanges: [...], homepageChange: { changed: true, ... } }
```

### URI Index Management

```typescript
import { updateURI, regenerateURIs } from "@/lib/routing"

// Update with automatic redirect creation
await updateURI({
  uri: "/about/team",
  collection: "pages",
  documentId: "doc123",
  status: "published",
  previousURI: "/about/staff", // Automatically creates redirect
})

// Bulk populate with enhanced tracking
const stats = await regenerateURIs()
console.log(`Populated ${stats.populated} URIs, created ${stats.redirects} redirects`)
```

### URI Generation Rules

```typescript
// Homepage (pages collection, slug "home")
"home" → "/"

// Top-level pages with dependency awareness
"about-us" → "/about-us"

// Hierarchical pages with dependency operations
"about-us" + parent="/company" → "/company/about-us"
// When parent changes: ALL children update automatically

// Collection items with archive page (dependency-aware)
"my-post" + postsArchivePage="/blog" → "/blog/my-post"
// When archive page slug changes: ALL collection items update automatically

// Collection items without archive page
"web-design" (services) → "/services/web-design"
```

## 🏗️ **Architecture**

### Core Components

```
src/lib/routing/
├── index.ts                    # Clean exports and types
├── uri-engine.ts              # Core URI generation with dependency detection
├── index-manager.ts           # URI index maintenance
├── dependency-detection.ts    # Archive/hierarchy/settings dependency analysis
└── README.md                  # This documentation

src/payload/jobs/
└── dependency-updates/        # Payload Jobs task handlers for background processing
    ├── handler.ts             # Main job orchestration
    └── update-functions.ts    # Processing functions for each update type
```

### Integration Points

- **URI Index Collection**: `src/payload/collections/uri-index.ts` (with redirect tracking)
- **Universal Cache**: O(1) URI resolution through `cache.getByURI()` with smart invalidation
- **Global Settings**: Archive page configuration with change detection
- **Payload Jobs**: Background dependency processing with error handling and retries
- **Payload Hooks**: Dependency detection and job queue integration
- **Static Generation**: Build-time URI collection for Next.js with dependency awareness

## ⚙️ **URI Generation Logic**

### 1. Homepage Handling (with dependency detection)

```typescript
// Special case: home page gets root URI
if (collection === "pages" && slug === "home") {
  return "/" // Results in site.com/
}

// Homepage change detection triggers dependency operations:
// - Old homepage: "/" → "/old-home-slug"
// - New homepage: "/new-home-slug" → "/"
// - Automatic redirects created for both changes
```

### 2. Hierarchical Pages (with dependency operations)

```typescript
// Pages can have parent relationships with automatic cascades
const parent = data?.parent || originalDoc?.parent
if (parent) {
  const parentDoc = await payload.findByID({ collection: "pages", id: parent })
  return `${parentDoc.uri}/${slug}`
}

// When parent changes:
// 1. Detect hierarchy change via dependency analyzer
// 2. Queue dependency job via Payload Jobs
// 3. Update ALL descendant pages recursively
// 4. Create redirects for all changed URIs
// 5. Smart cache invalidation for affected pages only
```

### 3. Collection Items with Archive Pages (dependency-aware)

```typescript
// Use designated archive page from settings with dependency tracking
const archivePageField = `${collection}ArchivePage` // e.g., "postsArchivePage"
if (settings[archivePageField]) {
  const archivePage = await payload.findByID({
    collection: "pages",
    id: settings[archivePageField],
  })
  return `/${archivePage.slug}/${slug}`
}

// When archive page slug changes:
// 1. Detect archive dependency via dependency analyzer
// 2. Queue dependency job via Payload Jobs
// 3. Update ALL collection items using this archive
// 4. Create redirects for all changed URIs (e.g., /blog/post → /articles/post)
// 5. Smart cache invalidation for affected collections only
```

### 4. Fallback Collection URIs

```typescript
// Default: use collection name as prefix
return `/${collection}/${slug}`
```

## 🗂️ **URI Index Collection**

The URI Index Collection is enhanced for dependency operations and redirect management.

### Schema Structure

```typescript
interface URIIndex {
  uri: string // The actual URI path (e.g., "/about/team")
  sourceCollection: string // Source collection slug (e.g., "pages")
  documentId: string // ID of the source document
  document: Relationship // Polymorphic relationship to source
  status: "published" | "draft" // Publication status

  // Redirect management
  previousURIs: Array<{
    uri: string
    changedAt: Date
    reason: "slug-change" | "parent-change" | "archive-change" | "homepage-change"
  }>

  // Additional tracking
  templateId?: string
  breadcrumbs?: BreadcrumbItem[]
}
```

### Index Performance

- **URI Field**: Primary index for instant lookups
- **Collection + Document ID**: Composite index for document updates and dependency operations
- **Status**: Filtered index for published/draft queries
- **Unique Constraint**: Prevents URI conflicts with dependency-aware resolution

## 🔧 **Index Manager Functions**

### `updateURI(options)`

Enhanced URI update with automatic redirect creation:

```typescript
await updateURI({
  uri: "/about/team",
  collection: "pages",
  documentId: "doc123",
  status: "published",
  previousURI: "/about/staff", // Automatically creates redirect
  templateId: "page-template-id",
  breadcrumbs: [{ label: "About", uri: "/about" }],
})
```

**Features:**

- Automatic redirect creation for SEO safety
- Template ID tracking for rendering
- Breadcrumb generation and storage
- Integration with smart cache invalidation
- Batch-optimized for dependency operations

### `deleteURI(collection, documentId)`

Cleanup when documents are deleted with dependency awareness:

```typescript
await deleteURI("pages", "doc123")
```

**Features:**

- Removes index entries for deleted documents
- Called automatically by delete hooks
- Maintains index consistency during dependency operations
- Cleans up orphaned redirects

### `regenerateURIs()`

Bulk population enhanced with dependency detection:

```typescript
const stats = await regenerateURIs()
// Returns: {
//   totalFound: 156,
//   populated: 150,
//   skipped: 5,
//   errors: 1,
//   collections: { pages: { found: 50, populated: 48, errors: 0 } }
// }
```

**Features:**

- Detects and resolves URI conflicts during population
- Creates missing redirects during population
- Identifies potential dependency scenarios
- Comprehensive error reporting and recovery

## 🔄 **Dependency Operations System**

### Background Job Processing

The system uses Payload Jobs for handling complex dependency updates:

#### Archive Page Updates

```typescript
// When archive page slug changes:
await processArchivePageUpdate(pageId)

// Automatically:
// ✅ Updates all collection items using this archive page
// ✅ Creates redirects for all changed URIs (/blog/post → /articles/post)
// ✅ Uses batch processing for performance
// ✅ Smart cache invalidation for affected collections only
// ✅ Comprehensive error handling and rollback
```

#### Page Hierarchy Updates

```typescript
// When page parent changes:
await processPageHierarchyUpdate(pageId)

// Automatically:
// ✅ Updates the changed page URI
// ✅ Recursively updates ALL descendant pages
// ✅ Creates redirects for all changed URIs
// ✅ Maintains hierarchy consistency
// ✅ Handles complex nested hierarchies
// ✅ Smart cache invalidation for affected pages only
```

#### Homepage Changes

```typescript
// When homepage designation changes:
await processHomepageChange(newHomepageId, { oldHomepage: oldId })

// Automatically:
// ✅ Updates old homepage to use its slug as URI
// ✅ Updates new homepage to use "/" as URI
// ✅ Creates redirects for both changes
// ✅ Ensures no broken links
// ✅ Immediate execution (not background) for critical nature
```

#### Settings Changes

```typescript
// When global settings affect archive pages:
await processSettingsChange(settingsId, { affectedCollections: ["posts"] })

// Automatically:
// ✅ Processes all affected collections for archive changes
// ✅ Handles homepage changes immediately
// ✅ Coordinates multiple dependency operations efficiently
// ✅ Maintains consistency across all changes
```

### Dependency Analysis (`dependency-detection.ts`)

#### Archive Dependency Detection

```typescript
// Get collections using a specific page as archive
const dependencies = await getArchiveChildCollections("blog-page-id")
// Returns: [
//   {
//     collection: "posts",
//     archivePageId: "blog-page-id",
//     archivePageSlug: "blog",
//     itemCount: 25
//   }
// ]

// Detect archive changes in settings
const archiveChanges = detectArchiveChanges(oldSettings, newSettings)
// Returns: [
//   { collection: "posts", oldArchive: "blog-id", newArchive: "articles-id" }
// ]
```

#### Hierarchy Analysis

```typescript
// Find all descendant pages recursively
const descendants = await findDescendantPages("company-page-id")
// Returns: [childPage1, childPage2, grandChildPage1, ...]

// Detect hierarchy changes
const hierarchyChange = detectHierarchyChanges(doc, previousDoc)
// Returns: { parentChanged: true, oldParent: "old-id", newParent: "new-id" }
```

#### Settings Analysis

```typescript
// Comprehensive settings change detection
const changes = detectAllSettingsChanges(oldSettings, newSettings)
// Returns: {
//   archiveChanges: [{ collection: "posts", oldArchive: "...", newArchive: "..." }],
//   homepageChange: { changed: true, oldHomepage: "...", newHomepage: "..." },
//   templateChanges: [{ collection: "posts", oldTemplate: "...", newTemplate: "..." }],
//   integrationChanges: true
// }
```

## 🚀 **Best Practices**

### URI Generation

1. **Use Dependency-Aware Generation**: Always use `routingEngine.generateURI()` for consistency
2. **Handle Conflicts Gracefully**: Check for conflicts before committing URI changes
3. **Maintain Redirects**: Always provide `previousURI` when updating to ensure SEO safety
4. **Leverage Templates**: Use template IDs for consistent rendering

### Dependency Management

1. **Trust the System**: Dependency updates are handled automatically via hooks
2. **Monitor Jobs**: Use Payload Jobs dashboard to monitor background operations
3. **Handle Errors Gracefully**: Dependency operations include comprehensive error handling
4. **Test Hierarchies**: Complex page hierarchies should be tested thoroughly

### Performance

1. **Use Batch Operations**: For bulk updates, let the system handle batching
2. **Monitor Index Size**: Keep URI index clean with automatic cleanup
3. **Leverage Caching**: The system integrates with smart cache invalidation
4. **Optimize Queries**: URI Index provides O(1) lookups when used correctly

## 📊 **Performance & Reliability**

- **O(1) URI Resolution**: Single database query via URI Index
- **Automatic Redirects**: 100% coverage for changed URIs
- **Background Processing**: Admin interface stays fast (< 1 second saves)
- **Error Handling**: Graceful failure without breaking content saves
- **Smart Invalidation**: Only invalidates cache entries that are actually affected
- **Batch Optimization**: Efficient processing for large dependency operations

This streamlined routing system provides enterprise-grade URI management while maintaining simplicity and reliability through intelligent automation.
