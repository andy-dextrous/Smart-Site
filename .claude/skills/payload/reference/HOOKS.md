# Payload Hooks Reference

Complete reference for collection hooks, field hooks, and hook context patterns.

## Collection Hooks

```ts
export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    // Before validation
    beforeValidate: [
      async ({ data, operation }) => {
        if (operation === 'create') {
          data.slug = slugify(data.title)
        }
        return data
      },
    ],

    // Before save
    beforeChange: [
      async ({ data, req, operation, originalDoc }) => {
        if (operation === 'update' && data._status === 'published') {
          data.publishedAt = new Date().toISOString()
        }
        return data
      },
    ],

    // After the write, but BEFORE the enclosing transaction commits
    afterChange: [
      async ({ doc, req, operation, previousDoc }) => {
        if (operation === 'create') {
          await req.payload.jobs.queue({
            task: 'sendNotification', // register this task in jobs.tasks
            input: { documentId: doc.id },
            overrideAccess: true, // trusted system notification
            req, // job and document commit together
          })
        }
        return doc
      },
    ],

    // After read
    afterRead: [
      async ({ doc, req }) => {
        doc.viewCount = await getViewCount(doc.id)
        return doc
      },
    ],

    // Before delete
    beforeDelete: [
      async ({ req, id }) => {
        await cleanupRelatedData(id, req) // thread req into its nested Local API calls
      },
    ],
  },
}
```

## Field Hooks

```ts
import type { EmailField, FieldHook } from 'payload'
import { userHasMinimumRole } from '@/payload/access/roles'

const beforeValidateHook: FieldHook = ({ value }) => {
  return typeof value === 'string' ? value.trim().toLowerCase() : value
}

const emailField: EmailField = {
  name: 'email',
  type: 'email',
  access: { read: ({ req }) => userHasMinimumRole(req.user, 'admin') },
  hooks: {
    beforeValidate: [beforeValidateHook],
  },
}
```

## Hook Context

Share data between hooks or control hook behavior using request context:

```ts
import type { CollectionConfig } from 'payload'

export const Posts: CollectionConfig = {
  slug: 'posts',
  hooks: {
    beforeChange: [
      async ({ context }) => {
        context.expensiveData = await fetchExpensiveData()
      },
    ],
    afterChange: [
      async ({ context, doc }) => {
        // Reuse from previous hook
        await processData(doc, context.expensiveData)
      },
    ],
  },
  fields: [{ name: 'title', type: 'text' }],
}
```

## SmartSite Publication and Cache Invalidation

Collection `afterChange` runs before the enclosing database transaction commits. Direct `revalidatePath`, email delivery or other external effects there can escape a later rollback or refill a cache with old data. Write a durable intent/job with the same `req`, then let the configured worker process committed work.

SmartSite already wires universal collection hooks and global publication hooks. Preserve those hooks when extending a collection; do not add a second direct invalidation path. A settings-like global can request a refresh using the existing helper:

```ts
import type { GlobalAfterChangeHook } from 'payload'
import { queuePublication } from '@/website/publication/intent'

export const afterSettingsChange: GlobalAfterChangeHook = async ({ doc, req, global }) => {
  await queuePublication(req, 'refresh', `global/${global.slug}`)
  return doc
}
```

For routed collections follow `src/payload/hooks/collections/universal/after-change.ts` and `after-delete.ts`: route-index updates and intent creation share the request. Normal saves drain publication work in the serving request. Verify actual public HTTP output after a publish, draft edit, rename, unpublish and delete; explicitly drain interrupted or large work through the authenticated endpoint when no optional background runner is enabled. Do not use a guessed `/${doc.slug}` path when the site has nested URIs or custom templates.

## Date Field Auto-Set

Automatically set date when document is published:

```ts
import type { DateField } from 'payload'

const publishedOnField: DateField = {
  name: 'publishedOn',
  type: 'date',
  admin: {
    date: {
      pickerAppearance: 'dayAndTime',
    },
    position: 'sidebar',
  },
  hooks: {
    beforeChange: [
      ({ siblingData, value }) => {
        if (siblingData._status === 'published' && !value) {
          return new Date().toISOString()
        }
        return value
      },
    ],
  },
}
```

## Hook Patterns Best Practices

- Use `beforeValidate` for data formatting
- Use `beforeChange` for business logic
- Use `afterChange` for transactional follow-up writes; queue external effects for execution after commit
- Use `afterRead` for computed fields
- Store expensive operations in `context`
- Pass `req` to nested operations for transaction safety (see [ADAPTERS.md#threading-req-through-operations](ADAPTERS.md#threading-req-through-operations))
