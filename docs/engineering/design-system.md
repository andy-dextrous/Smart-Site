# Design System

Smart Site ships a CSS-first, tokenized design system under `src/app/(frontend)/css`.

## CSS sources

- `theme.css`
- `spacing.css`
- `typography.css`
- `colors.css`
- `base.css`
- `utilities.css`

## Token architecture

- Human-controlled tokens live in the configurable `@theme` blocks.
- Derived tokens in the second `@theme` block are computed from those inputs and should not be edited directly.
- Tailwind v4 generates utilities from the declared tokens, so use generated utilities instead of bracketed `var(...)` classes.

## Core usage rules

- Wrap sections with the shared `<Section>` component.
- Use container utilities instead of width clamps.
- Use `text-h*`, `text-sm`, `gap-content-*`, `gap-grid-*`, `px-section-x`, and `py-section-y` instead of hard-coded values.
- Rich text should render through the shared `RichText` component.
- Color changes should come from Section Settings or parent-level tokens, not scattered hard-coded utility overrides.

Source: [source-manuscript-readme.md](../references/source-manuscript-readme.md)

## 🎨 Design System

Smart Site ships a CSS-first, tokenized design system under `src/app/(frontend)/css`. Tailwind v4 generates utilities directly from the `@theme` tokens, so you use simple classes instead of hand-wiring `var(...)` in JSX. The guidance below folds in the canonical rules that previously lived in `DESIGN-SYSTEM.md`; treat this section as the source of truth when styling sections or components.

### CSS Sources
- `theme.css` – radii, shadow elevations, motion timings/easings.
- `spacing.css` – spacing scale, section/content/grid tokens, containers, nav/logo heights, control ratios, offsets.
- `typography.css` – fluid type base/min/max, ratio, semantic steps (`--text-*`, `--text-h*`), body/heading roles.
- `colors.css` – brand palette (`--color-*`) and role tokens (borders, surfaces).
- `base.css` – global background/text colours and section paddings.
- `utilities.css` – container helpers and small cross-component utilities.

### Token Architecture

- **Human-controlled tokens** live in the configurable `@theme` blocks at the top of `spacing.css`, `typography.css`, `colors.css`, and `theme.css`. These are the only values designers and implementers should override:
  - Typography: `--font-*`, `--line-height-*`, `--fluid-text-base-min`, `--fluid-text-base-max`, `--fluid-text-viewport-min`, `--fluid-text-viewport-max`, `--fluid-text-scale-min`, `--fluid-text-scale-max`, `--color-body`, `--color-heading`.
  - Spacing: `--fluid-space-base-min`, `--fluid-space-base-max`, `--fluid-space-viewport-min`, `--fluid-space-viewport-max`, `--fluid-space-ratio-min`, `--fluid-space-ratio-max`.
  - Containers: `--container-width-*`, `--container-md-width-*`, `--container-sm-width-*`.
  - Utilities: `--spacing-logo`, `--spacing-nav`, control scales (`--control-scale-*`), colour palettes (`--color-*`).
- **Derived tokens** in the second `@theme` block are computed from the knobs above. Never edit or override them directly:
  - Typography steps (`--fluid-text-step-*`, `--text-*`, `--text-h*`).
  - Spacing scale (`--fluid-space-*`, `--spacing-section-*`, `--spacing-content-*`, `--spacing-content-xss`, `--spacing-grid-*`, `--spacing-control-*`).
  - Container clamps (`--spacing-container*`), offsets, and helpers such as `--spacing-container-gap`.
  - Progress helpers (`--fluid-text-progress`, `--fluid-space-progress`).

Adjust the inputs, let the pre-computed outputs follow. Tailwind 4 automatically emits utilities for every token (`--spacing-content` → `gap-content`, `--spacing-grid` → `gap-grid`, `--text-h2` → `text-h2`, `--text-sm` → `text-sm`), so use the generated classes instead of re-declaring values.

### Tailwind 4 Theme Integration

- Tailwind builds utilities from `@theme` declarations at compile time. To apply a token, use the matching utility (`py-section-y`, `gap-content`, `gap-grid`, `text-h3`, `text-sm`, etc.). Do not create custom classes like `gap-[var(--spacing-content)]`.
- Prefer layout primitives (`flex`, `grid`) with gap utilities. Avoid stacking `mt-*`/`mb-*` on siblings—spacing should be controlled by a parent container.
- Resolve class names with `tailwind-variants` (or constants) and pass the resulting strings into JSX. Avoid calling slot helpers inline—compute them once above the return as illustrated in the section rules.
- When you must write CSS, import from `@/app/(frontend)/css/spacing.css`, `colors.css`, or `typography.css` and consume the variables directly. Do not define duplicate hard-coded values in component styles.

### Typography System

The fluid type scale is powered by a single modular ratio with configurable bounds.

- **Control tokens**
  - Base size: `--fluid-text-base-min` (mobile) and `--fluid-text-base-max` (desktop).
  - Viewport ramp: `--fluid-text-viewport-min`, `--fluid-text-viewport-max`. The interpolation runs from min → max; outside the range it clamps.
  - Scale range: `--fluid-text-scale-min`, `--fluid-text-scale-max` (default 1.2 → 1.25). Lower values compress the hierarchy; higher values stretch headings.
  - Families and roles: `--font-body`, `--font-heading`, `--font-fallback-sans`, plus the per-role line-height and letter-spacing tokens.
- **Derived tokens**
  - Steps: `--fluid-text-step--2` through `--fluid-text-step-6`.
  - Semantic aliases: `--text-xs` → `--text-5xl`, `--text-h6` → `--text-h1`.
- **Usage rules**
  - Components should use the generated utilities (`text-h2`, `text-sm`, `text-base`, `text-lg`, `text-xs`, etc.) or inherit from semantic tags. Never hard-code pixel sizes in JSX or component CSS.
  - Body copy, lists, and blockquotes rely on global rules in `typography.css`. Leave them untouched unless the component demands a distinct style (e.g. a metric counter).
  - Rich text from Payload should live inside the shared `RichText` component. It inherits the global tokens, so no `.prose` overrides or body IDs are required. Use the `not-prose` helpers when you need to inject bespoke layouts inside the document flow.
  - Lean on the body-scale utilities (`text-xs`, `text-sm`, `text-base`, `text-lg`) for navigation, metadata, and legal copy. Pair them with tracking/weight utilities as needed (e.g. uppercase + custom letter spacing for pre-headings).
  - To adjust typography for a client build, override the control tokens in that app’s own theme sheet. Do not copy `typography.css`—only change the inputs.

### Spacing System

Spacing uses a mirrored modular scale that also interpolates between min and max breakpoints.

- **Control tokens**
  - Base padding: `--fluid-space-base-min` (mobile), `--fluid-space-base-max` (desktop).
  - Ramp: `--fluid-space-viewport-min`, `--fluid-space-viewport-max`.
  - Ratio range: `--fluid-space-ratio-min`, `--fluid-space-ratio-max` (default 1.28 → 1.36) for progressive loosening across viewports.
  - Container widths: `--container-width-*`, `--container-md-width-*`, `--container-sm-width-*`. These follow the same progress curve as space.
  - Utility anchors: `--spacing-logo`, `--spacing-nav` for chrome sizing.
  - Control scales: `--control-scale-*` feed button/input padding without diverging from the core rhythm.
- **Derived tokens**
  - Steps: `--fluid-space-0` → `--fluid-space-7`.
  - Section spacing: `--spacing-section-*`, `--spacing-section-x`, `--spacing-section-y`.
  - Content spacing: `--spacing-content-xss`, `--spacing-content-*`, `--spacing-grid-*`.
  - Control spacing: `--spacing-control-*` for form controls and compact chrome.
  - Containers: `--spacing-container`, `--spacing-container-md`, `--spacing-container-sm`, `--spacing-container-gap`, plus offset helpers.
- **Usage rules**
  - Sections must render through the shared `<Section>` wrapper so vertical rhythm, padding, and colour schemes stay consistent. Avoid layering additional `py-section-*` utilities inside the component.
  - Interior layouts should rely on `gap-content-*`, `px-content`, etc. Keep the same semantic tokens for padding, gap, and margin to avoid breaking the scale.
  - Cards, feature blocks, and CTA wrappers should pull padding and gaps from the content scale (`p-content`, `gap-content-*`). Use the control scale (`px-[--spacing-control-*]`) for dense UI chrome like buttons or inputs.
  - Grid layouts should combine `grid-cols-*` with `gap-grid`, `gap-grid-lg`, etc. Use the `gap-grid` scale only inside CSS grid containers; flexbox layouts should stay on the content scale.
  - Default section gutters map to `--spacing-section-md` horizontally and `--spacing-section-lg` vertically. Override the semantic tokens, not the raw fluid steps, when you need different defaults.
  - Container utilities (`container`, `container-md`, `container-sm`) map to the computed widths. Use the offset tokens (`spacing-container-offset`) for full-bleed elements that need to align with container edges.

### Colour Tokens

- Primary and secondary palettes follow Tailwind’s Indigo and Sky scales; use `text-primary-500`, `bg-secondary-600`, etc. for brand accents.
- `--color-dark-*` drives typography, borders, and dark surfaces. `--color-neutral` and `--color-white` handle light surfaces.
- Border tokens (`--color-dark-border`, `--color-light-border`) standardise separators. Reach for `border-dark-border` / `border-light-border` instead of arbitrary opacity adjustments.

### Rich Text and Prose

- The `RichText` component already strips Tailwind Prose defaults and relies on our tokens. Do not reintroduce `.prose` or bespoke selectors around Payload content.
- Use `data-rich-text` or component-level class hooks only when you need contextual colour themes (e.g. inverted sections). Modify colour tokens (`--color-body`, `--color-heading`) on the parent rather than overriding every element.
- For articles that must use traditional long-form spacing, apply a specific variant class that toggles the section/content spacing tokens; never hand-write margins on individual headings or paragraphs.

### Implementation Checklist

- [ ] Wrap every top-level section with the shared `<Section>` component so vertical rhythm, colour schemes, and padding come from Section Settings.
- [ ] Apply container utilities instead of width clamps in JSX or CSS.
- [ ] Pick typography utilities (`text-h*`, `text-xs/sm/base/lg`, `leading-*`) rather than raw pixel values.
- [ ] Use gap and padding tokens for component spacing. If you need a custom size, add it as a new control token rather than hard-coding.
- [ ] When adding new theme inputs, document them here and keep the derived calculations together so Tailwind continues to generate utilities.
- [ ] Never edit the computed token block. Change the inputs, test the cascade, and ensure Tailwind picks up the new classes.

### Client and Demo Overrides

- Sites should only override human-controlled tokens in their local `spacing.css`, `colors.css`, or `typography.css`. Avoid copying computed tokens—share the same calculations to guarantee consistency.
- When shipping a customised client palette, keep the same token names (`--color-primary-*`). Shared components and generated Tailwind utilities depend on those names.

Adhering to these rules keeps every Smart Site implementation predictable and easy to tune. If a new pattern requires additional tokens, add them alongside the existing inputs and extend this section so implementers understand how to use them.
<a id="building-sections"></a>
