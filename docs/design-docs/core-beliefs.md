# Core Beliefs

This document preserves the high-level SmartSite philosophy from the source manuscript.


Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

### Design Philosophy

Smart Site follows a **field-driven, section-first architecture** where:

- **Fields drive everything** - CMS fields automatically generate admin UI and component props
- **Sections are self-contained** - Each section has its own config and component
- **Admin layer is protected** - Core CMS logic is isolated from frontend customizations
- **Configuration over modification** - All customizations via `smartsite.config.ts`

