# Core Beliefs

This document preserves the high-level SmartSite philosophy from the source manuscript.


Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

### Design Philosophy

Smart Site follows a **field-driven, section-first architecture** where:

- **Fields drive everything** - CMS fields automatically generate admin UI and component props
- **Sections are self-contained** - Each section has its own config and component
- **The site owns its source** - Native modules make CMS and frontend behavior easy to inspect and change
- **Native composition** - Collections own fields, access and hooks; Payload config registers them explicitly

