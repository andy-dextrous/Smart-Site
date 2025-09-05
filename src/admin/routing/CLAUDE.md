# CLAUDE.md - Routing Engine

The routing engine is the **core URI generation and dependency management system** that powers all frontend URLs in Smart Site. It provides intelligent, hierarchical URI generation with automatic dependency updates through Payload Jobs integration.

## Module Overview

The routing engine handles:
- **O(1) URI resolution** via the URI Index Collection
- **Hierarchical page routing** with parent/child relationships
- **Archive page routing** for collection items (posts, services, etc.)
- **Automatic dependency cascades** when URIs change
- **Conflict detection** with priority-based resolution
- **Breadcrumb generation** for navigation
- **Background job processing** for non-blocking updates

## Key Concepts

### URI Index Collection
- Central database collection storing all frontend URIs
- Provides instant URI lookups without recursive queries
- Tracks document relationships and status
- Stores breadcrumbs and template associations
- Maintains redirect history for SEO preservation

### Hierarchical URI Generation
- Pages support parent/child relationships
- URIs build from root to current page: `/parent/child/grandchild`
- Homepage always gets `/` regardless of slug
- Circular reference protection with depth limits

### Archive Page Integration
- Collection items use designated archive pages from settings
- Example: Posts archive at `/blog` → post at `/blog/my-post`
- Falls back to collection name if no archive page set
- Archive changes cascade to all collection items

### Dependency Management
- Archive slug changes update all collection items
- Parent page changes cascade to all descendants
- Homepage designation changes update old/new homepage
- All updates happen via background Payload Jobs

## Critical Patterns

### URI Generation

```typescript
// ALWAYS use routingEngine for URI generation
const uri = await routingEngine.generateURI({
  collection: "pages",
  slug: "about-us",
  data: { parent: parentPageId }
})

// NEVER manually concatenate URIs
// ❌ WRONG
const uri = `/${parentSlug}/${childSlug}`

// ✅ CORRECT
const uri = await routingEngine.generateURI({ collection, slug, data })
```

### URI Resolution

```typescript
// O(1) URI lookup via cache/index
const document = await cache.getByURI("/about/team")

// Validates and normalizes URIs
const isValid = routingEngine.validate("/about/team")
```

### Breadcrumb Generation

```typescript
// Generate breadcrumbs for any document
const breadcrumbs = await routingEngine.generateBreadcrumbs({
  collection: "posts",
  slug: "my-post",
  data: postData
})
// Returns: [
//   { label: "Blog", uri: "/blog", isCurrentPage: false },
//   { label: "My Post", uri: "/blog/my-post", isCurrentPage: true }
// ]
```

### Conflict Detection

```typescript
// Check for URI conflicts before saving
const conflict = await routingEngine.checkConflicts("/about-us")
if (conflict) {
  // Handle conflict - URI already taken by conflict.collection/conflict.slug
}
```

## Common Workflows

### When a Page Parent Changes

1. User changes page parent in admin
2. `detectHierarchyChanges()` identifies the change in hooks
3. Payload Job queued for `page-hierarchy-update`
4. Job recursively updates all descendant pages
5. Redirects created for all changed URIs
6. Cache invalidated for affected pages only

### When an Archive Page Slug Changes

1. User edits archive page slug (e.g., `/blog` → `/articles`)
2. `getArchiveChildCollections()` finds dependent collections
3. Payload Job queued for `archive-page-update`
4. All collection items update URIs in batches
5. Redirects created (e.g., `/blog/post` → `/articles/post`)
6. Cache invalidated for affected collections only

### When Homepage Changes

1. User selects new homepage in settings
2. `detectHomepageChange()` identifies old/new pages
3. Immediate update (not background job):
   - Old homepage: `/` → `/old-slug`
   - New homepage: `/new-slug` → `/`
4. Redirects created for both changes
5. Cache invalidated for both pages

### URI Index Population

```typescript
// Regenerate all URIs (use sparingly)
const stats = await regenerateURIs()
// Processes all frontend collections
// Updates URI index with current URIs
// Reports statistics and errors
```

## Anti-Patterns

### ❌ Manual URI Construction
```typescript
// NEVER build URIs manually
const uri = "/" + collection + "/" + slug
const uri = `${parentURI}/${childSlug}`
```

### ❌ Direct URI Index Manipulation
```typescript
// NEVER update URI index directly
await payload.update({
  collection: "uri-index",
  data: { uri: "/custom-uri" }
})
```

### ❌ Synchronous Dependency Updates
```typescript
// NEVER update dependencies synchronously
for (const child of children) {
  await updateChildURI(child) // Blocks admin saves
}
```

### ❌ Ignoring Conflicts
```typescript
// ALWAYS check for conflicts
const uri = generateSimpleURI(slug)
await save({ uri }) // May cause duplicate URIs
```

## Performance Considerations

### O(1) URI Resolution
- URI Index provides instant lookups
- No recursive parent traversal needed
- Cache integration for repeated access

### Background Processing
- Dependency updates via Payload Jobs
- Admin saves complete in < 1 second
- Batch operations for efficiency

### Smart Cache Invalidation
- Only affected entries invalidated
- Dependency detection minimizes scope
- Batch deduplication prevents redundancy

### Circular Reference Protection
- Maximum depth of 10 levels
- Visited set prevents infinite loops
- Fallback URIs on detection

## Testing Patterns

### Test URI Generation
```typescript
// Verify hierarchical URIs
const uri = await routingEngine.generateURI({
  collection: "pages",
  slug: "child",
  data: { parent: parentId }
})
expect(uri).toBe("/parent/child")

// Verify homepage handling
const homepageURI = await routingEngine.generateURI({
  collection: "pages",
  slug: "home"
})
expect(homepageURI).toBe("/")
```

### Test Dependency Detection
```typescript
// Verify archive dependencies
const deps = await getArchiveChildCollections(archivePageId)
expect(deps).toContainEqual({
  collection: "posts",
  archivePageId,
  itemCount: expect.any(Number)
})

// Verify hierarchy detection
const changes = detectHierarchyChanges(newDoc, oldDoc)
expect(changes.parentChanged).toBe(true)
```

### Test Conflict Resolution
```typescript
// Verify conflict detection
const conflict = await checkURIConflict("/taken-uri")
expect(conflict.hasConflict).toBe(true)
expect(conflict.conflictingCollection).toBe("pages")
```

## Integration Points

### Cache System
- `cache.getByURI()` uses URI Index
- Smart invalidation on URI changes
- Batch operations for efficiency

### Payload Hooks
- `beforeChange` generates new URIs
- `afterChange` triggers dependency jobs
- `afterDelete` cleans up index entries

### Payload Jobs
- Background processing for dependencies
- Error handling and retries
- Progress tracking and logging

### Settings Global
- Archive page configuration
- Homepage designation
- Template assignments

## File Reference

- **`index.ts`** - Public API exports
- **`uri-engine.ts`** - Core URI generation logic
- **`dependency-detection.ts`** - Change analysis functions
- **`index-manager.ts`** - URI Index maintenance
- **`README.md`** - Detailed technical documentation

## Common Issues & Solutions

### Issue: URI Not Updating
**Solution**: Check if document has `slug` field and is in frontend collection

### Issue: Circular Reference Warning
**Solution**: Review page hierarchy for loops, max depth is 10

### Issue: Conflict on Save
**Solution**: URI already taken, check conflict details and resolve

### Issue: Dependencies Not Updating
**Solution**: Check Payload Jobs dashboard for errors or queue status

### Issue: Breadcrumbs Incorrect
**Solution**: Ensure parent relationships are valid and URIs are regenerated