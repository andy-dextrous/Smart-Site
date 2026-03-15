## Firefox CSS Degradation — Smart Site (Resolved)

### Summary
- Root cause: our fluid typography/spacing tokens used calc expressions that divide lengths by lengths (e.g. `((100vw - 20rem) / 1px) / span`). Firefox treats that as invalid, so `var(--text-h1)` and spacing vars became invalid → font-size/spacing fell back to UA defaults. Chrome tolerated it, masking the bug.
- Fix: rewrite token math to spec-safe clamps that only add/multiply lengths by numbers (no length/length division). Typography and spacing now use pixel-anchored clamps over 320–1440px.
- Dev/prod CSS now renders correctly in Firefox and Chrome.

### Observations from element dumps
- Firefox Rule panel showed the h1 rule present (not overridden) but computed font-size ≈16px; hovering `var(--text-h1)` revealed the calc string with length/length divisions. `CSS.supports('font-size','calc((100vw - 20rem)/1px)')` returned false in Firefox.

### Definitive root cause
- Firefox rejects calc expressions that divide lengths by lengths. Our fluid tokens relied on that pattern, making the resulting vars invalid in Firefox. Not a layering or delivery issue.

### Actions already taken
- Upgrades retained: Tailwind/@tailwindcss/postcss 4.1.17; Next 16.0.7; React/React DOM 19.0.1; platform binaries for lightningcss, tailwind oxide, sharp.
- Browserslist pinned in root `package.json`.
- Rewrote token math (typography and spacing) to clamp-based, Firefox-safe expressions; removed length/length divisions.
- Removed experimental PostCSS helpers (properties unwrapping, layer flattening) now that the calc issue is fixed.

### Current state
- Dev/prod render correctly in Firefox and Chrome. Typography/spacing respond over 320–1440px via clamp slopes; design-system knobs remain (min/max, type scale, spacing ratio).

### Next options
1) Optional: File a Tailwind issue noting that calc patterns dividing lengths pass in Chrome but fail in Firefox, to steer docs/examples away from that form.
2) If we ever need the old token linkage: keep clamp pattern but adjust min/max and scale values; avoid length/length divisions.

### Files of interest
- Frontend entry CSS: `apps/smart-site/src/app/(frontend)/css/globals.css`
- Typography tokens: `apps/smart-site/src/app/(frontend)/css/typography.css`
- Spacing tokens: `apps/smart-site/src/app/(frontend)/css/spacing.css`
- Generated chunk: `/_next/static/css/app/(frontend)/layout.css?...`

### Notes
- Problem was calc syntax, not missing CSS or layers. Typekit/font loading was unrelated.
