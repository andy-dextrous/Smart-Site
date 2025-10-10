## AI abilities list

- AI dashboard with workflows
- AI metadescriptions
- Wordpress auto migrate feature! Site Uplift Engine
- AI page creator
- AI blogpost writer
- Topical authority map and auto SEO
- Post -> socials
- Query your data
- Integrate with crms
- Front end chatbot/assistant
- Analytics (site learns about your content performance)
- The more the user interacts, the better it gets: Learns preferred tone/voice from editing patterns Learns what posts tend to perform best, Tracks conversion sources and builds attribution, Remembers what agents are useful vs not
- email endpoint as a trigger for workflows
- whatsapp connector to chat to your site (sends you requests, receives instructions)
- A/B testing and marketing experiments
- Browse photo library and choose based on appropriateness and not being used before.
- Optimise for GEO
- Could chat work on frontend too??

# Current Tasks

## Starter

- documentation: spacing variables and their rules better. CSS rules in general actually
- seeding should auto clear cache because hooks are disabled
- bring over the smart sections with filters like paginated blog, featured posts etc
- consider the minimal starter and its core sections. Hero, Form, Posts Grid, Post Hero and Post content (with premade components, table of contents, author card, scroll indicator)
- auto screenshots of sections
- SEO fields all organised and no dynamic "content" field
- fix: get type errors when no sections exist
- Right now we have to use seed to create a user, trying to create one without seeding is buggy (ie a fresh empty install causes errors)
- standardise section settings including attributes, colorscheme, container width, padding x and y plus create a universal section component that renders all of it. Mobile styles? Mobile images? Background image and overlay options.
- Maybe we should have two different concepts: presets and templates. Presets are like pre-made collections of sections that can be modified or extended, and templates are pre-assigned collections of sections that can't be modified - same for every post type
- protect `/api/revalidate` with authentication or a signed token instead of leaving it public
- rework draft preview retrieval so it can fetch unpublished documents without relying on `uri-index`
- fix redirect resolver to handle ID-based references from the redirects plugin instead of assuming slugs
- allow URI conflict checks to omit the current document when validating
- reuse resolved routing settings during recursive URI generation to avoid repeated global fetches
- lift the 2k document ceiling in URI regeneration and `cache.getAllURIs()` so large sites don't drop routes
- make `/api/keep-alive` resilient when `VERCEL_URL` is undefined or the site is self-hosted
- lock down `/api/ai/*` proxies so only authenticated admins can call the upstream AI service
- convert `/api/regenerate-uris` to POST-only with CSRF protection (or remove once migration is finished)
- restrict `/api/seed` to a dedicated "super-user/developer" role; review all access tiers and decide which endpoints/actions map to admin vs super-user
- make the `/api/ai/graphql` proxy derive its host from the request/server helper instead of `process.env.NEXT_PUBLIC_URL`
- align the posts collection image field naming (`heroImage` vs `featuredImage`) with admin defaults and SEO fallbacks so OG images render correctly
- tighten role guards so `ai-agent` users can only access automated resources (e.g., remove them from `canEditContent`/`isEditorOrAdmin` once the new super-user flow exists)
- actually emit the structured data JSON-LD we collect (currently `generateStructuredData` isn't used anywhere)
- normalize canonical/OG URLs to absolute site URLs and provide a default canonical when none is specified

# AI Brain

- make CRUD tools dynamic/workflows
- documentation
