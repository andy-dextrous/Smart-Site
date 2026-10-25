# Payload Plugin Development

Patterns for Payload 3.92 plugins. In SmartSite, add site-local plugins under `src/payload/plugins` and compose them in the existing config. Package scaffolding below applies only when deliberately creating a separately distributed plugin; it does not require another app inside this site.

## Plugin Architecture

Plugins are functions that receive configuration options and return a function that transforms the Payload config:

```ts
import type { Config, Plugin } from 'payload'

interface MyPluginConfig {
  enabled?: boolean
  collections?: string[]
}

export const myPlugin =
  (options: MyPluginConfig): Plugin =>
  (config: Config): Config => ({
    ...config,
    // Transform config here
  })
```

**Key Pattern:** Double arrow function (currying)

- First function: Accepts plugin options, returns plugin function
- Second function: Accepts Payload config, returns modified config

## Plugin Package Structure

### Simple Structure

```
plugin-<name>/
├── package.json              # Package metadata and dependencies
├── README.md                 # Plugin documentation
├── LICENSE.md                # License file
└── src/
    ├── index.ts              # Entry point, re-exports plugin and config types
    ├── plugin.ts             # Plugin implementation
    ├── types.ts              # TypeScript type definitions
    └── exports/              # Additional entry points (optional)
        └── types.ts          # Type-only exports
```

### Exhaustive Structure

```
plugin-<name>/
├── .swcrc                    # SWC compiler config
├── package.json              # Package metadata and dependencies
├── tsconfig.json             # TypeScript config
├── README.md                 # Plugin documentation
├── LICENSE.md                # License file
├── eslint.config.js          # ESLint configuration (optional)
├── vitest.config.ts          # Vitest test configuration (optional)
├── playwright.config.js      # Playwright e2e tests (optional)
└── src/
    ├── index.ts              # Entry point, re-exports plugin and config types
    ├── plugin.ts             # Plugin implementation
    ├── types.ts              # TypeScript type definitions
    ├── defaults.ts           # Default configuration values (optional)
    ├── endpoints/            # Custom API endpoints (optional)
    │   └── handler.ts
    ├── components/           # React components (optional)
    │   ├── ClientComponent.tsx    # 'use client' components
    │   └── ServerComponent.tsx    # RSC components
    ├── fields/               # Custom field components (optional)
    │   ├── FieldName/
    │   │   ├── index.ts      # Field config
    │   │   └── Component.tsx # Client component
    ├── exports/              # Additional entry points
    │   ├── types.ts          # Type-only exports
    │   ├── fields.ts         # Field-only exports
    │   ├── client.ts         # Re-export client components
    │   └── rsc.ts            # Re-export server components (RSC)
    ├── translations/         # i18n translations (optional)
    │   └── index.ts
    └── ui/                   # Admin UI components (optional)
        └── Component.tsx
```

**Key additions from official template:**

- **dev/** directory with complete Payload project for local testing
- **src/exports/rsc.ts** for React Server Component exports
- **src/components/** for organizing React components
- **src/endpoints/** for custom API endpoint handlers
- Test configuration files (vitest.config.ts, playwright.config.js)

## Package.json Configuration

```json
{
  "name": "payload-plugin-example",
  "version": "1.0.0",
  "description": "A Payload plugin",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./types": {
      "import": "./dist/exports/types.js",
      "types": "./dist/exports/types.d.ts"
    },
    "./client": {
      "import": "./dist/exports/client.js",
      "types": "./dist/exports/client.d.ts"
    },
    "./rsc": {
      "import": "./dist/exports/rsc.js",
      "types": "./dist/exports/rsc.d.ts"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "npm run copyfiles && npm run build:types && npm run build:swc",
    "build:swc": "swc ./src -d ./dist --config-file .swcrc --strip-leading-paths",
    "build:types": "tsc --emitDeclarationOnly --outDir dist",
    "clean": "rimraf dist *.tsbuildinfo",
    "copyfiles": "copyfiles -u 1 \"src/**/*.{html,css,scss,ttf,woff,woff2,eot,svg,jpg,png,json}\" dist/",
    "dev": "next dev dev --turbo",
    "dev:generate-types": "cross-env PAYLOAD_CONFIG_PATH=./dev/payload.config.ts payload generate:types",
    "dev:payload": "cross-env PAYLOAD_CONFIG_PATH=./dev/payload.config.ts payload",
    "test": "npm run test:int && npm run test:e2e",
    "test:int": "vitest",
    "test:e2e": "playwright test",
    "lint": "eslint",
    "lint:fix": "eslint ./src --fix",
    "prepublishOnly": "npm run clean && npm run build"
  },
  "dependencies": {
    "@payloadcms/translations": "3.92.0",
    "@payloadcms/ui": "3.92.0"
  },
  "devDependencies": {
    "@payloadcms/db-mongodb": "3.92.0",
    "@payloadcms/next": "3.92.0",
    "@payloadcms/richtext-lexical": "3.92.0",
    "@playwright/test": "^1.63.0",
    "@swc/cli": "^0.7.9",
    "@swc/core": "^1.15.3",
    "copyfiles": "^2.4.1",
    "cross-env": "10.1.0",
    "eslint": "^9.39.2",
    "next": "16.3.3",
    "payload": "3.92.0",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "rimraf": "^6.0.1",
    "typescript": "^5.9.3",
    "vitest": "5.0.1"
  },
  "peerDependencies": {
    "payload": "3.92.0"
  },
  "engines": {
    "node": ">=24.22.1"
  }
}
```

**Key Points:**

- `type: "module"` for ESM
- Compiled output in `./dist`, source in `./src`
- Payload as peer dependency (user installs it)
- Multiple export entry points: main, `/types`, `/client`, `/rsc`
- `/client` for client components, `/rsc` for React Server Components
- SWC for fast compilation
- Dev scripts for local development with Next.js
- Test scripts for both integration (Vitest) and e2e (Playwright) tests
- `prepublishOnly` ensures build before publish

## Plugin Patterns

### Adding Fields to Collections

```ts
import type { Config, Plugin, Field } from 'payload'

export const seoPlugin =
  (options: { collections?: string[] }): Plugin =>
  (config: Config): Config => {
    const seoFields: Field[] = [
      {
        name: 'meta',
        type: 'group',
        fields: [
          { name: 'title', type: 'text' },
          { name: 'description', type: 'textarea' },
        ],
      },
    ]

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (options.collections?.includes(collection.slug)) {
          return {
            ...collection,
            fields: [...(collection.fields || []), ...seoFields],
          }
        }
        return collection
      }),
    }
  }
```

### Adding New Collections

```ts
import type { Config, Plugin, CollectionConfig } from 'payload'

export const redirectsPlugin =
  (options: { overrides?: Partial<CollectionConfig> }): Plugin =>
  (config: Config): Config => {
    const redirectsCollection: CollectionConfig = {
      slug: 'redirects',
      access: { read: () => true },
      fields: [
        { name: 'from', type: 'text', required: true, unique: true },
        { name: 'to', type: 'text', required: true },
      ],
      ...options.overrides,
    }

    return {
      ...config,
      collections: [...(config.collections || []), redirectsCollection],
    }
  }
```

### Adding Hooks

```ts
import type { Config, Plugin, CollectionAfterChangeHook } from 'payload'

const auditChange: CollectionAfterChangeHook = async ({ doc, req, collection }) => {
  // The plugin must register this audit collection. Keep the original transaction.
  await req.payload.create({
    collection: 'audit-log',
    overrideAccess: true, // trusted system record, not a user-authorized content write
    req,
    data: { collection: collection.slug, documentId: String(doc.id) },
  })
  return doc
}

export const nestedDocsPlugin =
  (options: { collections: string[] }): Plugin =>
  (config: Config): Config => ({
    ...config,
    collections: (config.collections || []).map((collection) => {
      if (options.collections.includes(collection.slug)) {
        return {
          ...collection,
          hooks: {
            ...(collection.hooks || {}),
            afterChange: [auditChange, ...(collection.hooks?.afterChange || [])],
          },
        }
      }
      return collection
    }),
  })
```

### Adding Root-Level Endpoints

Add endpoints at the root config level (accessible at `/api/<path>`):

```ts
import type { Config, Plugin, Endpoint } from 'payload'

export const seoPlugin =
  (options: { generateTitle?: (doc: any) => string }): Plugin =>
  (config: Config): Config => {
    const generateTitleEndpoint: Endpoint = {
      path: '/plugin-seo/generate-title',
      method: 'post',
      handler: async (req) => {
        const data = await req.json?.()
        const result = options.generateTitle ? options.generateTitle(data.doc) : ''
        return Response.json({ result })
      },
    }

    return {
      ...config,
      endpoints: [...(config.endpoints ?? []), generateTitleEndpoint],
    }
  }
```

**Example webhook endpoint:**

```ts
// Useful for integrations like Stripe
const webhookEndpoint: Endpoint = {
  path: '/stripe/webhook',
  method: 'post',
  handler: async (req) => {
    const signature = req.headers.get('stripe-signature')
    const event = stripe.webhooks.constructEvent(
      await req.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    )
    // Handle webhook
    return Response.json({ received: true })
  },
}
```

### Field Overrides with Defaults

```ts
import type { Config, Plugin, Field } from 'payload'

type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

interface PluginConfig {
  collections?: string[]
  fields?: FieldsOverride
}

export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => {
    const defaultFields: Field[] = [
      { name: 'title', type: 'text' },
      { name: 'description', type: 'textarea' },
    ]

    const fields =
      options.fields && typeof options.fields === 'function'
        ? options.fields({ defaultFields })
        : defaultFields

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (options.collections?.includes(collection.slug)) {
          return {
            ...collection,
            fields: [...(collection.fields || []), ...fields],
          }
        }
        return collection
      }),
    }
  }
```

### Tabs UI Pattern

```ts
import type { Config, Plugin, TabsField, GroupField } from 'payload'

export const seoPlugin =
  (options: { tabbedUI?: boolean }): Plugin =>
  (config: Config): Config => {
    const seoFields: GroupField[] = [
      {
        name: 'meta',
        type: 'group',
        fields: [{ name: 'title', type: 'text' }],
      },
    ]

    return {
      ...config,
      collections: config.collections?.map((collection) => {
        if (options.tabbedUI) {
          const seoTabs: TabsField[] = [
            {
              type: 'tabs',
              tabs: [
                // If existing tabs, preserve them
                ...(collection.fields?.[0]?.type === 'tabs'
                  ? collection.fields[0].tabs
                  : [
                      {
                        label: 'Content',
                        fields: collection.fields || [],
                      },
                    ]),
                // Add SEO tab
                {
                  label: 'SEO',
                  fields: seoFields,
                },
              ],
            },
          ]

          return {
            ...collection,
            fields: [
              ...seoTabs,
              ...(collection.fields?.[0]?.type === 'tabs' ? collection.fields.slice(1) : []),
            ],
          }
        }

        return {
          ...collection,
          fields: [...(collection.fields || []), ...seoFields],
        }
      }),
    }
  }
```

### Disable Plugin Pattern

Allow users to disable plugin without removing it (important for database schema consistency):

```ts
import type { Config, Plugin } from 'payload'

interface PluginConfig {
  disabled?: boolean
  collections?: string[]
}

export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => {
    // Always add collections/fields for database schema consistency
    if (!config.collections) {
      config.collections = []
    }

    config.collections.push({
      slug: 'plugin-collection',
      fields: [{ name: 'title', type: 'text' }],
    })

    // Add fields to specified collections
    if (options.collections) {
      for (const collectionSlug of options.collections) {
        const collection = config.collections.find((c) => c.slug === collectionSlug)
        if (collection) {
          collection.fields.push({
            name: 'addedByPlugin',
            type: 'text',
          })
        }
      }
    }

    // If disabled, return early but keep schema changes
    if (options.disabled) {
      return config
    }

    // Add endpoints, hooks, components only when enabled
    config.endpoints = [
      ...(config.endpoints ?? []),
      {
        path: '/my-endpoint',
        method: 'get',
        handler: async () => Response.json({ message: 'Hello' }),
      },
    ]

    return config
  }
```

### Admin Components

Add custom UI components to the admin panel:

```ts
import type { Config, Plugin } from 'payload'

export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => {
    if (!config.admin) config.admin = {}
    if (!config.admin.components) config.admin.components = {}
    if (!config.admin.components.beforeDashboard) {
      config.admin.components.beforeDashboard = []
    }

    // Add client component
    config.admin.components.beforeDashboard.push('my-plugin-name/client#BeforeDashboardClient')

    // Add server component (RSC)
    config.admin.components.beforeDashboard.push('my-plugin-name/rsc#BeforeDashboardServer')

    return config
  }
```

**Component file structure:**

```tsx
// src/components/BeforeDashboardClient.tsx
'use client'
import { useConfig } from '@payloadcms/ui'
import { useEffect, useState } from 'react'
import { formatAdminURL } from 'payload/shared'

export const BeforeDashboardClient = () => {
  const { config } = useConfig()
  const [data, setData] = useState('')

  useEffect(() => {
    fetch(
      formatAdminURL({
        apiRoute: config.routes.api,
        path: '/my-endpoint',
      }),
    )
      .then((res) => res.json())
      .then(setData)
  }, [config.serverURL, config.routes.api])

  return <div>Client Component: {data}</div>
}

// src/components/BeforeDashboardServer.tsx
export const BeforeDashboardServer = () => {
  return <div>Server Component</div>
}

// src/exports/client.ts
export { BeforeDashboardClient } from '../components/BeforeDashboardClient.js'

// src/exports/rsc.ts
export { BeforeDashboardServer } from '../components/BeforeDashboardServer.js'
```

### Translations (i18n)

```ts
// src/translations/index.ts
export const translations = {
  en: {
    'plugin-name:fieldLabel': 'Field Label',
    'plugin-name:fieldDescription': 'Field description',
  },
  es: {
    'plugin-name:fieldLabel': 'Etiqueta del campo',
    'plugin-name:fieldDescription': 'Descripción del campo',
  },
}

// src/plugin.ts
import { deepMergeSimple } from 'payload/shared'
import { translations } from './translations/index.js'

export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => ({
    ...config,
    i18n: {
      ...config.i18n,
      translations: deepMergeSimple(translations, config.i18n?.translations ?? {}),
    },
  })
```

### onInit Hook

```ts
export const myPlugin =
  (options: PluginConfig): Plugin =>
  (config: Config): Config => {
    const incomingOnInit = config.onInit

    config.onInit = async (payload) => {
      // IMPORTANT: Call existing onInit first
      if (incomingOnInit) await incomingOnInit(payload)

      // Plugin initialization
      payload.logger.info('Plugin initialized')

      // Keep seeding in an explicit, idempotent setup task. onInit also runs
      // during scripts and build tooling; do not create content on every boot.
    }

    return config
  }
```

## TypeScript Patterns

### Plugin Config Types

```ts
import type { CollectionSlug, GlobalSlug, Field, CollectionConfig } from 'payload'

export type FieldsOverride = (args: { defaultFields: Field[] }) => Field[]

export interface MyPluginConfig {
  /**
   * Collections to enable this plugin for
   */
  collections?: CollectionSlug[]
  /**
   * Globals to enable this plugin for
   */
  globals?: GlobalSlug[]
  /**
   * Override default fields
   */
  fields?: FieldsOverride
  /**
   * Enable tabbed UI
   */
  tabbedUI?: boolean
  /**
   * Override collection config
   */
  overrides?: Partial<CollectionConfig>
}
```

### Export Types

```ts
// src/exports/types.ts
export type { MyPluginConfig, FieldsOverride } from '../types.js'

// Usage
import type { MyPluginConfig } from '@payloadcms/plugin-example/types'
```

## Client Components

### Custom Field Component

```tsx
// src/fields/CustomField/Component.tsx
'use client'
import type React from 'react'
import { FieldLabel, useField } from '@payloadcms/ui'
import type { TextFieldClientProps } from 'payload'

export const CustomFieldComponent: React.FC<TextFieldClientProps> = ({ field, path }) => {
  const { value, setValue } = useField<string>({ path })

  return (
    <div>
      <FieldLabel label={field.label} required={field.required} />
      <input value={value || ''} onChange={(e) => setValue(e.target.value)} />
    </div>
  )
}
```

```ts
// src/fields/CustomField/index.ts
import type { Field } from 'payload'

export const CustomField = (overrides?: Partial<Field>): Field => ({
  name: 'customField',
  type: 'text',
  admin: {
    components: {
      Field: '/fields/CustomField/Component#CustomFieldComponent',
    },
  },
  ...overrides,
})
```

## Best Practices

### Preserve Existing Config

Always spread existing config and add to arrays:

```ts
// ✅ Good
collections: [...(config.collections || []), newCollection]

// ❌ Bad
collections: [newCollection]
```

### Respect User Overrides

Allow users to override plugin defaults:

```ts
const collection: CollectionConfig = {
  slug: 'redirects',
  fields: defaultFields,
  ...options.overrides, // User overrides last
}
```

### Conditional Logic

Check if collections/globals are enabled:

```ts
collections: config.collections?.map((collection) => {
  const isEnabled = options.collections?.includes(collection.slug)
  if (isEnabled) {
    // Transform collection
  }
  return collection
})
```

### Hook Composition

Preserve existing hooks:

```ts
hooks: {
  ...collection.hooks,
  afterChange: [
    myHook,
    ...(collection.hooks?.afterChange || []),
  ],
}
```

### Type Safety

Use Payload's exported types:

```ts
import type { Config, Plugin, CollectionConfig, Field, CollectionSlug, GlobalSlug } from 'payload'
```

### Field Path Imports

Use absolute paths for client components:

```ts
admin: {
  components: {
    Field: '/fields/CustomField/Component#CustomFieldComponent',
  },
}
```

### onInit Pattern

Always call existing `onInit` before your initialization. See [onInit Hook](#oninit-hook) pattern for full example.

## Advanced Patterns

These are composition patterns. App-specific collections, callbacks and policies must be supplied and tested against the generated types.

### Advanced Configuration

#### Async Plugin Function

Allow plugin function to be async for awaiting collection overrides or async operations:

```ts
export const myPlugin =
  (pluginConfig?: PluginConfig) =>
  async (incomingConfig: Config): Promise<Config> => {
    // Can await async operations during initialization
    const customCollection = (await pluginConfig?.collectionOverride?.({
      defaultCollection,
    })) ?? defaultCollection

    return {
      ...incomingConfig,
      collections: [...(incomingConfig.collections ?? []), customCollection],
    }
  }
```

#### Collection Override with Async Support

Allow users to override entire collections with async functions:

```ts
type CollectionOverride = (args: {
  defaultCollection: CollectionConfig
}) => CollectionConfig | Promise<CollectionConfig>

interface PluginConfig {
  products?: {
    collectionOverride?: CollectionOverride
  }
}

// In plugin
const defaultCollection = createProductsCollection(config)
const finalCollection = config.products?.collectionOverride
  ? await config.products.collectionOverride({ defaultCollection })
  : defaultCollection
```

#### Config Sanitization Pattern

Normalize plugin configuration with defaults:

```ts
export const sanitizePluginConfig = ({ pluginConfig }: Props): SanitizedPluginConfig => {
  const config = { ...pluginConfig } as Partial<SanitizedPluginConfig>

  // Normalize boolean|object configs
  if (typeof config.addresses === 'undefined' || config.addresses === true) {
    config.addresses = { addressFields: defaultAddressFields() }
  } else if (config.addresses === false) {
    config.addresses = null
  }

  // Validate required fields
  if (!config.stripeSecretKey) {
    throw new Error('Stripe secret key is required')
  }

  return config as SanitizedPluginConfig
}

// Use at plugin start
export const myPlugin =
  (pluginConfig: PluginConfig): Plugin =>
  (config) => {
    const sanitized = sanitizePluginConfig({ pluginConfig })
    // Use sanitized config throughout
  }
```

#### Collection Slug Mapping

Track collection slugs when users can override them:

```ts
type CollectionSlugMap = {
  products: string
  variants: string
  orders: string
}

const getCollectionSlugMap = ({ config }: { config: PluginConfig }): CollectionSlugMap => ({
  products: config.products?.slug || 'products',
  variants: config.variants?.slug || 'variants',
  orders: config.orders?.slug || 'orders',
})

// Use throughout plugin
const collectionSlugMap = getCollectionSlugMap({ config: pluginConfig })

// When creating relationship fields
{
  name: 'product',
  type: 'relationship',
  relationTo: collectionSlugMap.products,
}
```

#### Multi-Collection Configuration

For collection-specific behavior, map the configured collection list, preserve each existing hook array, and return its document from new hooks. Keep nested database writes on the same `req`. For external sync, record a job/intent in that transaction and perform delivery after commit; follow [HOOKS.md](HOOKS.md#smartsite-publication-and-cache-invalidation).

### TypeScript Extensions

#### TypeScript Schema Extension

Add custom properties to generated TypeScript schema:

```ts
incomingConfig.typescript = incomingConfig.typescript || {}
incomingConfig.typescript.schema = incomingConfig.typescript.schema || []

incomingConfig.typescript.schema.push((args) => {
  const { jsonSchema } = args

  jsonSchema.properties.ecommerce = {
    type: 'object',
    properties: {
      collections: {
        type: 'object',
        properties: {
          products: { type: 'string' },
          orders: { type: 'string' },
        },
      },
    },
  }

  return jsonSchema
})
```

#### Module Declaration Augmentation

Extend Payload types for plugin-specific field properties:

```ts
// In a module, augment rather than replace Payload's declarations
import 'payload'

declare module 'payload' {
  export interface FieldCustom {
    'plugin-import-export'?: {
      disabled?: boolean
      toCSV?: (value: any) => string
      fromCSV?: (value: string) => any
    }
  }
}

// Usage with TypeScript support
{
  name: 'price',
  type: 'number',
  custom: {
    'plugin-import-export': {
      toCSV: (value) => `$${value.toFixed(2)}`,
      fromCSV: (value) => parseFloat(value.replace('$', '')),
    },
  },
}
```

### Advanced Hooks

#### Global Error Hooks

Add global error handling:

```ts
return {
  ...config,
  hooks: {
    ...config.hooks,
    afterError: [
      ...(config.hooks?.afterError ?? []),
      async (args) => {
        const { error } = args
        const status = (error as APIError).status ?? 500

        if (status >= 500 || captureErrors.includes(status)) {
          captureException(error, {
            tags: {
              collection: args.collection?.slug,
            },
            user: args.req?.user ? { id: args.req.user.id } : undefined,
          })
        }
      },
    ],
  },
}
```

#### Multiple Hook Types on Same Collection

Preserve existing hook arrays. `beforeValidate` can normalize data; `beforeChange` can make transactional database decisions; `afterChange` can queue committed follow-up work by passing `req`. External writes and cache invalidation need post-commit processing. See [HOOKS.md](HOOKS.md) for SmartSite's publication helper and examples.

### Access Control & Filtering

#### Access Control Wrapper Pattern

Await the previous access function and handle both booleans and `Where` before combining constraints. The example assumes a custom, protected `tenant` field on the user and collection.

```ts
import type { Access, CollectionConfig, Where } from 'payload'

export function addTenantRead(collection: CollectionConfig) {
  const previousRead = collection.access?.read
  const read: Access = async (args) => {
    const tenant = args.req.user?.tenant
    if (!tenant) return false
    const previous = previousRead ? await previousRead(args) : Boolean(args.req.user)
    if (previous === false) return false
    const tenantWhere: Where = { tenant: { equals: tenant } }
    return previous === true ? tenantWhere : { and: [previous, tenantWhere] }
  }
  return { ...collection, access: { ...collection.access, read } }
}
```

#### BaseFilter Composition

`admin.baseFilter` is a function; `baseListFilter` is its deprecated predecessor. These affect admin selection, not API authorization.

```ts
const previousFilter = collection.admin?.baseFilter ?? collection.admin?.baseListFilter
collection.admin = {
  ...collection.admin,
  baseFilter: async (args) => {
    const previous = await previousFilter?.(args)
    const tenantFilter = { tenant: { equals: args.req.user?.tenant } }
    return previous ? { and: [previous, tenantFilter] } : tenantFilter
  },
}
```

#### Relationship FilterOptions Modification

`filterOptions` can be a `Where` object or a function returning a boolean or `Where`. Preserve false, await functions, and pass their full arguments. It filters selectable related records; collection access still protects their API.

```ts
import type { FilterOptionsProps } from 'payload'

collection.fields = collection.fields.map((field) => {
  if (field.type !== 'relationship') return field
  const previousFilter = field.filterOptions
  return {
    ...field,
    filterOptions: async (args: FilterOptionsProps) => {
      const previous = typeof previousFilter === 'function'
        ? await previousFilter(args) : previousFilter
      if (previous === false) return false
      const tenant = args.req.user?.tenant
      if (!tenant) return false
      const tenantFilter = { tenant: { equals: tenant } }
      return previous && previous !== true
        ? { and: [previous, tenantFilter] } : tenantFilter
    },
  }
})
```

### Admin UI Customization

#### Metadata Storage Pattern

Use `collection.admin.custom` for custom client-visible metadata. Keep secrets in server-only configuration. `admin.meta` is page metadata, not arbitrary plugin state.

```ts
collection.admin = {
  ...collection.admin,
  custom: { ...collection.admin?.custom, myPlugin: { enabled: true } },
}
```

#### Custom Provider Pattern

Providers belong to the root admin config:

```ts
config.admin = {
  ...config.admin,
  components: {
    ...config.admin?.components,
    providers: [
      ...(config.admin?.components?.providers ?? []),
      '/components/MyProvider#MyProvider',
    ],
  },
}
```

#### Custom Actions

Use the installed collection component slots such as `components.views.list.actions`, `components.listMenuItems` or `components.edit.beforeDocumentControls`. For example:

```ts
collection.admin = {
  ...collection.admin,
  components: {
    ...collection.admin?.components,
    listMenuItems: [
      ...(collection.admin?.components?.listMenuItems ?? []),
      '/components/ExportButton#ExportButton',
    ],
  },
}
```

#### Custom List Item Views

Modify how items appear in collection lists:

```ts
// From plugin-ecommerce
collection.admin = {
  ...collection.admin,
  components: {
    ...collection.admin?.components,
    views: {
      ...collection.admin?.components?.views,
      list: {
        ...collection.admin?.components?.views?.list,
        Component: '/views/ProductList#ProductList',
      },
    },
  },
}
```

#### Custom Collection Endpoints

Add collection-scoped endpoints (accessible at `/api/<collection-slug>/<path>`):

```ts
// From plugin-import-export
collection.endpoints = [
  ...(collection.endpoints || []),
  {
    path: '/import',
    method: 'post',
    handler: async (req) => {
      // Import logic accessible at /api/posts/import
      return Response.json({ success: true })
    },
  },
  {
    path: '/export',
    method: 'get',
    handler: async (req) => {
      // Export logic accessible at /api/posts/export
      return Response.json({ data: exportedData })
    },
  },
]
```

### Field & Collection Modifications

#### Admin Folders Override

Control admin UI organization:

```ts
// From plugin-redirects
collection.admin = {
  ...collection.admin,
  group: pluginOptions.group || 'Settings',
  hidden: pluginOptions.hidden,
  defaultColumns: pluginOptions.defaultColumns || ['from', 'to', 'updatedAt'],
}
```

### Background Jobs & Async Operations

#### Jobs Registration

Register plugin background tasks:

```ts
// From plugin-stripe
export const stripePlugin =
  (pluginOptions: PluginOptions) =>
  (config: Config): Config => ({
    ...config,
    jobs: {
      ...config.jobs,
      tasks: [
        ...(config.jobs?.tasks || []),
        {
          slug: 'syncStripeProducts',
          handler: async ({ req }) => {
            const products = await stripe.products.list()
            // Sync to Payload
            return { output: { synced: products.data.length } }
          },
        },
      ],
    },
  })
```

## Testing Plugins

### Local Development with dev/ Directory (optional)

Include a `dev/` directory with a complete Payload project for local development:

1. Create `dev/.env` from `.env.example`:

```bash
DATABASE_URL=mongodb://127.0.0.1/plugin-dev
PAYLOAD_SECRET=your-secret-here
```

2. Configure `dev/payload.config.ts`:

```ts
import { buildConfig } from 'payload'

import { mongooseAdapter } from '@payloadcms/db-mongodb'
import { myPlugin } from '../src/index.js'

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET!,
  db: mongooseAdapter({ url: process.env.DATABASE_URL! }),
  plugins: [
    myPlugin({
      collections: ['posts'],
    }),
  ],
  collections: [
    {
      slug: 'posts',
      fields: [{ name: 'title', type: 'text' }],
    },
  ],
})
```

3. Run development server:

```bash
npm run dev  # Starts Next.js on http://localhost:3000
```

### Integration Tests (Vitest) (optional)

Create `dev/int.spec.ts`:

```ts
import type { Payload } from 'payload'
import config from '@payload-config'
import { createLocalReq, getPayload } from 'payload'

import { afterAll, beforeAll, describe, expect, test } from 'vitest'
import { customEndpointHandler } from '../src/endpoints/handler.js'

let payload: Payload

beforeAll(async () => {
  payload = await getPayload({ config })
})

afterAll(async () => {
  await payload.destroy()
})

describe('Plugin integration tests', () => {
  test('should add field to collection', async () => {
    const post = await payload.create({
      collection: 'posts',
      overrideAccess: true,
      data: {
        title: 'Test',
        addedByPlugin: 'plugin value',
      },
    })
    expect(post.addedByPlugin).toBe('plugin value')
  })

  test('should create plugin collection', async () => {
    expect(payload.collections['plugin-collection']).toBeDefined()
    const { docs } = await payload.find({ collection: 'plugin-collection', overrideAccess: true })
    expect(docs.length).toBeGreaterThan(0)
  })

  test('should query custom endpoint', async () => {
    const payloadRequest = await createLocalReq({ urlSuffix: '/my-endpoint' }, payload)
    const response = await customEndpointHandler(payloadRequest)
    const data = await response.json()
    expect(data).toMatchObject({ message: 'Hello' })
  })
})
```

Run: `npm run test:int`

### End-to-End Tests (Playwright)

Create `dev/e2e.spec.ts`:

```ts
import { test, expect } from '@playwright/test'

test.describe('Plugin e2e tests', () => {
  test('should render custom admin component', async ({ page }) => {
    await page.goto('http://localhost:3000/admin')
    await expect(page.getByText('Added by the plugin')).toBeVisible()
  })
})
```

Run: `npm run test:e2e`

## Common Plugin Types

### Field Enhancer

Adds fields to existing collections (SEO, timestamps, audit logs)

### Collection Provider

Adds new collections (redirects, forms, logs)

### Hook Injector

Adds hooks to collections (nested docs, cache invalidation)

### UI Enhancer

Adds custom components (dashboards, field types)

### Integration

Connects external services (Stripe, Sentry, storage adapters)

### Adapter

Provides infrastructure (database, storage, email)

## Resources

- [Plugin Examples](https://github.com/payloadcms/payload/tree/v3.92.0/packages/) - Official plugins source code, payload-\* prefix
- [Plugin Template](https://github.com/payloadcms/payload/tree/v3.92.0/templates/plugin) - Starter template for new plugins
