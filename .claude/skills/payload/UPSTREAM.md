# Provenance

Source: https://github.com/payloadcms/payload/tree/aebbf75b93e218be4b53a3c7922e0bc82924830b/packages/payload/skills/payload

Snapshot retrieved 25 October 2026. MIT license retained in LICENSE.md, copyright Payload CMS. The source snapshot spans newer Payload APIs; this copy is maintained for SmartSite's installed Payload **3.92.0**.

SmartSite adaptations:

- Follow the 4.0.2 source layout: native Payload modules under `src/payload`, React hooks under `src/hooks`, runtime services under `src/lib`, and CMS presentation under `src/components/cms`.

- Route setup, content and configuration through the standalone harness and existing project scripts; do not create another app or use the Payload 4 build command.
- Correct Local API permission defaults and user-authorized calls, update/delete query access, persisted draft states, and the project slug/URI factory.
- Use `payload/shared` for field guards, the installed guard signatures, `AuthStrategyFunction`, `EXPERIMENTAL_TableFeature`, `createLocalReq`, and the version-3 workflow handler API.
- Preserve the existing role model, transactional requests, durable publication, and configured jobs executor. Correct plugin access/filter composition and admin component slots.
- Keep adapter recipes for installed providers; route additional providers to their matching installed version types. Remove speculative app scaffolding and replacement field-factory implementations.
- Pin source links to v3.92.0. Online unversioned docs are useful for discovery but must not override the installed API.

Compatibility was checked against the installed package's `dist/collections/operations/local`, `dist/collections/operations`, `dist/versions/baseFields.js`, `dist/fields/config/types.{js,d.ts}`, `dist/exports/shared.d.ts`, `dist/queues/{localAPI.d.ts,config/types}`, `dist/collections/config/types.d.ts`, and the installed Lexical/Next exports. Representative imports, collection fields, access policies, workflow calls and plugin composition examples were type-checked against 3.92.0. This is documentation verification, not proof that every app-specific callback in the illustrative snippets is implemented.

Do not silently refresh this snapshot or install packages merely because an example mentions them. The Codex and Claude skill folders are synchronized ordinary file copies; update them together.
