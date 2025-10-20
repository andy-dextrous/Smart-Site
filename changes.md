- Storage: Added Cloudinary adapter to the media resolver, exposing it through `smartsite.config.ts` with credential fallbacks, custom folder support, and Playwright coverage for registration and warnings
  - `src/admin/config/defaults.ts`
  - `src/admin/config/storage-resolver.ts`
  - `package.json`
  - `src/admin/package.json`
  - `../../packages/testing/tests/smart-site-starter/config/storage-providers.spec.ts`

- Storage: Adopted official Payload adapters for S3 and UploadThing, expanded config schema, and added resolver coverage that asserts credential warnings vs plugin registration
  - `src/admin/config/storage-resolver.ts`
  - `src/admin/config/defaults.ts`
  - `package.json`
  - `../../packages/testing/tests/smart-site-starter/config/storage-providers.spec.ts`
  - `../../packages/testing/tests/smart-site-starter/_shared/run-storage-resolver.ts`
  - `../../packages/testing/tests/smart-site-starter/_shared/storage-resolver-runner.ts`

- Routing: Draft autosaves and explicit draft saves now exit the universal after-change hook early, so URI updates, cache revalidation, and related logs only run on publish/unpublish events
  - `src/admin/payload/hooks/collections/universal/after-change.ts`

- Admin: Removed the auto-generated `payload-query-presets` collection from the sidebar omit list so presets stay hidden in navigation
  - `src/admin/payload/components/providers/layout-provider/app-sidebar.tsx`

- Database: Updated staging sync defaults to target the live Atlas database (`test`) so `pnpm staging:pull` copies production into staging reliably
  - `staging-sync.config.json`

- Routing: Automatic redirect creation now only runs when the slug actually changes, preventing historic redirect churn on routine updates
  - `src/admin/routing/index-manager.ts`

- Testing: Routing and redirect modules now expose optional accessor setters so external test harnesses can inject mock Payload instances without touching runtime behaviour
  - `src/admin/routing/uri-engine.ts`
  - `src/admin/routing/index-manager.ts`
  - `src/admin/routing/index.ts`
  - `src/admin/redirects/auto-redirects.ts`
  - `src/admin/redirects/uri-redirect.ts`
  - `src/admin/cache/revalidation.ts`

- Admin Bar: Exit preview now navigates through `/api/exit-preview`, clearing preview cookies on the server before redirecting back to the canonical page
  - `src/app/(frontend)/api/exit-preview/route.ts`
  - `src/admin/payload/components/backend/admin-bar/exit-preview.tsx`

- Redirects: Manual edits now revalidate `collection:redirects` plus both old and new `redirect:<slug>` tags, keeping cached lookups in sync
  - `src/admin/payload/plugins/index.ts`

- Redirects: Deleting a document purges automatic redirects where the deleted URI was either the source or the target, and revalidates the affected cache tags
  - `src/admin/redirects/auto-redirects.ts`

- Routing: Slug locking now engages on the first publish (create and update) and the hidden lock field re-locks automatically whenever `_status` is `published`
  - `src/admin/payload/hooks/utilities/lock-slug.ts`
  - `src/admin/payload/fields/slug/index.ts`

- Routing: Frontend wrapper now seeds slug fields from `admin.useAsTitle` (or the first `title`/`name` field) so collections without a `title` still auto-generate slugs on first publish
  - `src/admin/config/frontend.ts`

- Rendering: Added `sanitizePayloadData` helper and now sanitize section props before handing them to client components, preventing ObjectId serialization errors
  - `src/utilities/sanitize-payload-data.ts`
  - `src/admin/components/render-sections.tsx`

- Dependencies: Added undici@6.20.0 patch to fix "Illegal constructor" error preventing Payload type generation
  - `patches/undici@6.20.0.patch`
  - `package.json` (pnpm.patchedDependencies)

- Dependencies: Added `.npmrc` with `legacy-peer-deps=true` to resolve peer dependency conflicts
  - `.npmrc`

- GSAP: Added ScrambleTextPlugin support to configuration schema and provider
  - `src/admin/config/defaults.ts` (added `scrambleText: z.boolean()` to GSAPConfigSchema and `scrambleText: false` to defaults)
  - `src/providers/gsap/index.tsx` (added import, conditional registration, and export)

- Extensions: Changed plugins export type from `Plugin` to `any` to allow flexible plugin implementations
  - `src/extensions/index.ts`

- Seed API: Falls back to `SMARTSITE_SITE_NAME` from .env when `siteName` not provided in request body
  - `src/app/(frontend)/api/seed/route.ts`

- GSAP: Fixed ScrollSmoother `_context is not a function` error by registering ScrollTrigger synchronously before ScrollSmoother
  - `src/providers/gsap/index.tsx`

- AI Bridge: Removed verbose `[ai-bridge] Revalidated ai-registry` log messages
  - `src/admin/payload/plugins/ai-bridge.ts`

- URI Index: Only updates on explicit publish/unpublish events (not draft autosaves), prevents duplicate entry errors, log spam, and unnecessary cache revalidation
  - `src/admin/payload/hooks/collections/universal/after-change.ts`
  - `src/admin/routing/index-manager.ts`

- URI Index: Fixed draft versioning - uri-index always points to published version, only uses draft status for unpublished pages
  - `src/admin/routing/index-manager.ts`

- Admin Bar: Removed `/preview` path from edit link, now goes directly to edit page
  - `src/admin/payload/components/backend/admin-bar/edit-current-page.tsx`

- Admin: User dropdown logout now routes through the official `/admin/logout` endpoint so Payload handles the redirect back to `/admin/login`
  - `src/admin/payload/components/providers/layout-provider/user-dropdown.tsx`

- Posts: Removed legacy `post-hero` component to avoid confusion with section-based hero implementations
  - `src/components/posts/post-hero.tsx`

- Fields: CMS link labels now auto-populate immediately after selecting an internal document for the link reference
  - `src/components/fields/link/link.ts`
  - `src/components/fields/link/link-label-field.tsx`

- Database: Added `databaseInfo` export with target/provider/url metadata for logging and debugging
  - `src/admin/payload/db/config.ts`

- Media: Added `mediaInfo` export with provider/directory metadata for logging and debugging
  - `src/admin/payload/collections/media.ts`

- Payload Config: Added `onInit` logging that displays database target, provider, URL (masked), and media storage configuration on startup
  - `src/admin/payload/payload.config.ts`

- Cache: Revalidation now only runs on publish/unpublish events, draft edits no longer trigger cache invalidation
  - `src/admin/payload/hooks/collections/universal/after-change.ts`

- Media: Provider resolution now respects `smartsite.config.ts` as source of truth, defaults to "local", logs error if vercel-blob selected without env tokens
  - `src/admin/payload/collections/media.ts`
  - `src/admin/config/storage-resolver.ts`

- Config: Updated Smart Site config schema so media overrides keep provider-specific settings (vercel-blob, etc.)
  - `src/admin/config/defaults.ts`

- Sidebar: Clicking on a group icon when sidebar is collapsed now expands the sidebar automatically
  - `src/admin/payload/components/providers/layout-provider/app-sidebar.tsx`

- Git: Added `tsconfig.tsbuildinfo` to .gitignore to exclude TypeScript build info from version control
  - `.gitignore`

- Services Extension: Fixed TypeScript error by adding explicit types to condition function parameters
  - `src/extensions/collections/services.ts`

- GSAP: Added DrawSVGPlugin support - imported, registered conditionally based on config, and exported for component use
  - `src/providers/gsap/index.tsx`

- Templates: Template content edits now invalidate every page bound to that layout via the dependent updates job, ensuring cached pages refresh after changes
  - `src/admin/payload/jobs/dependency-updates/handler.ts`

- Dependencies: Upgraded Payload core and first-party plugins to v3.58.0 to pick up the latest admin, plugin, and API improvements
  - `package.json`
  - `pnpm-lock.yaml`

- Admin: Added query preset table cells to the generated import map after enabling collection presets
  - `src/app/(payload)/admin/importMap.js`

- Collections: Enabled Payload trash (soft delete) for pages, posts, services, team, testimonials, categories, and workshops so deletes funnel into Trash for recovery
  - `src/admin/payload/collections/pages.ts`
  - `src/admin/payload/collections/posts.ts`
  - `src/admin/payload/collections/services.ts`
  - `src/admin/payload/collections/team.ts`
  - `src/admin/payload/collections/testimonials.ts`
  - `src/admin/payload/collections/categories.ts`
  - `src/extensions/collections/workshops.ts`

- Users: Added a `teamMember` relationship field so each CMS user can link to their public-facing team profile
  - `src/admin/payload/collections/users.ts`

- Posts: Author population now hydrates linked team member data for each author, feeding richer info into `populatedAuthors`
  - `src/admin/payload/hooks/collections/posts/populate-authors.ts`

- Frontend: Post hero and shared author formatter now prefer linked team member names (with user fallbacks) for display
  - `src/components/sections/post-hero/Component.tsx`
  - `src/admin/utilities/format-authors.ts`

- SEO: Article structured data now prioritises team member attributes (name, role, bio, image) when available, falling back to user details
  - `src/admin/utilities/structured-data.ts`

- Users: Removed unused education and social links arrays to keep the account schema focused on author metadata
  - `src/admin/payload/collections/users.ts`

- Team: Added optional social profile and education arrays so public bios hold richer credentials without cluttering user accounts
  - `src/admin/payload/collections/team.ts`

- Authors: Implemented unified author identity flow—users can link to team members, posts hydrate the relationship for frontend + SEO, and teams now hold optional social/education metadata while user accounts stay lean
  - `src/admin/payload/collections/users.ts`
  - `src/admin/payload/hooks/collections/posts/populate-authors.ts`
  - `src/components/sections/post-hero/Component.tsx`
  - `src/components/posts/post-author-info.tsx`
    - Aurora-style author card with live social links and education highlights
  - `src/admin/utilities/format-authors.ts`
  - `src/admin/utilities/structured-data.ts`
  - `src/admin/payload/collections/team.ts`

- Sections: Normalized SectionIntro padding on mobile so headings line up with the standard gutter on side-image list and centered card grid
  - `src/components/sections/side-image-list/Component.tsx`
  - `src/components/sections/centered-card-grid/Component.tsx`
    - Also ensured the CTA copy respects the dark color scheme so footer text remains legible

## 2.2.0 — 2025-10-18

- Design system: Realigned shared UI primitives, navigation, sections, and seeded surfaces to use the `spacing.css`/`colors.css` tokens for consistent starter styling.
  - `src/components/ui/*`
  - `src/components/header/**/*`
  - `src/components/footer/index.tsx`
  - `src/components/sections/**/*`
  - `src/components/posts/**/*`
  - `src/components/fields/{breadcrumbs,form,link,pagination,rich-text,section-cta,social-links}/**/*`

- Routing: Homepage reassignment now regenerates canonical URIs, skips stray redirects, and cleans up automatic redirect chains when the homepage changes or is removed
  - `src/admin/payload/jobs/dependency-updates/handler.ts`
  - `src/admin/payload/jobs/dependency-updates/update-functions.ts`
  - `src/admin/routing/index-manager.ts`
- Settings: Deleting the active homepage clears `settings.routing.homepage` so the CMS no longer shows stale references, with robust relation parsing across all Payload formats
  - `src/admin/payload/hooks/collections/universal/after-delete.ts`
- Slug Field: Initial slug generation only occurs on the first publish; drafts stay empty until publish time, and publishing now hard-blocks blank slugs by falling back to the title or throwing a descriptive error
  - `src/admin/payload/fields/slug/format-slug.ts`
- Routing Hooks: First-time publishes no longer create `/ → slug` automatic redirects, slug change detection ignores empty drafts, and dependent update jobs skip pages that Payload hasn’t assigned an ID yet
  - `src/admin/payload/hooks/collections/universal/after-change.ts`
  - `src/admin/payload/hooks/collections/universal/before-change.ts`
  - `src/admin/payload/hooks/collections/pages/before-change.ts`
- Redirects: Deleting a redirect now revalidates redirect-specific cache tags and the collection listing so removed rules disappear immediately
  - `src/admin/payload/plugins/index.ts`
- Revalidation Endpoint: `/api/revalidate` now requires an authenticated admin/developer session, reusing Payload auth so only privileged users can trigger full cache clears
  - `src/app/(frontend)/api/revalidate/route.ts`
- URI Migration Endpoint: `/api/regenerate-uris` now runs as POST-only, verifies same-origin requests, and blocks cross-site attempts before regenerating URIs
  - `src/app/(frontend)/api/regenerate-uris/route.ts`
  - `src/admin/utilities/request-guards.ts`
  - `apps/**/package.json`
- Seed Endpoint: Only developer accounts can run `/api/seed` after the initial bootstrap, requests may omit `siteName` (pulling from env), and duplicate AI-agent provisioning now logs instead of failing
  - `src/app/(frontend)/api/seed/route.ts`
  - `src/admin/payload/endpoints/seed/index.ts`
- Role Access: Centralised minimum-role helpers, developer-only protections, and developer seeding updates
  - `src/admin/payload/access/roles.ts`
  - `src/admin/payload/access/admin.ts`
  - `src/admin/payload/access/editor.ts`
  - `src/admin/payload/collections/users.ts`
  - `src/admin/payload/payload-types.ts`
  - `src/admin/payload/endpoints/seed/users/user.ts`
- Users: Removed legacy bio field since team profiles own public bios
  - `src/admin/payload/collections/users.ts`
  - `src/components/posts/post-author-info.tsx`
  - `src/admin/utilities/structured-data.ts`
  - `src/admin/css/partials/_create-user.scss`
- Admin Providers: Skip layout and AI wrappers on bootstrap routes so login and first-user screens stay clean
  - `src/admin/payload/components/providers/provider-routes.ts`
  - `src/admin/payload/components/providers/layout-provider/index.tsx`
  - `src/admin/payload/components/providers/ai-provider-client.tsx`
- Seed: Clear caches after re-enabling hooks so freshly seeded content is visible immediately
  - `src/admin/payload/endpoints/seed/index.ts`
- Seed: Minimal profile now includes Home, About, Contact, lean navigation, and two starter posts without media; blog seeding wires Insights links automatically
  - `src/admin/payload/endpoints/seed/pages/minimal-pages.ts`
  - `src/admin/payload/endpoints/seed/globals/minimal-globals.ts`
  - `src/admin/payload/endpoints/seed/index.ts`
  - `src/admin/payload/endpoints/seed/posts/minimal-posts.ts`
- Seed: Blog content now seeds by default unless `{ blog: false }` is passed to the API
  - `src/app/(frontend)/api/seed/route.ts`
  - `src/admin/payload/endpoints/seed/index.ts`
- Base CSS: Added a smooth-scroll section tweak so full-width sections don’t flicker when ScrollSmoother is enabled
  - `src/app/(frontend)/css/base.css`
- Build: Sitemap generator now loads Smart Site config with a dynamic import so it works in production builds. Moved generation to build script
  - `scripts/generate-sitemap-index.ts`
  - `package.json`
- Admin: Added `payload-query-presets` to the sidebar omit list so auto-generated preset collections stay hidden in the admin navigation
  - `src/admin/payload/components/providers/layout-provider/app-sidebar.tsx`
- Layout: Only render `smooth-wrapper` and `smooth-content` containers when ScrollSmoother is enabled in the Smart Site config
  - `src/app/(frontend)/layout.tsx`
- AI Provider: Removed the `AIProviderWithoutContainer` alias and use the core provider with `withContainer={false}` in the frontend layout for clearer usage
  - `src/admin/payload/components/providers/ai-provider.tsx`
  - `src/app/(frontend)/layout.tsx`
- Admin Bar: Scoped admin design tokens to the toolbar and removed the global admin bundle from the frontend layout to stop typography CSS variable clashes
  - `src/admin/payload/components/backend/admin-bar/theme.css`
  - `src/admin/payload/components/backend/admin-bar/index.tsx`
  - `src/app/(frontend)/layout.tsx`
- Admin Config: Frontend collection lookups now rely on the live extension registry so toggling or removing dev extensions stops leaking stale relationship slugs into Payload types
  - `src/admin/config/index.ts`
  - `src/admin/config/resolver.ts`
  - `src/admin/payload/collections/index.ts`
- Routing: Reuse resolved routing settings and paginate URI index queries so regeneration covers every document without hammering globals
  - `src/admin/routing/uri-engine.ts`
  - `src/admin/routing/index-manager.ts`
  - `src/admin/cache/cache.ts`
- Preview: Passing preview collection/document hints keeps live preview working for unpublished drafts without relying on the URI index
  - `src/admin/utilities/generate-preview-path.ts`
  - `src/app/(frontend)/api/preview/route.ts`
  - `src/admin/components/uri-renderer.tsx`
  - `src/admin/data/draft.ts`
- API: `/api/keep-alive` now falls back to `NEXT_PUBLIC_URL` (or a protocol-safe Vercel URL) and reports failures instead of crashing when no base URL is set
  - `src/app/(frontend)/api/keep-alive/route.ts`
- Redirects: Resolver now understands relationship targets stored as IDs, falling back to slugs so manual redirects keep working across plugin versions
  - `src/admin/redirects/uri-redirect.ts`
- URI Conflicts: The conflict checker drops the current document even when the collection isn’t provided, preventing self-collisions in cache-only checks
  - `src/admin/routing/index-manager.ts`
- Posts: Renamed the hero image field to `featuredImage`, migrated legacy values at read time, and updated cards/heroes so SEO fallbacks find the right media
  - `src/admin/payload/collections/posts.ts`
  - `src/components/posts/post-hero.tsx`
  - `src/components/posts/post-card.tsx`
  - `src/admin/payload/payload-types.ts`
- Structured Data: Page renderer now emits JSON-LD scripts for docs with structured data enabled, using global settings for organization info
  - `src/admin/components/uri-renderer.tsx`
- SEO Canonicals: Metadata generation normalises canonical/OpenGraph URLs to absolute links and supplies a default when none is configured
  - `src/admin/utilities/generate-meta.ts`
- Users: First/last name fields now require non-empty values and email is mandatory for account creation/login
  - `src/admin/payload/collections/users.ts`
  - `src/admin/payload/payload-types.ts`
- Brand Cleanup: Removed Elvora-specific logo, icon, layout, and post components, switched shared sections to lucide icons, and left a placeholder for future shared assets
  - `src/components/blocks/related-posts/Component.tsx`
  - `src/components/fields/section-cta/index.tsx`
  - `src/components/icons/icons.txt`
  - `src/components/icons/*.tsx`
  - `src/components/layout/*.tsx`
  - `src/components/logos/*.tsx`
  - `src/components/posts/*.tsx`
  - `src/lib/icon-library.tsx`
- Fallback UI: 404 and error routes now render inside the site layout with the shared logo and neutral messaging
  - `src/app/(frontend)/error.tsx`
  - `src/app/(frontend)/not-found.tsx`
- URL Utilities: Consolidated client-side URL helper usage under the admin utilities module
  - `src/components/blocks/form/component.tsx`
  - `src/admin/utilities/get-url.ts`
  - `src/utilities/get-url.ts`
- Animations: Removed the GSAP title reveal effect and its supporting utility class for a neutral default experience
  - `src/providers/gsap/effects.ts`
  - `src/app/(frontend)/css/utilities.css`
  - `src/components/fields/section-intro/index.tsx`
- Config: Disabled analytics feature by default in the Smart Site config
  - `src/smartsite.config.ts`
- Sections: Introduced a universal `Section` wrapper and `sectionSettings` field, moved default padding into component-level utilities, and removed the legacy minimal section set in favour of production-ready hero/content/contact and posts archives built on the new surface
  - `src/components/fields/section/component.tsx`
  - `src/components/fields/section/section-settings.ts`
  - `src/components/fields/section/types.ts`
  - `src/app/(frontend)/css/base.css`
  - `src/app/(frontend)/css/utilities.css`
  - `src/components/sections/config.ts`
  - `src/components/sections/sections-map.tsx`
  - `src/components/sections/hero/*`
  - `src/components/sections/content/*`
  - `src/components/sections/contact-form/*`
  - `src/components/sections/posts/**`
  - `src/components/posts/*`
  - `src/components/blocks/related-posts/Component.tsx`
  - `src/admin/data/posts.ts`
  - `src/admin/payload/endpoints/seed/pages/insights-minimal.ts`
  - `src/admin/payload/endpoints/seed/pages/minimal-pages.ts`
  - `src/admin/payload/endpoints/seed/templates/post-minimal.ts`
  - `src/admin/payload/payload-types.ts`
- Links & CTAs: Replaced the legacy button helper with an enhanced link field that carries button variants, sizing, icon upload/placement, and auto-normalises older data; updated `CMSLink`, sections, Section CTA defaults, seeds/templates, and removed the redundant buttons utilities
  - `src/components/fields/link/link.ts`
  - `src/components/fields/link/index.tsx`
  - `src/components/fields/link/button-options.ts`
  - `src/components/fields/link/normalize-link.ts`
  - `src/components/sections/hero/*`
  - `src/components/sections/content/*`
  - `src/components/fields/section-cta/*`
  - `src/admin/payload/endpoints/seed/pages/minimal-pages.ts`
  - `src/admin/payload/endpoints/seed/pages/insights-minimal.ts`
  - `src/admin/payload/endpoints/seed/templates/post-minimal.ts`
  - `src/admin/payload/payload-types.ts`
  - `src/components/fields/buttons/*`
- Blocks: Collapsed the legacy front-end blocks directory by relocating the reusable form/media renderers into `components/fields`, removing the unused related-posts presenter, and dropping the code block from the default Payload block registry
  - `src/components/fields/form/**/*`
  - `src/components/fields/media/block.tsx`
  - `src/components/fields/media/block-config.ts`
  - `src/components/fields/rich-text/index.tsx`
  - `src/admin/payload/blocks/{config.ts,form/config.ts,media/config.ts}`
  - `src/admin/config/resolver.ts`
  - `src/components/blocks/*`
- Breadcrumbs: Consolidated header navigation primitives into a single shared component at the root so sections and posts reuse one implementation
  - `src/components/breadcrumbs.tsx`
- Design System Preview: Split human-controlled theme tokens from computed layers, introduced `colors.css`/`spacing.css`/`theme.css` orchestration, refreshed typography ramps, and added a `/design-system-preview` route that renders every token and component variant for reference.
  - `src/app/(frontend)/(dev)/design-system-preview/page.tsx`
  - `src/app/(frontend)/css/{base,colors,components,globals,spacing,theme,typography,utilities}.css`
  - `{DESIGN-SYSTEM.md,AGENTS.md,CLAUDE.md,README.md}`
- Sections & Variants: Documented layout rules, centralised section padding controls, and refactored contact, content, and posts sections to lean on the new Tailwind variants and shared utilities.
  - `SMARTSITE-SECTION-DESIGN.md`
  - `src/components/fields/section/{component.tsx,section-settings.ts,types.ts}`
  - `src/components/sections/contact-form/*`
  - `src/components/sections/content/*`
  - `src/components/sections/hero/*`
  - `src/components/sections/posts/**/*`
  - `src/components/posts/post-card.tsx`
  - `src/admin/utilities/posts.ts`
- Seeds & Globals: Expanded the minimal seed experience with richer copy, refreshed post templates, and generated header/footer navigation directly from the current page set so seeded projects start with working menus.
  - `src/admin/payload/endpoints/seed/{globals/minimal-globals.ts,index.ts,pages/insights-minimal.ts,pages/minimal-pages.ts,posts/minimal-posts.ts,templates/post-minimal.ts}`
- Search Experience: Wired a configurable search stack (API endpoint, command palette, dedicated `/search` page), surfaced collection-level toggles in `smartsite.config.ts`, and ensured documents sync with enriched metadata and category chips.
  - `src/admin/{config/defaults.ts,config/features.ts,data/search.ts}`
  - `src/admin/payload/plugins/index.ts`
  - `src/admin/payload/search/{beforeSync.ts,fieldOverrides.ts}`
  - `src/app/(frontend)/api/search/route.ts`
  - `src/app/(frontend)/search/page.tsx`
  - `src/components/{header/**/*,search/search-dialog.tsx,ui/command.tsx}`
  - `src/smartsite.config.ts`
- Search Hardening: Disabled the UI when no frontend collections expose search, normalised category lookups (even during seed runs), and fixed command-palette state so clearing input or closing with Escape never throws.
  - `src/admin/config/features.ts`
  - `src/admin/payload/search/beforeSync.ts`
  - `src/components/search/search-dialog.tsx`
  - `src/components/ui/command.tsx`
- Redirect Automation: Added a create-redirect checkbox to the slug field, captured the previous published URI, and generate reference-based redirects whenever slugs change.
  - `src/admin/payload/fields/slug/{index.scss,index.ts,slug-component.tsx}`
  - `src/admin/payload/hooks/collections/universal/after-change.ts`
  - `src/admin/redirects/auto-redirects.ts`
  - `src/admin/routing/index-manager.ts`
- SEO & Content Flattening: Moved SEO helpers into the config layer, added a migration to collapse the legacy `content` group, and expanded structured-data generation (author cards, search page, scoring utility) for better index hygiene.
  - `scripts/migrations/flatten-content-group.ts`
  - `src/admin/config/{defaults.ts,frontend.ts}`
  - `src/admin/utilities/{seo-scoring.ts,structured-data.ts}`
  - `src/components/posts/post-author-card.tsx`
