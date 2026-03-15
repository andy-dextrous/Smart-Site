# SmartSite

SmartSite is an enterprise website builder built around a field-driven, section-first architecture.

## Core features

- Reusable field patterns
- Type-safe components
- Visual field editor
- Smart defaults
- Installable section library
- Component isolation
- Drag-and-drop builder
- Responsive by default
- O(1) URI resolution
- Smart caching
- SEO automation
- Multi-language ready architecture
- Protected admin layer
- Configuration-driven customization
- AI-powered features via a managed backend

## Core architecture

SmartSite follows a field-driven, section-first architecture where:

- Fields drive everything.
- Sections are self-contained.
- Admin layer is protected.
- Configuration over modification.

## Supported operating models

SmartSite supports two first-class deployment shapes:

- hosted Mongo plus managed hosting
- self-hosted Mongo as a Docker appliance

The exact detection and operating rules are in [docs/product-specs/hosting-modes.md](product-specs/hosting-modes.md).

## Product promise

- build locally with the fastest loop possible
- preserve preview, routing, caching, and Payload behavior across hosting modes
- give agents clear, deterministic commands instead of tribal knowledge

The preserved longform manuscript for SmartSite is described in [docs/references/source-manuscript.md](references/source-manuscript.md).
