---
name: smartsite-build
description: Build or improve a complete SmartSite website from a brief, using local sections, editable CMS content and real browser review.
---

# SmartSite build

Paths below are relative to this project root (the folder containing package.json).

Read `docs/project/brief.md`, `docs/project/design.md`, and `docs/engineering/component-catalogue.md`. Inspect the existing site and relevant source before making a design. For a fresh project, establish a running preview using the start skill. Learn the supplied facts, audience, desired action, assets and constraints. Ask for missing business facts only when necessary. Never invent testimonials, credentials, pricing, legal promises, or completed client work. Clearly mark provisional copy and asset placeholders.

Replace the starter branding as part of a full site build. Use supplied logo assets; if none are supplied, a simple typographic wordmark with the verified business name is appropriate. `src/components/logos/logo.tsx` owns the shared header/footer mark; do not leave SmartSite branding on a completed client site. Avoid repeating the site name in both the page meta title and its automatic site-name suffix.

Choose a coherent typography, spacing, colour and imagery direction using `docs/engineering/design-system.md`. Persist decisions and open questions in the project brief/design files so another session can continue. Select shipped sections before introducing new schema. The starter contains local source and shared fields; no external component registry is required.

Separate stored content from rendering behaviour. “Make the headline friendlier” normally edits a Payload field using the content skill. “Make every hero support a video” changes the section schema and renderer using the sections skill. A whole-site build can legitimately require both. Use judgement; do not route by matching words alone.

Author actual editable content through MCP after schema/code is ready. Read the current schema and document, preserve existing rows, select publication mode within the request, save with a revision and operation ID, then read back. A draft request stays a draft. For a complete local-site build, local publication can be appropriate to show the requested preview; public production launch is a separate decision.

Inspect the real application in an external browser at desktop and mobile sizes. Check navigation, forms, headings, focus, contrast, images and overflow. Wait for the actual sections and animations to settle before judging a screenshot; a blank capture is a failed observation, not proof of the rendered design. Inspect header button foreground/background contrast too. Run appropriate type/lint checks for source changes. A static mockup or passing compiler does not prove the website works. If browser access is unavailable, say visual acceptance is outstanding.

Example: “Build a landscaping site from these facts and logo” should produce useful service and contact pages, coherent design and editable content. It should not produce fake awards or an AI chat panel. “Add a testimonials section” with no testimonials should create the reusable layout and ask for approved evidence or leave explicit draft placeholders.

For a blog, set up the article Template and `settings.routing.postsSingleTemplate` using the local catalogue. Posts contain article fields, while their shared layout lives in Templates; a page-style `sections` array is not a post field. Verify a published article URL and public byline, not just the CMS record or list.
