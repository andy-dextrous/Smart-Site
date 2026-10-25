---
name: payload
description: Use when working with Payload projects (payload.config.ts, collections, fields, hooks, access control, Payload API). Use when debugging validation errors, security issues, relationship queries, transactions, or hook behavior.
---

# Payload Application Development

Payload is a Next.js native CMS with TypeScript-first architecture, providing admin panel, database management, REST/GraphQL APIs, authentication, and file storage.

## Quick Reference

| Task                     | Solution                                                                   | Details                                                                                                                          |
| ------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Auto-generate slugs      | `...slugField('title')` from `@/fields/slug`                                     | [FIELDS.md#slug-field](reference/FIELDS.md#slug-field)                                                                           |
| Restrict content by user | Access control with query                                                  | [ACCESS-CONTROL.md#row-level-security-with-complex-queries](reference/ACCESS-CONTROL.md#row-level-security-with-complex-queries) |
| Local API user ops       | `user` + `overrideAccess: false`                                           | [QUERIES.md#access-control-in-local-api](reference/QUERIES.md#access-control-in-local-api)                                       |
| Draft/publish workflow   | `versions: { drafts: true }`                                               | [COLLECTIONS.md#versioning--drafts](reference/COLLECTIONS.md#versioning--drafts)                                                 |
| Computed fields          | `virtual: true` with **field-level** `hooks.afterRead` returning the value | [FIELDS.md#virtual-fields](reference/FIELDS.md#virtual-fields)                                                                   |
| Document titles          | Stored top-level field in `admin.useAsTitle`                               | [COLLECTIONS.md#useastitle](reference/COLLECTIONS.md#useastitle)                                                                 |
| Conditional fields       | `admin.condition`                                                          | [FIELDS.md#conditional-fields](reference/FIELDS.md#conditional-fields)                                                           |
| Custom field validation  | `validate` function                                                        | [FIELDS.md#validation](reference/FIELDS.md#validation)                                                                           |
| Filter relationship list | `filterOptions` on field                                                   | [FIELDS.md#relationship](reference/FIELDS.md#relationship)                                                                       |
| Select specific fields   | `select` parameter                                                         | [QUERIES.md#field-selection](reference/QUERIES.md#field-selection)                                                               |
| Auto-set author/dates    | beforeChange hook                                                          | [HOOKS.md#collection-hooks](reference/HOOKS.md#collection-hooks)                                                                 |
| Prevent hook loops       | `req.context` check                                                        | [HOOKS.md#context](reference/HOOKS.md#hook-context)                                                                                   |
| Cascading deletes        | beforeDelete hook                                                          | [HOOKS.md#collection-hooks](reference/HOOKS.md#collection-hooks)                                                                 |
| Geospatial queries       | `point` field with `near`/`within`                                         | [FIELDS.md#point-geolocation](reference/FIELDS.md#point-geolocation)                                                             |
| Reverse relationships    | `join` field type                                                          | [FIELDS.md#join-fields](reference/FIELDS.md#join-fields)                                                                         |
| Next.js revalidation     | Durable publication intent with the original request                                             | [HOOKS.md#nextjs-revalidation-with-context-control](reference/HOOKS.md#smartsite-publication-and-cache-invalidation)                 |
| Query by relationship    | Nested property syntax                                                     | [QUERIES.md#nested-properties](reference/QUERIES.md#nested-properties)                                                           |
| Complex queries          | AND/OR logic                                                               | [QUERIES.md#andor-logic](reference/QUERIES.md#andor-logic)                                                                       |
| Transactions             | Pass `req` to operations                                                   | [ADAPTERS.md#threading-req-through-operations](reference/ADAPTERS.md#threading-req-through-operations)                           |
| Background jobs          | Jobs queue with tasks                                                      | [ADVANCED.md#jobs-queue](reference/ADVANCED.md#jobs-queue)                                                                       |
| Custom API routes        | Collection custom endpoints                                                | [ADVANCED.md#custom-endpoints](reference/ADVANCED.md#custom-endpoints)                                                           |
| Cloud storage            | Storage adapter plugins                                                    | [ADAPTERS.md#storage-adapters](reference/ADAPTERS.md#storage-adapters)                                                           |
| Multi-language           | `localization` config + `localized: true`                                  | [ADVANCED.md#localization](reference/ADVANCED.md#localization)                                                                   |
| Create plugin            | `(options) => (config) => Config`                                          | [PLUGIN-DEVELOPMENT.md#plugin-architecture](reference/PLUGIN-DEVELOPMENT.md#plugin-architecture)                                 |
| Plugin package setup     | Package structure with SWC                                                 | [PLUGIN-DEVELOPMENT.md#plugin-package-structure](reference/PLUGIN-DEVELOPMENT.md#plugin-package-structure)                       |
| Add fields to collection | Map collections, spread fields                                             | [PLUGIN-DEVELOPMENT.md#adding-fields-to-collections](reference/PLUGIN-DEVELOPMENT.md#adding-fields-to-collections)               |
| Plugin hooks             | Preserve existing hooks in array                                           | [PLUGIN-DEVELOPMENT.md#adding-hooks](reference/PLUGIN-DEVELOPMENT.md#adding-hooks)                                               |
| Check field type         | Type guard functions                                                       | [FIELD-TYPE-GUARDS.md](reference/FIELD-TYPE-GUARDS.md)                                                                           |

## Reference examples

Use the existing project config and local startup skill; these generic examples explain Payload APIs, not replacement setup.

### Project Config

Edit `src/payload.config.ts` and the existing native collection/global modules. Keep their factory arguments, plugin composition, storage and website metadata. For a new collection, use the examples below and follow the site's content-model workflow for routing, search and publication hooks. Regenerate types and the import map after changing the schema.

## Essential Patterns

### Defaults & Conventions

Apply these defaults when modeling content unless there's a clear reason not to:

- **Enable drafts/versions by default:** `versions: { drafts: true }`. This is the
  recommended starting point for any content collection. It auto-injects a
  `_status` field (`draft` / `published`) — **don't add your own
  `status` field**, it's redundant. Only skip versions for collections that have
  no publish/draft lifecycle (e.g. internal join tables, settings).
- **Use SmartSite's `slugField` helper** from `@/fields/slug` for routed content. Spread `...slugField('title')` into `fields`; it supplies the slug, URI and editing controls used by website routing. Payload 3.92 has no `type: 'slug'` field.
- **`position: 'sidebar'` is for short, at-a-glance fields** — status, category,
  author, publish date. Avoid it for long fields that need horizontal space to be
  usable (description, rich text content, long text). Those belong in the main
  document area.
- **Use a stored top-level field for `admin.useAsTitle`.** Never set
  `admin.useAsTitle` to a computed field configured with `virtual: true`; these
  fields are not queryable and Payload rejects the configuration. A
  relationship-path virtual such as `virtual: 'author.name'` is supported, but
  use it only when the title must come from a related document.

### Basic Collection

```ts
import type { CollectionConfig } from 'payload'
import { slugField } from '@/fields/slug'

export const Posts: CollectionConfig = {
  slug: 'posts',
  admin: {
    useAsTitle: 'title',
    // _status (from versions.drafts) shows the draft/published state — no custom status field needed
    defaultColumns: ['title', 'author', '_status', 'createdAt'],
  },
  versions: {
    drafts: true,
  },
  fields: [
    { name: 'title', type: 'text', required: true },
    ...slugField('title'), // SmartSite slug, URI, lock and redirect controls
    { name: 'content', type: 'richText' }, // long field — stays in the main area, not the sidebar
    // short, at-a-glance field — good sidebar candidate
    { name: 'author', type: 'relationship', relationTo: 'users', admin: { position: 'sidebar' } },
  ],
  timestamps: true,
}
```

For more collection patterns (auth, upload, drafts, live preview), see [COLLECTIONS.md](reference/COLLECTIONS.md).

### Common Fields

```ts
// Text field
{ name: 'title', type: 'text', required: true }

// Relationship
{ name: 'author', type: 'relationship', relationTo: 'users', required: true }

// Rich text
{ name: 'content', type: 'richText', required: true }

// In a fields array; import { slugField } from '@/fields/slug'
...slugField('title')

// Select (for genuine taxonomy — NOT publish state; use versions.drafts + _status for that)
{ name: 'category', type: 'select', options: ['news', 'tutorial', 'opinion'] }

// Upload
{ name: 'image', type: 'upload', relationTo: 'media' }
```

For all field types (array, blocks, point, join, virtual, conditional, etc.), see [FIELDS.md](reference/FIELDS.md).

### Hook Example

Hooks live at one of two levels and they are not interchangeable. **Collection hooks** receive `{ doc, data, req, operation, ... }` and act on the whole document. **Field hooks** live inside an individual field's `hooks` object, receive `{ value, siblingData, ... }`, and **return the new value** for that field. Computed/virtual fields, per-field formatters, and per-field presentation formatting are field hooks; cross-field business logic is a collection hook.

```ts
// Collection-level: business logic across the document
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeChange: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],
  },
  fields: [{ name: 'title', type: 'text' }],
}

// Field-level: compute / format a single field's value (virtual fields use this)
export const Users: CollectionConfig = {
  slug: 'users',
  fields: [
    { name: 'firstName', type: 'text' },
    { name: 'lastName', type: 'text' },
    {
      name: 'fullName',
      type: 'text',
      virtual: true,
      hooks: {
        afterRead: [({ siblingData }) => `${siblingData.firstName} ${siblingData.lastName}`],
      },
    },
  ],
}
```

When asked to "compute a field" or "populate a field's value in a hook", use a **field-level** hook on that field — never a collection-level `afterRead` that mutates `doc`.

For all hook patterns, see [HOOKS.md](reference/HOOKS.md). For access control, see [ACCESS-CONTROL.md](reference/ACCESS-CONTROL.md).

### Access Control with Type Safety

```ts
import type { Access } from 'payload'
import type { User } from '@/payload-types'
import { userHasMinimumRole } from '@/access/roles'

// Type-safe access control
export const adminOnly: Access = ({ req }) => {
  const user = req.user as User
  return userHasMinimumRole(user, 'admin')
}

// Row-level access control
export const ownPostsOnly: Access = ({ req }) => {
  const user = req.user as User
  if (!user) return false
  if (userHasMinimumRole(user, 'admin')) return true

  return {
    author: { equals: user.id },
  }
}
```

### Query Example

```ts
// Local API
const posts = await payload.find({
  collection: 'posts',
  overrideAccess: false,
  user, // authenticated caller; use req inside a hook/endpoint
  where: {
    _status: { equals: 'published' },
    'author.name': { contains: 'john' },
  },
  depth: 2,
  limit: 10,
  sort: '-createdAt',
})

// Query with populated relationships
const post = await payload.findByID({
  collection: 'posts',
  overrideAccess: false,
  user, // authenticated caller; use req inside a hook/endpoint
  id: '123',
  depth: 2, // Populates relationships (default is 2)
})
// Returns: { author: { id: "user123", name: "John" } }

// With depth: 0, relationships return IDs only
const post = await payload.findByID({
  collection: 'posts',
  overrideAccess: false,
  user, // authenticated caller; use req inside a hook/endpoint
  id: '123',
  depth: 0,
})
// Returns: { author: "user123" }
```

For all query operators and REST/GraphQL examples, see [QUERIES.md](reference/QUERIES.md).

### Getting Payload Instance

```ts
// In API routes (Next.js)
import { getPayload } from 'payload'

import config from '@payload-config'

export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: request.headers })

  const posts = await payload.find({
    collection: 'posts',
    overrideAccess: false, // this route answers for whoever called it
    user,
  })

  return Response.json(posts)
}

// In Server Components
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import config from '@payload-config'

export default async function Page() {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: await headers() })
  const { docs } = await payload.find({
    collection: 'posts',
    overrideAccess: false,
    user,
  })

  return <div>{docs.map(post => <h1 key={post.id}>{post.title}</h1>)}</div>
}
```

## Security Pitfalls

### 1. Local API Access Control (CRITICAL)

**`overrideAccess: true` bypasses ALL access control**, even when a user is passed.

```ts
// ❌ SECURITY BUG: Passes user but bypasses their permissions anyway
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: true, // Access control is BYPASSED!
})

// ✅ SECURE: Explicitly enable access checks for this user
await payload.find({
  collection: 'posts',
  user: someUser,
  overrideAccess: false,
})
```

Payload 3.92 Local API CRUD operations default to `overrideAccess: true`. Supplying `user` or `req` alone does not enable access checks.

- Explicitly set `overrideAccess: false` - operating on behalf of a user (API routes, user-facing server functions, and webhooks acting as a user). Pass `user` alongside it.
- `overrideAccess: true` - trusted system work (cron jobs, seeds, migrations, system tasks, and independently authenticated webhooks intentionally granted full permissions)

Never set `overrideAccess: true` out of habit or by copying a nearby call — pick the value this call means.

See [QUERIES.md#access-control-in-local-api](reference/QUERIES.md#access-control-in-local-api).

### 2. Transaction Failures in Hooks

**Nested operations in hooks without `req` break transaction atomicity.**

```ts
// ❌ DATA CORRUPTION RISK: Separate transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        overrideAccess: true,
        data: { docId: doc.id },
        // Missing req - runs in separate transaction!
      })
    },
  ]
}

// ✅ ATOMIC: Same transaction
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.create({
        collection: 'audit-log',
        overrideAccess: true,
        data: { docId: doc.id },
        req, // Maintains atomicity
      })
    },
  ]
}
```

See [ADAPTERS.md#threading-req-through-operations](reference/ADAPTERS.md#threading-req-through-operations).

### 3. Infinite Hook Loops

**Hooks triggering operations that trigger the same hooks create infinite loops.**

```ts
// ❌ INFINITE LOOP
hooks: {
  afterChange: [
    async ({ doc, req }) => {
      await req.payload.update({
        collection: 'posts',
        overrideAccess: true,
        id: doc.id,
        data: { views: doc.views + 1 },
        req,
      }) // Triggers afterChange again!
    },
  ]
}

// ✅ SAFE: Use context flag
hooks: {
  afterChange: [
    async ({ doc, req, context }) => {
      if (context.skipHooks) return

      await req.payload.update({
        collection: 'posts',
        overrideAccess: true,
        id: doc.id,
        data: { views: doc.views + 1 },
        context: { skipHooks: true },
        req,
      })
    },
  ]
}
```

See [HOOKS.md#context](reference/HOOKS.md#hook-context).

## Project Structure

```txt
src/
├── app/
│   ├── (frontend)/
│   │   └── page.tsx
│   └── (payload)/
│       └── admin/[[...segments]]/page.tsx
├── collections/
│   ├── Posts.ts
│   ├── Media.ts
│   └── Users.ts
├── globals/
│   └── Header.ts
├── components/
│   └── CustomField.tsx
├── hooks/
│   └── slugify.ts
└── payload.config.ts
```

## SmartSite / Payload 3 compatibility

This vendored official Payload skill has been adapted for SmartSite's pinned Payload 3.92.0. Start at `docs/index.md`; site-specific rules and installed package types take precedence over generic upstream examples. Do not create another Payload app inside this project. Use `pnpm build` (Next.js), `pnpm generate:types` and `pnpm generate:importmap`; the upstream Payload 4 `payload build` command is not available here. Content tasks use the SmartSite MCP contract. Normal local work uses the shipped lifecycle helpers and never inherits a production target. Do not expose users/auth collections as website content. See `UPSTREAM.md` for provenance and changes.

## Common Gotchas

1. **Local API CRUD bypasses access control by default** — explicitly set `overrideAccess: false` plus `user` or `req` for user-authorized work; reserve explicit `true` for trusted system work
2. **Missing `req` in nested operations** breaks transaction atomicity
3. **Hook loops** — operations in hooks can re-trigger the same hooks; use `req.context` flags
4. **Field-level access** returns boolean only, no query constraints
5. **Relationship depth** defaults to 2; set `depth: 0` for IDs only
6. **Draft status** — `_status` field is auto-injected when drafts are enabled
7. **Generate types/import maps** after schema changes using the project scripts, then type-check and inspect the actual CMS.
8. **MongoDB transactions** require replica set configuration
9. **Computed virtual titles** — fields configured with `virtual: true` cannot be used in `admin.useAsTitle`; use a stored top-level field

## Best Practices

### Content Modeling

- Enable `versions: { drafts: true }` by default on content collections; rely on the
  auto-injected `_status` field rather than adding a custom `status` field
- Use `...slugField('title')` from `@/fields/slug` for SmartSite routed content
- Use a stored top-level field for `admin.useAsTitle`; never use a computed
  `virtual: true` field as the title
- Reserve `position: 'sidebar'` for short, at-a-glance fields (status, category,
  author, date); keep long fields (description, rich text) in the main area

### Security

- Default to restrictive access, gradually add permissions
- Use `overrideAccess: false` whenever the call acts for a user, and pass that `user`
- Field-level access only returns boolean (no query constraints)
- Never trust client-provided data
- Use `saveToJWT: true` for roles to avoid database lookups

### Performance

- Index frequently queried fields
- Use `select` to limit returned fields
- Set `maxDepth` on relationships to prevent over-fetching
- Prefer query constraints over async operations in access control
- Cache expensive operations in `req.context`

### Data Integrity

- Always pass `req` to nested operations in hooks
- Use context flags to prevent infinite hook loops
- Enable transactions for MongoDB (requires replica set) and Postgres
- Use `beforeValidate` for data formatting
- Use `beforeChange` for business logic

### Type Safety

- Use the project type/import-map scripts after changing the schema; verify generated files and type-check.
- Import types from generated `payload-types.ts`
- Type your user object: `import type { User } from '@/payload-types'`
- Use field type guards for runtime type checking
- When extracting any Payload value into a named constant — a collection, field, hook, access function, plugin, etc. — annotate it with the matching Payload type (`CollectionConfig`, `Field`, `CollectionBeforeChangeHook`, `Access`, `Plugin`, …) or use `satisfies <Type>`. Without an annotation, string properties like `type: 'text'` widen to `string` and discriminated unions (`Field`, `CollectionConfig`) fail to resolve. Inline literals get this for free via contextual typing; extracted constants do not.

### Organization

- Keep collections in separate files
- Extract access control to `access/` directory
- Extract hooks to `hooks/` directory
- Use reusable field factories for common patterns
- Document complex access control with comments

## Reference Documentation

- **[FIELDS.md](reference/FIELDS.md)** - All field types, validation, admin options
- **[FIELD-TYPE-GUARDS.md](reference/FIELD-TYPE-GUARDS.md)** - Type guards for runtime field type checking and narrowing
- **[COLLECTIONS.md](reference/COLLECTIONS.md)** - Collection configs, auth, upload, drafts, live preview
- **[HOOKS.md](reference/HOOKS.md)** - Collection hooks, field hooks, context patterns
- **[ACCESS-CONTROL.md](reference/ACCESS-CONTROL.md)** - Collection, field, global access control, RBAC, multi-tenant
- **[ACCESS-CONTROL-ADVANCED.md](reference/ACCESS-CONTROL-ADVANCED.md)** - Context-aware, time-based, subscription-based access, factory functions, templates
- **[QUERIES.md](reference/QUERIES.md)** - Query operators, Local/REST/GraphQL APIs
- **[ENDPOINTS.md](reference/ENDPOINTS.md)** - Custom API endpoints: authentication, helpers, request/response patterns
- **[ADAPTERS.md](reference/ADAPTERS.md)** - Database, storage, email adapters, transactions
- **[ADVANCED.md](reference/ADVANCED.md)** - Authentication, jobs, endpoints, components, plugins, localization
- **[PLUGIN-DEVELOPMENT.md](reference/PLUGIN-DEVELOPMENT.md)** - Plugin architecture, monorepo structure, patterns, best practices

## Resources

- llms-full.txt: <https://payloadcms.com/llms-full.txt>
- Docs: <https://payloadcms.com/docs>
- GitHub: <https://github.com/payloadcms/payload>
- Examples: <https://github.com/payloadcms/payload/tree/v3.92.0/examples>
- Templates: <https://github.com/payloadcms/payload/tree/v3.92.0/templates>
