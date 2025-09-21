# Chat Panel Architecture

## Why this folder exists
The Smart Site chat experience needs to render identically inside the Payload admin and on the storefront. Both surfaces load their own CSS stacks (Payload tokens, Tailwind, storefront theme), so the panel ships with an isolated styling bundle that can be injected into either environment without collisions. Everything required to mount, style, and run the chat now lives in this folder.

## Styling strategy
- Each component exports a semantic CSS string (for example `chatPanelShellStyles`) alongside the JSX that consumes it.
- `chat-styles.ts` composes all of those fragments, defines the shared design tokens, and exposes `injectChatStyles(target)` which injects a `<style>` tag into either `document.head` (admin) or a `ShadowRoot` (storefront).
- `chat-experience-mount.tsx` also injects the launcher styles when it boots the panel on the storefront. Because the CSS is string based we can hydrate the shadow host without relying on global style sheets or Tailwind at runtime.

This pattern keeps the chat visually stable, avoids leaking Tailwind utility classes, and lets us keep the code co-located with the markup while still supporting the shadow DOM use case.

## Key entry points
- `index.tsx` boots the panel inside the admin, injecting styles into the document once.
- `chat-experience-mount.tsx` renders the same core panel inside a shadow root on the storefront and manages the floating launcher.
- `chat-panel-core.tsx` renders the layout shell, tabs, message rail, and input. It is the component that other surfaces portal into.

## Data & runtime helpers
- `chat-store.ts`, `chat-storage.ts`, and `chat-threads-provider.tsx` handle Zustand state, persistent storage, and tab/thread orchestration.
- `active-chat-runtime.tsx` synchronises streamed responses, retries, and message status updates.
- `use-chat-auth-status.ts` and `get-document-theme.ts` bridge Payload auth and theme state into the panel so both surfaces stay in sync.

## AI element components
The `/ai` directory contains the rich response blocks (actions, sources, inline citations, reasoning chains, etc.). Each file exports:
1. The React component used by `chat-messages.tsx`.
2. A `...Styles` string that is re-exported in `chat-styles.ts` so the markup stays isolated from Tailwind utilities.

## Adding or updating components
1. Create or update the component `.tsx` file and give it semantic class names scoped to the chat (e.g. `chat-tool`, `chat-message__bubble`).
2. Declare the accompanying CSS string in the same file and export it.
3. Import that string in `chat-styles.ts` and include it in the `CHAT_PANEL_STYLES` template literal.
4. If the component should render on the storefront, make sure it is used inside `chat-panel-core.tsx` or one of its descendants.
5. Test in both admin light/dark mode and on the storefront shadow host to confirm the theme tokens resolve.

Following this workflow keeps the chat panel portable and guarantees all styling lives alongside the components it affects while still being injectable wherever the panel mounts.
