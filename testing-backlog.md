# Smart Site Starter Testing Backlog

This document enumerates the additional automated tests required to guard every non-design regression fix recorded in `changes.md`. Existing Playwright coverage already protects the storage resolver, URI revalidation draft skips, slug lock enforcement, sitemap utilities, structured data, and redirect preferences—those cases are intentionally omitted here to avoid duplication.

Each entry lists the proposed test file (kebab-case path under `packages/testing/tests/smart-site-starter/`) followed by the scenarios it must assert and the related `changes.md` bullet numbers. Items that already have equivalent coverage (config harnesses, existing routing specs, storage resolver tests, etc.) have been removed so we can stay focused on genuinely uncovered regressions.

## Admin Surface

- `admin/config/extensions-registry.spec.ts`
  - Frontend collection lookups track the live extension registry without leaking stale slugs (change 70).

## Rendering & Preview

- `preview/draft-hints.spec.ts`
  - Preview hints keep live preview working for unpublished drafts without URI lookups (change 72).
- `frontend/fallback-routes.spec.tsx`
  - `error.tsx` and `not-found.tsx` render within the main layout using shared branding (change 81).
- `layout/scroll-smoother.spec.tsx`
  - `layout.tsx` only renders `smooth-wrapper`/`smooth-content` when ScrollSmoother is enabled; AI provider uses `withContainer={false}` (changes 67, 68).
- `utilities/sanitize-payload-data.spec.ts`
  - ObjectId, Buffer, Map/Set, circular inputs are dehydrated safely without mutation (change 13).
- `utilities/content-flattening.spec.ts`
  - Section payloads remain stable after sanitisation/flattening, preserving keys expected by SEO helpers (change 95). This can be bundled with the sanitize test if preferred.
- `url/get-url.spec.ts`
  - Consolidated URL helper normalises admin/client URLs consistently (change 82).

## API Security & Infrastructure

- `api/security.spec.ts`
  - `/api/revalidate` requires authenticated admin/developer, `/api/regenerate-uris` rejects wrong method/origin, `/api/keep-alive` falls back gracefully when base URL unset (changes 55, 56, 73).
- `api/exit-preview.spec.ts`
  - Exit preview clears cookies and resolves safe redirects with/without `redirect` param (change 8).
- `api/seed.spec.ts`
  - Combined coverage for seed security and content: only developer accounts can seed post-bootstrap, `SMARTSITE_SITE_NAME` fills missing `siteName`, hooks purge caches, duplicate AI provisioning logs instead of erroring, and minimal/blog variants populate navigation correctly while honouring `{ blog: false }` (changes 18, 57, 58, 61, 62, 63, 91).

## GSAP & Animation

- `gsap/plugins.spec.ts`
  - ScrambleText/DrawSVG register only when enabled; ScrollTrigger registers before ScrollSmoother to avoid `_context` errors (changes 16, 19, 36).

## Content, Sections & Fields

- `sections/section-wrapper.spec.tsx`
  - Universal `Section` wrapper applies padding/layout variants correctly; CTA defaults align with new utilities (change 85).
- `fields/link-field.spec.tsx`
  - Link field auto-labels internal references, preserves button variants, and normalises legacy data (changes 26, 86).
- `blocks/registry.spec.ts`
  - Registry exports only the lightweight form/media blocks after pruning legacy block implementations (change 87).

## Search Experience

- `search/search-stack.spec.tsx`
  - Feature toggles surface in config, `/api/search` enriches metadata, `/search` page renders filters/chips correctly (change 92).
- `search/hardening.spec.tsx`
  - With no frontend collections, UI disables gracefully; category lookups survive seed runs; clearing command palette never throws (change 93).

## Users, Roles & Authors

- `role/access.spec.ts`
  - `userHasMinimumRole` enforces developer/admin tiers and rejects AI agents where required (change 58).
- `users/validation.spec.ts`
  - User collection requires first name, last name, and email; legacy bio/social fields stay removed (changes 45, 59, 79).
- `posts/author-identity.spec.ts`
  - Linking users to team members enriches `populatedAuthors`, frontend display, and structured data (changes 41–47).
- `posts/featured-image.spec.ts`
  - Legacy hero image values migrate to `featuredImage`; cards/heroes and metadata honour the new field (change 76).

---
_Last updated: 2025-10-22_
