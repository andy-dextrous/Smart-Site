# Local component catalogue

All source is shipped in this repository. Start with existing sections and shared fields; no registry login or CLI download is required.

| Need | Section source |
| --- | --- |
| Hero with heading, supporting copy, background and buttons | `src/components/sections/hero/` |
| Editorial copy, rich text and layout | `src/components/sections/content/` |
| Contact form | `src/components/sections/contact-form/` plus Payload forms |
| Blog listing | `src/components/sections/posts/archive/` |
| Article heading, body, related posts | `src/components/sections/posts/{hero,content,related}/` |

Shared source under `src/components/fields/` includes Section, links/buttons, media, rich text and section settings. `src/components/ui/` contains the local UI primitives. Navigation belongs in header/footer globals, not page sections. See [section development](section-development.md) for both registrations and [design system](design-system.md) for spacing/colour/typography.

Example marketing page: hero → content rows for services → contact form. Use approved business facts and real assets. Example article: posts hero → posts content → related posts. For testimonials or a new service-card design, create a local section with the existing factories; do not insert pretend testimonials into startup data.

See [real desktop/mobile examples](../examples/README.md). Examples are design guidance, not records to seed into every new website. Add verified project screenshots to `docs/examples/` as useful, without private CMS/account details.

Posts store article content separately from their layout. Create a local Template containing `posts-hero`, `posts-content` and optionally `posts-related`, then assign it to `settings.routing.postsSingleTemplate` before publishing posts. Inspect the current schema and routing settings through MCP and preserve unrelated routing values. A post does not accept page `sections`; do not silently assume page and post schemas match.
