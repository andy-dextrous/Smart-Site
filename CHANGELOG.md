# Changelog

All notable changes to Smart-Site will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.0.0] - 2025-01-05

### Added
- Universal configuration system with Zod schema validation
- Single source of truth pattern for SmartSite configuration
- `getSmartSiteConfig()` universal getter working in server/client/build contexts
- Deep merge configuration with frozen objects to prevent mutations
- Unified `CollectionIcon` component for flexible icon rendering
- Features configuration section (AI, dark mode, i18n, analytics, search, sitemaps)
- Comprehensive configuration reference documentation in `smartsite.config.ts`
- Admin package.json manifest system for dependency management
- Automatic dependency syncing from admin to client sites
- Differentiated Claude instructions for master vs starter/client sites
- Smart Site Context Rules in root CLAUDE.md
- Extension system documentation highlighting full customization power
- Critical reminders for updating admin package.json version

### Changed
- **BREAKING**: Migrated from runtime JSON configuration to build-time resolution
- **BREAKING**: Removed all testing infrastructure from smart-site-starter
- Configuration now uses Zod schema as single source of truth for types
- Moved from `admin/lib/` to flatter `admin/` structure for core utilities
- Replaced separate `IconWrapper` and `DashboardIcon` with unified `CollectionIcon`
- Configuration resolver now synchronous (removed async/await requirements)
- System collections (uri-index, users, templates) always included regardless of config
- Dashboard component refactored to pass serializable data instead of functions
- SmartSite master CLAUDE.md now emphasizes development freedom
- SmartSite starter CLAUDE.md now strictly prohibits admin modifications
- Updated package.json description for starter to sound like complete system
- GitHub workflows updated to remove test-related package filtering

### Fixed
- Serverless deployment compatibility by removing runtime JSON generation
- Admin routes infinite render loop caused by function serialization
- Client/server component boundary issues with Payload configuration
- Icon rendering in dashboard with proper data serialization
- GitHub workflows now correctly read version from admin package.json

### Removed
- Runtime JSON configuration files (`frontend-collections.json`)
- Separate registry files for collections, blocks, and globals
- `mergePayloadConfig` utility (replaced by resolver pattern)
- Duplicate icon wrapper components
- All testing dependencies from smart-site-starter (playwright, jest, ts-jest)
- Admin CLAUDE.md files from smart-site-starter (5 files removed)
- Test script references from starter package.json

### Developer Experience
- Clear three-tier system: Master → Starter → Client Sites
- Admin folder is now clearly marked as OFF-LIMITS in client sites
- Extension system provides full customization power without touching admin
- Admin package.json acts as manifest for automatic dependency updates
- Version tracking ensures proper releases and compatibility checks

## [1.1.1] - 2025-08-04

### Added
- Automated release workflow for Smart-Site repository
- GitHub Actions workflow to create releases automatically when tags are pushed

### Fixed
- Release process now fully automated between factory and product repositories

## [1.1.0] - 2025-08-04

### Added
- Version tracking system with `version.json` in admin directory
- SmartSite CLI enhancements with update options (`--edge`, `--version`, `--dry-run`)
- Version-aware backup naming system
- Comprehensive E2E testing system with Playwright
- Enhanced documentation for fields, blocks, and sections architecture
- Clear guidance on field-first development approach

### Changed
- Reorganized default values from centralized folder to respective field/section folders
- Each field and section now has its own `defaults.ts` file
- Enhanced CLAUDE.md documentation with component type explanations
- Improved developer experience with clearer 1:1 mapping documentation
- Replaced ShadCN design tokens with custom design system

### Fixed
- Import paths for better maintainability
- Documentation clarity for component development
- TypeScript configuration improvements

## [1.0.0] - 2025-01-03

### Added
- Initial release of Smart-Site
- Section-first, field-driven architecture
- Payload CMS integration with separated admin layer
- Smart-Site configuration system (`smartsite.config.ts`)
- CLI tool for updating client installations
- Caching and routing system
- SEO optimization with automated sitemaps
- GSAP animation support
- Tailwind v4 integration

### Core Features
- **Admin Layer**: Complete CMS configuration separated from frontend
- **Frontend Layer**: Reusable sections and components
- **Route Groups**: Separated `(frontend)` and `(payload)` routes
- **Update System**: Safe admin updates preserving client customizations
- **Type Safety**: Full TypeScript support with generated types

[Unreleased]: https://github.com/andy-dextrous/Smart-Site/compare/v2.0.0...HEAD
[2.0.0]: https://github.com/andy-dextrous/Smart-Site/compare/v1.1.1...v2.0.0
[1.1.1]: https://github.com/andy-dextrous/Smart-Site/compare/v1.1.0...v1.1.1
[1.1.0]: https://github.com/andy-dextrous/Smart-Site/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/andy-dextrous/Smart-Site/releases/tag/v1.0.0