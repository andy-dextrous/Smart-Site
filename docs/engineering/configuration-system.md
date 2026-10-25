# Configuration System

The preserved configuration, extension, and override guidance from the source manuscript is reproduced below.

For common on/off behavior such as disabling MCP, switching search mode, or turning off global GSAP animations, start with [docs/workflows/feature-toggles.md](../workflows/feature-toggles.md) before reading this broader engineering doc.


Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## Canonical decision rules

- `src/smartsite.config.ts` is the primary customization surface.
- Use `src/extensions/` for new slugs and new first-class extensions, not for built-in SmartSite collections that already exist.
- Keep `src/admin/` protected. Shared core changes belong in SmartSite itself, not as ad hoc site-level edits.
- For feature toggles such as MCP, search, analytics, GSAP global animations, and i18n, start with `smartsite.config.ts` before considering any deeper change.
- Image quality overrides must also be allowed by `images.qualities` in `next.config.ts`. The starter permits its 75/85/90 presets. Same-site Payload media uses local paths with version query strings; external storage hosts need an explicit `images.remotePatterns` entry.

## ⚙️ Configuration System

Smart Site uses a **comprehensive configuration system** via `src/smartsite.config.ts` that controls all aspects without modifying core files.

### Configuration Structure

```typescript
import type { UserConfig } from "@/admin/config/defaults"

const config: UserConfig = {
  admin: {
    meta: {
      title: "Admin | Smart Site",
      description: "Advanced admin panel",
      favicon: "/favicon.png",
    },
  },
  collections: {
    services: { enabled: false }, // example: hide services in this project
  },
  features: {
    analytics: true,
    darkMode: false,
    i18n: false,
    search: {
      enabled: true,
      mode: "page",
    },
    sitemaps: true,
  },
  gsap: {
    scrollTrigger: true,
    scrollSmoother: true,
    splitText: false,
    globalAnimations: false,
  },
  extensions: {
    collections: [],
    blocks: [],
    globals: [],
    plugins: [],
  },
}

export default config
```


### Default collections and extensions

Smart Site ships with a full set of first-party collections that already cover typical marketing needs. The defaults live in `src/admin/config/defaults.ts` (`SMARTSITE_DEFAULTS`) and every collection defined there starts with `enabled: true`. That means services, team, testimonials, templates, media, categories, pages, and posts are available the moment the app boots—you only need to touch `smartsite.config.ts` if you want to rename them, change SEO/front-end behaviour, or explicitly disable something.

- **System collections** (`uri-index`, `users`, `templates`) are always registered by the resolver in `src/admin/config/resolver.ts`, even if you try to disable them. They keep routing, authentication, and layout scaffolding intact.
- **Content collections** (`pages`, `posts`, `services`, `team`, `testimonials`, `categories`, `media`) stay on by default. Set `enabled: false` in `smartsite.config.ts` to hide one.
- **Extensions** are only for new slugs that do not exist in the default registry. Declare the slug in `smartsite.config.ts → extensions` and provide the actual config in `src/extensions`. Do **not** add built-in collections such as `services` or `testimonials` to extensions—they already exist.
- **Plugin collections** (`forms`, `form-submissions`, `redirects`, `search`, etc.) are installed automatically by the default plugin stack in `src/admin/payload/plugins`. They will appear in `payload-types.ts` without any manual configuration.
- **Search controls**: The same plugin stack registers the `search` collection when `features.search.enabled` is `true`. Configure the command palette vs. results page behaviour through `features.search.mode` (`"page" | "modal" | "hybrid"`). The collection is grouped under **Settings → Search Results** in Payload admin so reindexing and manual inspection stay tidy.

### Inspecting the active Payload configuration

1. Open `src/admin/config/defaults.ts` to see every baseline setting, including the default labels, SEO flags, sitemap weights, and feature toggles.
2. Review `src/smartsite.config.ts` for project-specific overrides—the file is merged deeply, so any key you omit uses the default above.
3. Check `src/extensions/index.ts` (and the folders it imports) to find custom collections/globals/blocks that replace or extend the defaults. The resolver automatically swaps them in when the slug matches.
4. Confirm the final build output in `src/admin/payload/payload-types.ts`. Payload regenerates this file on build and it lists every collection/global/block that is actually registered.

### Complete Configuration Options

#### Collections Configuration

| Collection       | Default state        | Frontend default | Purpose                       |
| ---------------- | -------------------- | ---------------- | ----------------------------- |
| `pages`          | Enabled              | Yes              | Primary marketing pages       |
| `posts`          | Enabled              | Yes              | Blog articles                 |
| `services`       | Enabled              | Yes              | Service or offering pages     |
| `team`           | Enabled              | Yes              | Team member bios              |
| `testimonials`   | Enabled              | No               | Social proof library          |
| `categories`     | Enabled              | No               | Content categorization        |
| `media`          | Enabled (`local`)    | No               | Asset storage + adapters      |
| `templates`*     | Enabled (system)     | No               | Page blueprint library        |
| `users`*         | Enabled (system)     | No               | Admin authentication          |
| `uri-index`*     | Always included      | N/A              | Global URI → document index   |

`*` System collections cannot be removed; Smart Site requires them for routing and admin access.

Each configurable collection (any slug inside `smartsite.config.ts → collections`) supports:

- `enabled`: Turn on/off
- `frontend`: Enable frontend features (SEO, preview)
- `seo`: Add SEO fields
- `frontendOptions.seoSchemaType`: Schema.org type
- `sitemap`: Include in sitemap

#### Feature Flags

| Feature       | Options   | Default          | Purpose                                                                         |
| ------------- | --------- | ---------------- | ------------------------------------------------------------------------------- |
| `darkMode`    | `boolean` | `false`          | Dark/light theme toggle                                                         |
| `i18n`        | `boolean` | `false`          | Internationalization                                                            |
| `analytics`   | `boolean` | `true`           | Analytics tracking                                                              |
| `search.enabled` | `boolean` | `true`       | Toggle the entire search stack (plugin registration, nav affordances, API)      |
| `search.mode` | `"page" \| "modal" \| "hybrid"` | `"page"` | Choose between full results page, command palette, or both                    |
| `sitemaps`    | `boolean` | `true`           | XML sitemap generation                                                          |

#### GSAP Configuration

| Option              | Type       | Default | Purpose                                                                  |
| ------------------- | ---------- | ------- | ------------------------------------------------------------------------ |
| `scrollTrigger`     | `boolean`  | `true`  | Registers `ScrollTrigger` for manual hooks and global animations         |
| `scrollSmoother`    | `boolean`  | `true`  | Enables smooth scrolling context                                         |
| `flip`              | `boolean`  | `false` | Loads GSAP Flip plugin                                                   |
| `draggable`         | `boolean`  | `false` | Loads Draggable plugin                                                   |
| `morphSVG`          | `boolean`  | `false` | Loads MorphSVG plugin                                                    |
| `drawSVG`           | `boolean`  | `false` | Loads DrawSVG plugin                                                     |
| `splitText`         | `boolean`  | `false` | Registers SplitText for manual hooks                                     |
| `customEase`        | `boolean`  | `false` | Loads CustomEase                                                         |
| `physics2D`         | `boolean`  | `false` | Loads Physics2D helpers                                                  |
| `textPlugin`        | `boolean`  | `false` | Registers TextPlugin for manual hooks                                    |
| `globalAnimations`  | `boolean`  | `false`  | Enables the global data-attribute animation provider                    |


## 🧩 Extensions & Overrides

### Extensions (registering new content)

Extensions let you ship additional Payload collections, globals, blocks, or plugins without touching `src/admin`.

1. **Create the config** under `src/extensions/<type>/<slug>.ts`. Export a standard Payload config object (e.g., `CollectionConfig`).
2. **Register it in the extension registry** (`src/extensions/index.ts`). Import your file and add it to the appropriate export map (`collections`, `globals`, `blocks`, `plugins`).
3. **Enable it in `smartsite.config.ts`** by adding the slug to the corresponding `extensions.<type>` array. The resolver will pull the config from the registry and apply the same frontend wrappers used for core collections.

```ts
// src/smartsite.config.ts
extensions: {
  collections: ["faq"],
  blocks: ["testimonial-grid"],
  globals: [],
  plugins: [],
},
```

> Arrays in the `extensions` section replace the defaults rather than merging (see `deep-merge.ts`). Declare every extension slug you want active.

### Overrides (replacing core behaviour)

If you need to replace a built-in collection/global/block, drop a config with the same slug into the registry and the resolver will swap it automatically. Root collections (`users`, `uri-index`, `templates`) are always loaded, but any matching entry in the registry wins over the default.

```ts
defaultCollectionMap["pages"] // core definition
extensions.collections.pages   // optional override
```

The merge order is: defaults → registry overrides → user config (`smartsite.config.ts`). System collections always load exactly once. Custom extensions declared via `smartsite.config.ts` that are not found in the registry will throw a runtime error, preventing silent typos.

<a id="development-workflow"></a>
