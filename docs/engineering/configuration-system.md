# Native Payload configuration

Start at `src/payload.config.ts`. It lists collections, globals, plugins, database, email, admin options and generated types explicitly. Edit an existing collection in `src/collections`; no override or extension registry is required.

`src/site.config.ts` contains browser-safe presentation choices: identity defaults, navigation/search presentation, motion, breadcrumbs and image-display quality. Database credentials, storage clients, access functions and collection definitions stay on the server. CMS-managed business content remains in the database.

## Add a website collection

Use the nearest existing collection as the complete example. A routed collection needs its own slug/URI fields, publication access and lifecycle hooks. Metadata declares its role; it does not add those behaviors automatically.

```ts
import type { CollectionConfig } from "payload"
import { authenticated } from "@/access/authenticated"
import { authenticatedOrPublished } from "@/access/authenticatedOrPublished"
import { slugField } from "@/fields/slug"
import { seoFields } from "@/fields/seo"
import { websitePreview } from "@/website/preview"
import { beforeUniversalChange } from "@/hooks/collections/universal/before-change"
import { afterUniversalChange } from "@/hooks/collections/universal/after-change"
import { afterUniversalDelete } from "@/hooks/collections/universal/after-delete"
import { lockSlugAfterPublish } from "@/hooks/utilities/lock-slug"

export const Projects: CollectionConfig = {
  slug: "projects",
  labels: { singular: "Project", plural: "Projects" },
  custom: {
    smartsite: {
      route: true, label: "Projects", seo: true, search: true, mcp: true,
      sitemap: { enabled: true, priority: 0.7, changefreq: "weekly", respectNoIndex: true },
    },
  },
  access: {
    create: authenticated, update: authenticated, delete: authenticated,
    read: authenticatedOrPublished,
  },
  admin: { useAsTitle: "title", ...websitePreview("projects") },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "summary", type: "textarea" },
    { type: "tabs", tabs: [{ name: "seo", label: "SEO", fields: seoFields({ seoSchemaType: "WebPage" }) }] },
    ...slugField("title"),
  ],
  hooks: {
    beforeOperation: [lockSlugAfterPublish],
    beforeChange: [beforeUniversalChange],
    afterChange: [afterUniversalChange],
    afterDelete: [afterUniversalDelete],
  },
  versions: { drafts: true },
}
```

Import `Projects` and add it once to the `collections` array before `inventory` is calculated. This makes Settings archive/template choices, URI-index relationships, preview, search and sitemap consumers see the collection. Choose a template/renderer that handles its actual fields; registration alone does not design a public page. Generate types/import map, then test draft/publish, access denial, a public route and an MCP schema/read/save.

A private data collection can use a normal `CollectionConfig` without website metadata or routing hooks. Custom globals opt into content MCP with `custom: { smartsite: { mcp: true } }`. Users, keys, submissions, operations and internal collections remain excluded. Metadata never overrides Payload role or field access.

Register website collections before schema factories run. Plugins that add or remove a routed collection afterwards are rejected with a configuration error. During upgrades, move that registration into the explicit list rather than weakening the assertion.

## Sections and links

Section schemas/renderers remain in `src/components/sections`; register them in its config and component map. Shared link fields carry an explicit marker that `websiteLinksPlugin` binds to the website collection inventory before Payload sanitization. The plugin preserves explicit relationship restrictions and clones shared schemas so one build cannot contaminate another.

For Lexical blocks containing shared links, register the block definition in the top-level `blocks` array, then reference its slug from `BlocksFeature`. A schema hidden only inside an editor feature callback is not available to the binding pass. Ordinary inline section blocks and object entries in `blockReferences` are traversed.

## Native settings

| Change | Edit |
| --- | --- |
| Collection fields, permissions, hooks, labels or drafts | Its `src/collections` definition |
| Global fields or permissions | Its `src/globals` definition |
| Database adapter/connection | `src/payload/db/config.ts` and the explicit environment |
| Email adapter | `src/payload/email/config.ts` |
| Admin metadata/live-preview defaults | `src/admin/config.ts` |
| Admin colors, layout and typography | `src/admin/css` |
| Upload sizes, focal point, formats or local directory | `src/collections/media.ts` |
| External storage | Native storage plugin in `payload.config.ts` |
| Schema localization | Native `localization` in `payload.config.ts` plus `localized` fields |
| Public locale/motion/search/breadcrumb choices | `src/site.config.ts` |
| MCP transport enabled/disabled | `smartsiteMcp({ enabled: true })` in the plugin list |
| MCP eligibility | Definition’s `custom.smartsite.mcp`, with normal access/grants |

Disabling MCP preserves existing key/identity/receipt collections and removes the transport endpoint. It does not delete or rotate credentials. A deliberately disabled endpoint is not a startup failure; use the CMS or an explicitly authorized operator workflow for content.

## Storage recipes

Local uploads need no plugin. For hosted storage, add the chosen native plugin to `payload.config.ts` and retain the site's existing options. Configure credentials explicitly; do not silently fall back to local storage when a hosted provider is missing credentials.

```ts
import { vercelBlobStorage } from "@payloadcms/storage-vercel-blob"
const blobToken = process.env.BLOB_READ_WRITE_TOKEN || process.env.VERCEL_BLOB_TOKEN
if (!blobToken) throw new Error("Hosted media requires a Vercel Blob token")
// Add to plugins:
vercelBlobStorage({ collections: { media: true }, token: blobToken })
```

```ts
import { s3Storage } from "@payloadcms/storage-s3"
s3Storage({
  collections: { media: true }, bucket: process.env.S3_BUCKET!,
  config: {
    region: process.env.S3_REGION!,
    credentials: { accessKeyId: process.env.S3_ACCESS_KEY_ID!, secretAccessKey: process.env.S3_SECRET_ACCESS_KEY! },
  },
})
```

```ts
import { uploadthingStorage } from "@payloadcms/storage-uploadthing"
uploadthingStorage({ collections: { media: true }, options: { token: process.env.UPLOADTHING_TOKEN! } })
```

The Blob adapter intentionally disables itself when its token is missing, so validate hosted credentials before creating it. A TypeScript non-null assertion (`!`) does not perform that validation. If a local preview deliberately uses local files, omit the hosted plugin explicitly for that environment; never let a missing hosted token choose the storage destination.

The retained Cloudinary adapter is `cloudinaryStorage` from `@/payload/storage/cloudinary`. It accepts explicit `cloudName`, `apiKey`, `apiSecret`, `folder`, `uploadOptions`, `destroyOptions`, `deliveryOptions` and collection overrides, with the documented Cloudinary environment aliases as fallback. Preserve existing folders/public IDs during upgrades.

Keep existing provider-specific options, image sizes and download/access rules when translating old configuration. Verify originals, variants, upload/delete and Next image rendering using isolated provider objects. Provider-specific acceptance is recorded separately; a local build alone does not prove external storage works.
