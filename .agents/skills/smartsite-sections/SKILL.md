---
name: smartsite-sections
description: Create or change reusable SmartSite sections, Payload block fields, rendering behaviour and design-system code.
---

# SmartSite sections

Paths below are relative to this project root (the folder containing package.json).

Read `docs/engineering/section-development.md`, `docs/engineering/design-system.md` and the nearest existing section. Use `docs/engineering/component-catalogue.md` to find app-owned examples. Copy only what the requested design requires.

A section has `config.ts` and `Component.tsx` under `src/components/sections/<slug>/`. Register the schema in `src/components/sections/config.ts` and renderer in `sections-map.tsx`. Reuse field factories and end fields with `sectionSettings()`. Use the shared Section wrapper and design tokens. Keep optional arrays removable unless the brief requires a minimum. Guard optional media/content and preserve accessible structure. Avoid inventing a separate layout system.

Generate Payload types and import map after schema changes, then type-check and lint. Follow the data skill when changing stored shapes with existing content. Do not edit generated types by hand or silently remove old fields before a migration.

Create a representative draft through MCP, inspect the CMS controls and the actual rendered section in an external browser at desktop/mobile sizes, then verify no unrelated section changed. Never claim a section is done from source inspection alone.

Example: “Add reusable testimonials” requires code, schema, both registrations and a draft rendering test. “Change Jane’s testimonial” only needs the content workflow. Edit the native project files directly: sections in `src/components/sections`, collections in `src/payload/collections`, and registration in `src/payload.config.ts`. For CMS layout or navigation work, first read `docs/engineering/admin-layer.md` to find the active sidebar and providers under `src/components/cms`. These are ordinary editable components.

For Payload API details, use the bundled Payload 3.92 `payload` skill, its relevant reference file, and this repository’s installed package types.

Inspect a new section both first on a page and after another section. Check fixed-header clearance, real computed typography, optional attribution/content, keyboard focus and narrow-screen overflow. Wait for entrance animations to settle before judging visibility; do not accept a hidden heading or overlapping header merely because a screenshot file exists.

Shared link fields resolve against route-enabled native collections. Explicit relationship restrictions stay unchanged. For a Lexical block containing shared links, put its block definition in `payload.config.ts` `blocks` and refer to its slug in `BlocksFeature`; do not hide a deferred link inside an editor callback. Test custom links in the actual CMS after generating the import map.
