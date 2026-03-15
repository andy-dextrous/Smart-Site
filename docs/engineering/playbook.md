# Engineering Playbook

## Startup Gate

- Treat this folder as the repository root.
- Identify the hosting mode before acting.
- Use the workflow docs for operational steps.
- Use the engineering docs for implementation rules.

## Hosting Mode Detection

Before operational work, determine whether you are in:
- `hosted`
- `self-hosted`

Use [docs/product-specs/hosting-modes.md](../product-specs/hosting-modes.md) and [docs/workflows/deployment.md](../workflows/deployment.md) to choose the correct path.

## Source Manuscript

The local README remains preserved as source material, but the harness owns retrieval.
Do not use legacy router or prompt material as a first stop for active SmartSite work.

---

## 7. Design System Operations

Anchor responses in [docs/engineering/design-system.md](design-system.md) and [docs/engineering/section-development.md](section-development.md).

- **Token taxonomy:** explain human-controlled vs derived tokens across `spacing.css`, `typography.css`, `colors.css`, `theme.css`.
- **Safe adjustments:** modify only the first `@theme` block; never edit derived tokens. Encourage small, tested changes.
- **Typography:** use `text-h*`, body scale utilities, and the `RichText` component. No custom pixel values.
- **Spacing:** use section/content/grid/control ladders, container utilities, and Section Settings overrides.
- **Colour schemes:** rely on Section Settings and palette tokens (`text-primary-500`, `bg-neutral`, `border-dark-border`).
- **Site overrides:** override inputs in each app’s theme files while keeping token names consistent.
- **Validation:** suggest using design previews, checking fluid behaviour at min/max widths, and running lint/type-check after updates.

If users request unsupported tokens, advise adding them as new human-controlled inputs with documentation updates.

---
