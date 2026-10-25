# Payload Advanced Features

Complete reference for authentication, jobs, custom endpoints, components, plugins, and localization.

## Authentication

### Login

```ts
// REST API
const response = await fetch('/api/users/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password',
  }),
})

// Local API
const result = await payload.login({
  collection: 'users',
  overrideAccess: false, // preserve access checks while processing the authenticated user
  data: {
    email: 'user@example.com',
    password: 'password',
  },
})
```

### Forgot Password

```ts
await payload.forgotPassword({
  collection: 'users',
  overrideAccess: true,
  data: {
    email: 'user@example.com',
  },
})
```

### Custom Strategy

```ts
import type { CollectionConfig, AuthStrategyFunction } from 'payload'

const authenticate: AuthStrategyFunction = async ({ headers }) => {
    const token = headers.get('authorization')?.split(' ')[1]
    if (!token) return { user: null }

    const user = await verifyToken(token)
    return { user } // include the auth collection on a valid Payload user
}
const customStrategy = { name: 'custom', authenticate }

export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    strategies: [customStrategy],
  },
  fields: [],
}
```

### API Keys

```ts
import type { CollectionConfig } from 'payload'

export const APIKeys: CollectionConfig = {
  slug: 'api-keys',
  auth: {
    disableLocalStrategy: true,
    useAPIKey: true,
  },
  fields: [],
}
```

## Jobs Queue

Offload long-running or scheduled tasks to background workers.

### Tasks

```ts
import { buildConfig } from 'payload'

import type { TaskConfig } from 'payload'

export default buildConfig({
  jobs: {
    tasks: [
      {
        slug: 'sendWelcomeEmail',
        inputSchema: [
          { name: 'userEmail', type: 'text', required: true },
          { name: 'userName', type: 'text', required: true },
        ],
        outputSchema: [{ name: 'emailSent', type: 'checkbox', required: true }],
        retries: 2, // Retry up to 2 times on failure
        handler: async ({ input, req }) => {
          await sendEmail({
            to: input.userEmail,
            subject: `Welcome ${input.userName}`,
          })
          return { output: { emailSent: true } }
        },
      } as TaskConfig<'sendWelcomeEmail'>,
    ],
  },
})
```

### Queueing Jobs

```ts
// In a trusted hook or other system operation
await req.payload.jobs.queue({
  task: 'sendWelcomeEmail',
  input: {
    userEmail: 'user@example.com',
    userName: 'John',
  },
  overrideAccess: true,
  req, // share the hook transaction
  waitUntil: new Date('2024-12-31'), // Optional: schedule for future
})
```

### Workflows

Register workflows under `jobs.workflows`. The handler receives `inlineTask` and `tasks` directly; tasks need stable IDs for retries and output reuse.

```ts
import type { WorkflowConfig } from 'payload'

export const onboardUser: WorkflowConfig<{ userId: string }> = {
  slug: 'onboardUser',
  inputSchema: [{ name: 'userId', type: 'text', required: true }],
  handler: async ({ job, inlineTask }) => {
    await inlineTask('welcome-email', {
      input: { userId: job.input.userId },
      task: async ({ input }) => {
        await sendWelcomeEmail(input.userId) // app-provided, idempotent delivery
        return { output: { emailSent: true } }
      },
    })
    await inlineTask('onboarding-records', {
      input: { userId: job.input.userId },
      task: async ({ input, req }) => {
        await createOnboardingRecords(input.userId, req) // app-provided
        return { output: { recordsCreated: true } }
      },
    })
  },
}
```

Queueing does not execute a job. SmartSite ships without scheduled services. Only enable native scheduled publishing and configure a runner when the site needs them; verify completion through that explicitly chosen runner. After registering task/workflow schemas, regenerate Payload types before using their typed slugs.

## Custom Endpoints

Add custom REST API routes to collections, globals, or root config. See [ENDPOINTS.md](ENDPOINTS.md) for detailed patterns, authentication, helpers, and real-world examples.

### Root Endpoints

```ts
import { buildConfig } from 'payload'

import type { Endpoint } from 'payload'

const helloEndpoint: Endpoint = {
  path: '/hello',
  method: 'get',
  handler: () => {
    return Response.json({ message: 'Hello!' })
  },
}

const greetEndpoint: Endpoint = {
  path: '/greet/:name',
  method: 'get',
  handler: (req) => {
    return Response.json({
      message: `Hello ${req.routeParams.name}!`,
    })
  },
}

export default buildConfig({
  endpoints: [helloEndpoint, greetEndpoint],
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
})
```

### Collection Endpoints

```ts
import type { CollectionConfig, Endpoint } from 'payload'

const featuredEndpoint: Endpoint = {
  path: '/featured',
  method: 'get',
  handler: async (req) => {
    const posts = await req.payload.find({
      collection: 'posts',
      overrideAccess: false,
      req,
      where: { featured: { equals: true } },
    })
    return Response.json(posts)
  },
}

export const Posts: CollectionConfig = {
  slug: 'posts',
  endpoints: [featuredEndpoint],
  fields: [
    { name: 'title', type: 'text' },
    { name: 'featured', type: 'checkbox' },
  ],
}
```

## Custom Components

### Field Component (Client)

```tsx
'use client'
import type React from 'react'
import { useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

export const CustomField: React.FC<TextFieldClientProps> = () => {
  const { value, setValue } = useField<string>()

  return <input value={value || ''} onChange={(e) => setValue(e.target.value)} />
}
```

### Custom View

Use a server component for a view that renders `DefaultTemplate` from `@payloadcms/next/templates`. It needs the authenticated view props; do not import an RSC template into a `'use client'` file. Follow an existing view and its installed `AdminViewServerProps` type. Put interactive controls in a separate client component.

### Admin Config

```ts
import { buildConfig } from 'payload'

export default buildConfig({
  admin: {
    components: {
      beforeDashboard: ['/components/BeforeDashboard'],
      beforeLogin: ['/components/BeforeLogin'],
      views: {
        custom: {
          Component: '/views/Custom',
          path: '/custom',
        },
      },
    },
  },
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
})
```

## Plugins

### Available Plugins

- **@payloadcms/plugin-seo** - SEO fields with meta title/description, Open Graph, preview generation
- **@payloadcms/plugin-redirects** - Manage URL redirects (301/302) for Next.js apps
- **@payloadcms/plugin-nested-docs** - Hierarchical document structures with breadcrumbs
- **@payloadcms/plugin-form-builder** - Dynamic form builder with submissions and validation
- **@payloadcms/plugin-search** - Search collection populated from configured source collections
- **@payloadcms/plugin-stripe** - Stripe payments, subscriptions, webhooks
- **@payloadcms/plugin-ecommerce** - Complete ecommerce solution (products, variants, carts, orders)
- **@payloadcms/plugin-import-export** - Import/export data via CSV
- **@payloadcms/plugin-multi-tenant** - Multi-tenancy with tenant isolation
- **@payloadcms/plugin-sentry** - Sentry error tracking integration
- **@payloadcms/plugin-mcp** - Model Context Protocol for AI integrations

### Using Plugins

```ts
import { buildConfig } from 'payload'

import { seoPlugin } from '@payloadcms/plugin-seo'
import { redirectsPlugin } from '@payloadcms/plugin-redirects'

export default buildConfig({
  plugins: [
    seoPlugin({
      collections: ['posts', 'pages'],
    }),
    redirectsPlugin({
      collections: ['pages'],
    }),
  ],
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
})
```

### Creating Plugins

```ts
import type { Config } from 'payload'

interface PluginOptions {
  enabled?: boolean
}

export const myPlugin =
  (options: PluginOptions) =>
  (config: Config): Config => ({
    ...config,
    collections: [
      ...(config.collections || []),
      {
        slug: 'plugin-collection',
        fields: [{ name: 'title', type: 'text' }],
      },
    ],
    onInit: async (payload) => {
      if (config.onInit) await config.onInit(payload)
      // Plugin initialization
    },
  })
```

## Localization

```ts
import { buildConfig } from 'payload'

import type { TextField } from 'payload'

export default buildConfig({
  localization: {
    locales: ['en', 'es', 'de'],
    defaultLocale: 'en',
    fallback: true,
  },
  collections: [],
  secret: process.env.PAYLOAD_SECRET || '',
})

// Localized field
const localizedField: TextField = {
  name: 'title',
  type: 'text',
  localized: true,
}

// Query with locale
const posts = await payload.find({
  collection: 'posts',
  overrideAccess: true,
  locale: 'es',
})
```

## TypeScript Type References

For complete TypeScript type definitions and signatures, reference these files from the Payload source:

### Core Configuration Types

- **[All Commonly-Used Types](https://github.com/payloadcms/payload/blob/v3.92.0/packages/payload/src/index.ts)** - Check here first for commonly used types and interfaces. All core types are exported from this file.

### Database & Adapters

- **[Database Adapter Types](https://github.com/payloadcms/payload/blob/v3.92.0/packages/payload/src/database/types.ts)** - Base adapter interface
- **[MongoDB Adapter](https://github.com/payloadcms/payload/blob/v3.92.0/packages/db-mongodb/src/index.ts)** - MongoDB-specific options
- **[Postgres Adapter](https://github.com/payloadcms/payload/blob/v3.92.0/packages/db-postgres/src/index.ts)** - Postgres-specific options

### Rich Text & Plugins

- **[Lexical Types](https://github.com/payloadcms/payload/blob/v3.92.0/packages/richtext-lexical/src/exports/server/index.ts)** - Lexical editor configuration

Resolve signatures from the installed package’s `dist/**/*.d.ts` and implementation first. The links above are pinned to v3.92.0; unversioned online documentation can describe a later major version.
