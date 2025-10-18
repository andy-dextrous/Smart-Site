# Admin Providers – Claude Guide

The provider stack in `src/admin/payload/components/providers/` manages admin-only context such as the AI chat experience, layout guards, and provider routing. Keep these notes aligned with the README’s **AI Integration** section.

---
## 1. Module Overview
```
providers/
├── ai-provider.tsx          # Server wrapper (loads backend status)
├── ai-provider-client.tsx   # Client provider (chat store wiring)
├── layout-provider/         # Chat panel mount + layout helpers
├── provider-routes.ts       # Route guard utilities (skip providers for auth bootstrap)
└── README.md                # Extended documentation
```

- `ai-provider.tsx` runs on the server, calls `getAIBackendStatus()` from `@/admin/lib/ai/status`, and renders `AIProviderClient`.
- `ai-provider-client.tsx` is a client component that initializes the chat store, reacts to hotkeys (`meta+l`), and exposes context helpers (`useAIContext`).
- `layout-provider/chat-experience-mount.tsx` mounts the Assistant UI chat interface when providers are active.
- `provider-routes.ts` identifies routes that should bypass providers (e.g., auth bootstrap screens).

---
## 2. AI Provider Flow
1. Server wrapper checks backend availability and passes `enabled/reason` flags to the client provider.
2. Client provider initializes the Zustand chat store (`chat-store.ts`), controls hotkeys, and exposes `openChat`, `closeChat`, and `toggleChat`.
3. `ChatExperienceMount` renders the Assistant UI into the admin DOM when AI is enabled.
4. API routes under `app/(frontend)/api/ai/` proxy requests to the managed backend, using credentials seeded into `.env`.

---
## 3. Integration Guidelines
- Import `AIProvider` at the top of admin layouts to ensure chat is available everywhere except bootstrap routes.
- Use `useAIContext()` to control the chat panel from admin components. Guard actions with `isEnabled` to respect availability.
- When adding new tool UIs, define them under `src/admin/components/chat-panel/tool-uis/` and ensure they handle `running`, `complete`, `incomplete`, and `error` states.

---
## 4. High-Risk Files
- `ai-provider.tsx` – incorrect status handling hides the chat or blocks admin rendering.
- `ai-provider-client.tsx` – chat initialization bugs break hotkeys or leave the panel stuck open.
- `provider-routes.ts` – misconfigured exclusions can disable providers for legitimate admin routes.

---
## 5. Testing Checklist
- Chat panel toggles with `meta+l` when AI is enabled.
- Disabled AI surfaces the status reason and hides the panel.
- Auth bootstrap and onboarding routes render without provider wrappers.
- Tool UIs render execution state transitions correctly.

Update this guide alongside the README whenever the AI provider flow changes.
