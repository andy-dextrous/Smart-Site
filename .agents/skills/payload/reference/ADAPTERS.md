# Payload Adapters Reference

Complete reference for database, storage, and email adapters.

## Database Adapters

### MongoDB

```ts
import { mongooseAdapter } from '@payloadcms/db-mongodb'

export default buildConfig({
  db: mongooseAdapter({
    url: process.env.DATABASE_URL,
  }),
})
```

### Postgres

```ts
import { postgresAdapter } from '@payloadcms/db-postgres'

export default buildConfig({
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL,
    },
    push: false, // Don't auto-push schema changes
    migrationDir: './migrations',
  }),
})
```

## Transactions

Payload automatically uses transactions for all-or-nothing database operations. Pass `req` to include operations in the same transaction.

```ts
import type { CollectionAfterChangeHook } from 'payload'

const afterChange: CollectionAfterChangeHook = async ({ req, doc }) => {
  // This will be part of the same transaction
  await req.payload.create({
    req, // Pass req to use same transaction
    collection: 'audit-log',
    overrideAccess: true,
    data: { action: 'created', docId: doc.id },
  })
}

// Manual transaction control
const transactionID = await payload.db.beginTransaction()
if (!transactionID) throw new Error('This operation requires transaction support')
try {
  await payload.create({
    collection: 'orders',
    overrideAccess: true,
    data: orderData,
    req: { transactionID },
  })
  await payload.update({
    collection: 'inventory',
    overrideAccess: true,
    id: itemId,
    data: { stock: newStock },
    req: { transactionID },
  })
  await payload.db.commitTransaction(transactionID)
} catch (error) {
  await payload.db.rollbackTransaction(transactionID)
  throw error
}
```

**Note**: MongoDB requires a replica set for transactions. Verify the selected adapter’s transaction support before relying on atomic nested writes.

### Threading req Through Operations

**Critical**: When performing nested operations in hooks, always pass `req` to maintain transaction context. Failing to do so breaks atomicity and can cause partial updates.

```ts
import type { CollectionAfterChangeHook } from 'payload'

// ✅ CORRECT: Thread req through nested operations
const resaveChildren: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  // Find children - pass req
  const children = await req.payload.find({
    collection: 'children',
    overrideAccess: true,
    where: { parent: { equals: doc.id } },
    req, // Maintains transaction context
  })

  // Update each child - pass req
  for (const child of children.docs) {
    await req.payload.update({
      id: child.id,
      collection: 'children',
      overrideAccess: true,
      data: { updatedField: 'value' },
      req, // Same transaction as parent operation
    })
  }
}

// ❌ WRONG: Missing req breaks transaction
const brokenHook: CollectionAfterChangeHook = async ({ collection, doc, req }) => {
  const children = await req.payload.find({
    collection: 'children',
    overrideAccess: true,
    where: { parent: { equals: doc.id } },
    // Missing req - separate transaction or no transaction
  })

  for (const child of children.docs) {
    await req.payload.update({
      id: child.id,
      collection: 'children',
      overrideAccess: true,
      data: { updatedField: 'value' },
      // Missing req - if parent operation fails, these updates persist
    })
  }
}
```

**Why This Matters:**

- **MongoDB (with replica sets)**: Creates atomic session across operations
- **PostgreSQL**: All operations use same Drizzle transaction
- **Without req**: Each operation runs independently, breaking atomicity

**When req is Required:**

- All mutating operations in hooks (create, update, delete)
- Operations that must succeed/fail together
- When using MongoDB replica sets or Postgres
- Any operation that relies on `req.context` or `req.user`

**When req is Optional:**

- Read-only lookups independent of current transaction
- Operations with `disableTransaction: true`
`overrideAccess: true` only changes permission checks; it never removes the need to share `req` for atomic work.

## Storage Adapters

SmartSite ships S3-compatible and Vercel Blob integrations. Keep its existing environment-based storage selection and prefix settings. When adding another provider, install its Payload-3.92-compatible adapter and read that installed package’s types; do not copy an unversioned provider recipe into the config.

### AWS S3

```ts
import { s3Storage } from '@payloadcms/storage-s3'

export default buildConfig({
  plugins: [
    s3Storage({
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET,
      config: {
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID,
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        },
        region: process.env.S3_REGION,
      },
    }),
  ],
})
```

### Vercel Blob

```ts
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'

export default buildConfig({
  plugins: [
    vercelBlobStorage({
      collections: {
        media: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
})
```

## Email Adapters

### Resend

```ts
import { resendAdapter } from '@payloadcms/email-resend'

export default buildConfig({
  email: resendAdapter({
    defaultFromAddress: 'noreply@example.com',
    defaultFromName: 'My App',
    apiKey: process.env.RESEND_API_KEY,
  }),
})
```
