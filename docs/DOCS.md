# DOCS

This document defines how the SmartSite docs harness works.

## Purpose

SmartSite is a portable starter. Its docs need to make sense after export into a standalone repository, not only while it still lives under `apps/smart-site/` in the factory monorepo.

## Routing rule

- Start from [docs/index.md](index.md) and follow the smallest matching task route.
- Do not read `docs/PRODUCT.md` or this file unless the task needs product framing or the routing itself is unclear.

## Source manuscript rule

- [docs/references/source-manuscript.md](references/source-manuscript.md) explains how the preserved README is used as source material.
- The docs harness is the canonical routing layer and the canonical home for durable operational truth.
- When a README section contains current truth, preserve its wording and structure as much as possible when promoting it into docs.
- Agents should not open the preserved manuscript or legacy references first. Use them only when a canonical doc needs provenance or extra wording detail.

## Environment rule

Before taking operational actions, determine which hosting model you are in:

- hosted Mongo plus managed hosting
- self-hosted Mongo appliance

The detection rules and command surfaces live in [docs/product-specs/hosting-modes.md](product-specs/hosting-modes.md).

## Canonical document types

- `docs/PRODUCT.md`: big-picture SmartSite truth.
- `docs/workflows/`: exact setup, development, deployment, preview, and recovery procedures.
- `docs/engineering/`: architecture, design-system, section-building, routing, and configuration truth.
- `docs/rules/`: hard constraints.
- `docs/product-specs/`: durable behavior and capability docs.
- `docs/references/`: longform manuscript and future legacy/reference material.
