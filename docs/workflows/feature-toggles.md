# Feature Toggles

Use this workflow when the task is to turn a SmartSite capability on or off without redesigning the core system.

## Canonical rule

Start in `src/smartsite.config.ts`.

Feature toggles belong in SmartSite config first. Do not start by editing `src/admin`, plugin registration, or frontend components unless the config path is proven insufficient.

## Common toggles

### Enable AI

1. Run `pnpm ai:enable`.
2. Provision AI credentials explicitly. The current supported path is `npx smartsite ai rotate --project .`.
3. Open the AI access gate in admin and use the built-in apply action when you are ready.

### Disable AI

1. Set `features.ai.enabled = false` in `src/smartsite.config.ts`.
2. Keep the existing AI runtime guards in place. They already short-circuit chat UI, hotkeys, and API behavior when AI is disabled.
3. Verify behavior:
   - no AI workspace toggle
   - no chat panel
   - AI routes are unavailable or return disabled responses

If the requirement is stronger than "disable AI" and really means "remove every AI-related surface from SmartSite," treat that as a separate core change. That is not a normal site-level toggle.

### Disable search

1. Set `features.search.enabled = false` in `src/smartsite.config.ts`.
2. Keep search collections, UI affordances, and APIs driven by that config instead of deleting built-in search code by hand.

### Change search mode

Set `features.search.mode` in `src/smartsite.config.ts`:

- `"page"`
- `"modal"`
- `"hybrid"`

### Disable global GSAP animations

Set `gsap.globalAnimations = false` in `src/smartsite.config.ts`.

Use this before inventing bespoke animation teardown work.

### Disable analytics, dark mode, i18n, or sitemaps

Set the matching `features.*` toggle in `src/smartsite.config.ts`.

## When config is not enough

Only leave the config path when one of these is true:

- the feature has no existing config key
- the task is to add a new reusable core capability
- the task is to remove core SmartSite code, not just disable it for one site

When that happens, read:

- [docs/engineering/configuration-system.md](../engineering/configuration-system.md)
- [docs/engineering/admin-layer.md](../engineering/admin-layer.md)

## Validation

After changing a feature toggle:

- verify the visible behavior in the running app
- run `pnpm lint`
- run `pnpm type-check`
