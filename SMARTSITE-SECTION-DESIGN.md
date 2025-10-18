# SmartSite Section Design

This document defines the **non-negotiable rules** for authoring sections inside SmartSite. Use it as the checklist every time you plan, implement, or review a section. Anything that lands in this repository must comply with these guidelines.

## 1. Section Folder Contract

- Locate sections in `src/components/sections/<section-name>/`.
- Use **kebab-case** for directory and file names (`feature-grid`, `stats-overview`).
- Each section always exports a server-safe entry point and may optionally attach client helpers:
  - `config.ts` — Payload `Block` definition (no client-only code).
  - `Component.tsx` — React implementation. Default to a server component, but it can be client-side if the entire section needs interactivity (animations, form state, etc.).
  - Optional `client.tsx` (or `component-client.tsx`) for interactive behaviour when you want to keep the main component on the server. Import it lazily from `Component.tsx` and keep it colocated.
- Register the section immediately:
  - Add the `Block` to `src/components/sections/config.ts` under `sections.sectionBlocks`.
  - Map the slug to the component in `src/components/sections/sections-map.tsx`.
- All sections receive shared page context props when rendered:
  - `document` – the current Payload document (Page/Post/etc.).
  - `collection` – the collection slug of that document.
  - `breadcrumbs` – array used for navigational trails.
  - `searchParams` – parsed query string.
  - `params` – dynamic route params (e.g. `uri` segments).
    Treat these as optional; guard their usage inside the component.
- Keep individual folders self-contained. Shared helpers belong in `src/components/fields` or `src/components/ui` so the CLI can install sections without chasing deep relative imports.

## 2. Payload Config Rules (`config.ts`)

Follow the patterns in `README.md#building-sections`.

- Start with the brief. Model only the fields the section actually needs to satisfy the client or design intent; resist adding optional knobs “just in case.” When the request is unclear, pause and ask for clarification before inflating the schema.
- Always use the shared field factories for core primitives:
  - Links route through the `link()`/`CMSLink` field set so internal/external references stay normalized.
  - Media (images, video) uses the `media` field + `<Media>` component to respect responsive sizing and metadata.
- Rich text content should rely on the shared `richText()` field + `<RichText>` renderer. Keep the default variant so it inherits typography tokens; only opt into the `prose`/article variant for long-form content such as blog posts.
- Import field presets from `@/components/fields/*` whenever they exist (link, media, section-cta, content, etc.). Never duplicate schemas inline.
- Wrap logical groups in `collapsible` blocks. Default to open for primary content, closed for supporting controls.
- Provide `label`, `admin.description`, and `admin.placeholder` strings to explain author intent.
- Set `slug` equal to the folder name; set `interfaceName` so TypeScript components receive strong types (`HeroBlock`, `FeatureGridBlock`).
- Run `sectionSettings()` as the final field to expose shared colour/container/padding controls.
- Avoid bespoke collections unless absolutely required. When you need additional relationships, prefer existing global collections or propose extensions in ADRs before adding new ones.
- Keep defaults sensible: choose the most common layout or toggle as `defaultValue`, especially for stylistic selectors (alignment, size, colour scheme, layout variants). Components should be able to rely on these defaults without re-normalising values.
- When you have multiple small, related settings (e.g. paired toggles, select boxes, numeric inputs), wrap them in a `type: "row"` so editors see them inline.
- **Example:** canonical config layout with defaults for stylistic controls

  ```ts
  import type { Block } from "payload"

  import { link } from "@/components/fields/link/link"
  import { sectionSettings } from "@/components/fields/section"

  export const Hero: Block = {
    slug: "hero",
    interfaceName: "HeroBlock",
    fields: [
      {
        type: "collapsible",
        label: "Content",
        fields: [
          { name: "preheading", type: "text", admin: { placeholder: "Optional label" } },
          { name: "heading", type: "text", required: true },
          { name: "supportingText", type: "textarea", admin: { rows: 4 } },
        ],
      },
      {
        type: "collapsible",
        label: "Media",
        admin: { initCollapsed: true },
        fields: [
          {
            name: "backgroundImage",
            type: "upload",
            relationTo: "media",
          },
        ],
      },
      {
        type: "collapsible",
        label: "Layout",
        admin: { initCollapsed: true },
        fields: [
          {
            type: "row",
            fields: [
              {
                name: "size",
                type: "select",
                defaultValue: "large",
                options: [
                  { label: "Full viewport", value: "full" },
                  { label: "Large", value: "large" },
                  { label: "Medium", value: "medium" },
                  { label: "Compact", value: "small" },
                ],
              },
              {
                name: "alignment",
                type: "select",
                defaultValue: "left",
                options: [
                  { label: "Left aligned", value: "left" },
                  { label: "Centre aligned", value: "center" },
                ],
              },
              {
                name: "visualStyle",
                type: "select",
                defaultValue: "classic",
                options: [
                  { label: "Classic", value: "classic" },
                  { label: "Image overlay", value: "image-overlay" },
                  { label: "Gradient panel", value: "gradient" },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "collapsible",
        label: "Buttons",
        admin: { initCollapsed: true },
        fields: [
          {
            name: "buttons",
            type: "array",
            defaultValue: [],
            fields: [
              link({
                optional: true,
                defaultAppearance: "button",
                overrides: { name: "button" },
              }),
            ],
          },
        ],
      },
      sectionSettings(),
    ],
  }
  ```

## 3. Component Rules (`Component.tsx`)

- Import generated types from `@/admin/payload/payload-types` and annotate the function signature (e.g. `export function HeroComponent(props: HeroBlock)`).
- Wrap **every section** in the shared `<Section>` component. Only set `disableContainer` when the design truly needs full-bleed content.
- Reach for design-system utilities instead of custom values. Cross-reference `DESIGN-SYSTEM.md`; never hard-code pixel sizes or bespoke Tailwind classes that duplicate the shared tokens.
- Re-use shared field components (`CMSLink`, `RichText`, `Media`, `ButtonsGroup`, etc.) so data normalization stays consistent. When a field returns an array, map through a normalized helper before rendering.
- Let Payload defaults do the heavy lifting. Avoid re-normalizing enum values inside the component—read the generated types, trust defaultValue, and handle `null` cases only when the schema marks a field as optional.
- Drive layout and tone through `tailwind-variants` (or an equivalent class map) and resolve all slot classes up front:
  - Declare slots for every region (`section`, `content`, `wrapper`, `copy`, `supporting`, `buttonItem`, etc.).
  - Assign the resolved strings to constants (e.g. `const wrapperClassName = wrapper()`), then pass those variables to JSX. Do not call the slot helpers inline.
  - Litmus test: if you see `className={slot()}` in your JSX, move that call to a `const` above the return.
  - Use variants to switch tone (`light` vs `dark`), alignment, container flush states, and per-element spacing rather than injecting conditional `cn()` calls in the markup.
- When rendering media, pass the raw field value directly to `<Media>`. The component will ignore non-object inputs; no local `typeof === "object"` guards are needed.
- Keep markup lean. Avoid redundant wrappers, stray `div`s, or re-exported fragments—structure should match the visual intent exactly.
- Always import the generated Payload types; never recreate interfaces or enums locally.
- All optional content must be guarded (`if (!heading) return null` or inline ternaries). Never render empty wrappers.
- Keep logic declarative. Derive class names with maps keyed by enumerations, not by if/else blocks scattered throughout the JSX.
- Use Tailwind utilities first. When you need bespoke styling, extend the shared CSS layers (`spacing.css`, `typography.css`, `colors.css`, `utilities.css`) instead of creating local modules, and source every value from the design tokens.
- Do not mutate props. Derive new objects or arrays locally.
- Mark `Component.tsx` with `"use client"` when the whole section needs interactive behaviour. Otherwise, keep it server-side and split interactivity into an optional `client.tsx` that you lazy-load and pass only the required props.

```tsx
/*************************************************************************/
/*  HERO VARIANTS                                                        */
/*************************************************************************/
const heroVariants = tv({
  slots: {
    section: "relative isolate overflow-hidden",
    content: "relative z-10 w-full",
    wrapper: "gap-content flex flex-col",
    copy: "gap-content-sm flex flex-col",
    buttons: "gap-content-sm flex flex-wrap items-center",
    preheading: "text-xs uppercase tracking-widest",
    heading: "",
    supporting: "max-w-2xl text-pretty",
    buttonItem: "gap-content-xs inline-flex items-center",
  },
  variants: {
    alignment: {
      left: { wrapper: "items-start text-left" },
      center: {
        wrapper: "items-center text-center",
        copy: "items-center text-center",
        buttons: "justify-center",
        preheading: "mx-auto",
        supporting: "mx-auto text-center",
      },
    },
    tone: {
      light: {
        preheading: "text-dark-500",
        supporting: "text-dark-600",
      },
      dark: {
        section: "text-white",
        preheading: "text-white/80",
        heading: "text-white",
        supporting: "text-white/80",
      },
    },
  },
  defaultVariants: {
    alignment: "left",
    tone: "light",
  },
})

export function HeroComponent(props: HeroBlock) {
  const {
    heading,
    preheading,
    supportingText,
    buttons = [],
    alignment = "left",
    visualStyle = "classic",
    sectionSettings,
  } = props

  /**
   * Payload Fields
   */
  const heroButtons = buttons.filter(buttonItem => Boolean(buttonItem?.button))
  const hasButtons = heroButtons.length > 0
  const tone = visualStyle === "image-overlay" ? "dark" : "light"

  /**
   * Tailwind Variants
   */
  const {
    section,
    content,
    wrapper,
    copy,
    buttons: buttonsSlot,
    preheading: preheadingSlot,
    heading: headingSlot,
    supporting: supportingSlot,
    buttonItem,
  } = heroVariants({
    alignment,
    tone,
  })

  /**
   * Class Names
   */
  const sectionClassName = section()
  const contentClassName = content()
  const wrapperClassName = wrapper()
  const copyClassName = copy()
  const buttonsClassName = buttonsSlot()
  const preheadingClassName = preheadingSlot()
  const headingClassName = headingSlot()
  const supportingClassName = supportingSlot()
  const buttonItemClassName = buttonItem()

  /**
   * Render
   */
  return (
    <Section sectionSettings={sectionSettings} className={sectionClassName}>
      <div className={contentClassName}>
        <div className={wrapperClassName}>
          <div className={copyClassName}>
            {preheading ? <p className={preheadingClassName}>{preheading}</p> : null}
            <h1 className={headingClassName}>{heading}</h1>
            {supportingText ? (
              <p className={supportingClassName}>{supportingText}</p>
            ) : null}
          </div>

          {hasButtons ? (
            <div className={buttonsClassName}>
              {heroButtons.map((buttonItem, index) => (
                <CMSLink
                  key={`hero-button-${index}`}
                  {...buttonItem.button!}
                  className={buttonItemClassName}
                />
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </Section>
  )
}
```

- Block comment headers (e.g. `/*************************************************************************/`) belong at the very top of a file. Inside components, favour the inline JSDoc-style separators (`/** … */`) shown in the example (`/**  * Payload Fields  */`) to mark major logic groups.

## 4. Data Access & Caching

- Rely on the injected page context first. Every section receives `document`, `collection`, `breadcrumbs`, `searchParams`, and `params`; prefer these props before issuing new queries.
- When additional data is required, import `cache` from `@/admin/cache` and call the shared helpers server-side. Core methods: `getByURI`, `getBySlug`, `getByID`, `getCollection`, `getGlobal`, `getAllURIs`.
- Avoid calling `getPayload()` or direct fetches inside sections. Wrap cache calls in domain helpers under `src/lib/<domain>/…` (or the client’s `src/lib`) so the logic stays reusable and inherits smart revalidation.
- Match the cache API’s `QueryOptions` shape (`limit`, `sort`, `where`, `depth`, `overrideAccess`, `draft`) when composing queries. This keeps invalidation tags accurate.
- Only expose section-level toggles for draft or alternate datasets when a user story demands it. Otherwise, let the defaults (published content, depth 5) flow from the cache helpers.

### Pagination patterns

- Reuse the shared pagination tooling instead of rolling custom “next/previous” controls. The canonical implementation lives alongside the posts archive:
  - Fetch paginated data through a helper that returns `docs`, `page`, `totalPages`, and `totalDocs` (e.g. `getPostsWithPagination`).
  - Drive the page index from `searchParams.page` and always coerce it to a positive integer.
  - Pass the resulting metadata straight into `<Pagination>` (for the button group) and `<PageRange>` (for the “Showing x–y of z” copy). Both components live in `@/components/fields/pagination` and accept tone-aware props.
  - Build the destination URL once via an `archiveUri` (usually the current document breadcrumb). The component handles appending `?page=`—do not concatenate page numbers manually.
- Config schema: expose toggles such as “Show pagination” or “Show page range” plus basic settings (page size, sort order). Avoid re-declaring link arrays or explicit page labels; the pagination field set owns that UI.
- When another section needs pagination, mirror the `PostsArchiveComponent` structure: fetch, derive the archive URI, render your collection grid/list, then hand the metadata to the shared pagination components.

## 5. Layout, Spacing, and Containers

- Vertical rhythm is handled by the `<Section>` wrapper. Do **not** add `py-section-*` utilities directly inside a section component—the wrapper already applies the default rhythm and Section Settings adjust it when required.
- Containers:
  - Default to `container`. This default is enforced via `sectionSettings` (`defaultValue: "lg"`). Do **not** set container utilities manually inside the component.
  - When a narrower presentation is required, rely on Section Settings to switch to `container-md` or `container-sm`.
  - For true full-bleed content (media strips, banners), use `disableContainer` and manage padding with section settings.
- Interior spacing pulls from two coordinated scales:
  - **Content scale** (`gap-content-xss`, `gap-content-xs`, `gap-content-sm`, `gap-content`, `gap-content-lg`, `gap-content-xl`, `gap-content-xxl`, with matching padding utilities `p-content-*`). Use these for flex layouts, stacks, cards, and component padding.
  - **Grid scale** (`gap-grid-xs`, `gap-grid-sm`, `gap-grid`, `gap-grid-lg`, `gap-grid-xl`, `gap-grid-xxl`). Use these only inside CSS grids; they track the same progression but stage larger leaps for multi-column layouts.
- Control spacing for UI elements (buttons, inputs) comes from the control scale (`px-control-sm`/`py-control-*`). Reach for these when adjusting individual form controls or icon buttons.
- Section Settings exposes independent padding controls for top, right, bottom, and left (presented inline at 25% width each). Keep `px-section-x` and `py-section-y` as the baseline, then override individual sides with the generated utilities (`pt-section-sm`, `pb-section-none`, `pl-section-xs`, `pr-section-lg`). Avoid ad hoc `mt-*`/`mb-*` spacing on children.
- Section padding also has a full scale (`px-section-none`, `px-section-xs`, `px-section-sm`, `px-section-lg`, `px-section-xl`, plus matching `py-section-*` variants). Only toggle these via Section Settings so the vertical rhythm remains consistent across the site.
- Use the container offset helpers (`pl-container-offset`, `pr-container-offset`, and their `-md`/`-sm` variants) when you need full-bleed elements to align with the container gutters.
- Treat Section Settings as client/editor overrides. When building a section, assume the defaults (standard container, light scheme, baseline padding) unless a user story explicitly requires exposing additional toggles or changing the defaults via schema.
- When mixing grids and flex layouts, align gap tokens with the underlying display type (grid → `gap-grid`, flex → `gap-content`).
- Avoid manual margins between siblings. Let the parent flex/grid gap control spacing.

## 6. Typography and Rich Text

- Use semantic tags (`h1`–`h6`, `p`, `ul`) and allow the global typography sheet to style them.
- Default to the design-system tokens; the most common overrides you will apply are size (`text-sm`, `text-lg`, `leading-relaxed`) and colour (`text-body`, `text-muted`). If a stakeholder explicitly requests something extra—such as bumping weight to `font-semibold`—honour the brief with the nearest token and avoid adding unsolicited embellishments.
- Utility overrides must come from the generated scale (`text-sm`, `leading-snug`, `font-semibold`), never custom pixel values.
- Rich text payloads **must** render through the shared `<RichText>` component with `enableGutter` and `className` overrides instead of ad hoc `dangerouslySetInnerHTML`.
- Pre-headings, legal copy, captions, and metadata use the body scale tokens and simple utilities (uppercase, tracking). Avoid one-off custom classes like bespoke `.text-preheading`.

## 7. Colour, Themes, and Inversion

- Colour changes come from Section Settings (light, neutral, dark) or parent-level CSS variables. Only apply manual colour utilities for edge cases (e.g. CTA button variants).
- To invert tone (e.g. light-on-dark), toggle Section Settings → colour scheme rather than sprinkling `text-white`/`bg-dark` in component markup.
- When a section needs accent colours beyond the neutral palette, use theme tokens (`text-primary-500`, `bg-secondary-100`). Introduce new tokens in `colors.css` before using raw hex values.
- Ensure every nested element—typography, buttons, badges, cards—derives its colours from the current scheme. Use semantic classes (`text-body`, `text-heading`, button variants tied to the palette) instead of hard-coded values so light/neutral/dark variants stay in sync.
- Some sections may only ever ship with a single colour treatment; in those cases you can keep one scheme and omit additional variants. Default to the shared schemes unless the design brief explicitly says a section is single-theme only.

## 8. Interactivity and Animations

- Confirm the desired motion strategy up front. Ask the requester (or inspect adjacent sections) to determine whether the project relies on global data attributes, bespoke GSAP timelines, or shared effects—then follow the same pattern unless you are explicitly asked to change it.
- **Global data attributes**: when SmartSite config enables global animations, add hooks once at the parent instead of scattering per-child delays.
  - Use `data-animate="fade-up"` + `data-animate-stagger`, and point `data-animate-target` (or `[data-animate-item]`) at the descendants you want to tween together.
  - Avoid assigning individual `data-animate-delay` values when a single stagger will do; it keeps the ScrollTrigger footprint lean and the markup clearer.
  - Other helpers (`data-parallax`, `data-rotate`, `data-typewriter`, `data-pulse`, `data-split`) follow the same pattern—apply to the element that conceptually owns the effect.
- Available global hooks (see `src/providers/gsap/global-animations.tsx` for options and defaults):
  | Hook | Purpose | Common attributes |
  | --- | --- | --- |
  | `data-animate` | Fade/slide on scroll | `data-animate-distance`, `data-animate-duration`, `data-animate-stagger`, `data-animate-target`, `data-animate-offset`, `data-animate-repeat` |
  | `data-parallax` | Scroll-tied parallax | `data-parallax-speed`, `data-parallax-start`, `data-parallax-end`, `data-parallax-scrub` |
  | `data-rotate` | Scroll-driven rotations | `data-rotate-turns`, `data-rotate-start`, `data-rotate-end`, `data-rotate-scrub` |
  | `data-typewriter` | Typewriter effect | `data-typewriter-speed`, `data-typewriter-delay`, `data-typewriter-ease`, `data-typewriter-start`, `data-typewriter-repeat` |
  | `data-pulse` | Looping pulse | `data-pulse-scale`, `data-pulse-duration` |
  | `data-split` | SplitText animations | `data-split` (`lines`/`words`/`chars`), `data-split-stagger`, `data-split-duration`, `data-split-ease`, `data-split-offset` |
- **Example – parent/child fade/stagger**
  ```tsx
  <div
    data-animate="fade-up"
    data-animate-distance="24"
    data-animate-stagger="0.1"
    data-animate-target="[data-animate-child]"
  >
    <h2 data-animate-child>Heading</h2>
    <p data-animate-child>Supporting copy</p>
    <div data-animate-child>Buttons…</div>
  </div>
  ```
- **Bespoke timelines with `useGSAP`**: for custom sequences, mark the component (or a nested helper) with `"use client"`, create a ref, and call `useGSAP` from `@/providers/gsap`. Scope animations with `gsap.context`, clean up on unmount, and follow the patterns in `apps/clients/elvora/src/components/sections/*` for reference.
- **Reusable GSAP effects**: place shared animations in `src/providers/gsap/effects.ts` (using `gsap.registerEffect`) so sections can call `gsap.effects.myEffect(targets, config)` without duplicating timelines. This keeps motion consistent across the catalogue.
- Keep third-party animation libraries out of sections. If you discover a missing helper, register it centrally in the GSAP provider rather than inlining it per section.

## 9. Accessibility and Semantics

- Maintain heading order relative to the page (no skipping levels). The hero typically renders the `h1`; subsequent sections should start at `h2`.
- Provide alt text through Media fields or computed fallbacks. Never leave background images without context if they convey information.
- Buttons/links from Payload should expose `aria-label` and `rel` attributes via the shared `CMSLink` component. Do not wrap block-level elements inside links unless the HTML specification allows it.
- Ensure interactive elements are keyboard reachable and visually focusable.

## 10. Data Safety and Performance

- Avoid heavy computations inside render. Pre-compute derived data at the top of the component.
- Lazy-load expensive subcomponents with `next/dynamic` if they introduce large bundles (e.g. charts, maps). Document the decision in the section README if you do.
- Do not fetch data directly within a section component. All data must come from the section props or shared loaders.

## 11. Review Checklist Before Shipping

- [ ] Folder and files follow naming contract (`kebab-case`, `config.ts`, `Component.tsx`).
- [ ] `config.ts` imports shared field presets and ends with `sectionSettings()`.
- [ ] Component wraps content with `<Section>` and uses container/gap/typography tokens only.
- [ ] Optional data guarded; no empty wrappers rendered when fields are blank.
- [ ] Animations use shared provider or declarative attributes; `"use client"` only when required.
- [ ] Accessibility reviewed (heading levels, alt text, focus states).
- [ ] Section registered in both `sections/config.ts` and `sections-map.tsx`.
- [ ] Storybook or catalogue preview (blocks library) updated if the section is installable.
- [ ] Manual QA on default, min, and max viewport widths to confirm fluid type/spacing behaves.

## 12. Coordination with the Blocks Library

- When promoting a section to the public catalogue, mirror the SmartSite folder into `apps/blocks-library/src/registry/sections/<name>/` without diverging token usage.
- Provide preview fixtures that use the same field schema so the catalogue renders accurately.
- Keep dependency metadata up-to-date (`packages/cli/src/registry/sections.ts`) so the CLI installs required fields, animations, and utilities.

## 13. Evolving the Guidelines

- ESLint enforces the key violations automatically. When the linter flags classes such as `bg-white`, `text-dark-500`, `tracking-[...]`, or the presence of a top-level `"use client"` directive, refactor the section to rely on the shared tokens or split the interactive code into `client.tsx`. Use `// smartsite-allow-client` in the rare cases where a section must remain entirely client-side.
- Any proposal to deviate from these rules must include:
  - A documented rationale (link to ADR or GitHub issue).
  - Updates to this guideline and `DESIGN-SYSTEM.md`.
  - Communication to the team before merging.
- Treat this document as the source of truth. If you discover a helpful pattern while building sections, codify it here before rolling it out.

Adhering to this checklist guarantees that every SmartSite section is portable, composable, and ready for automation via the CLI. Break the rules only with explicit approval and documented trade-offs.
