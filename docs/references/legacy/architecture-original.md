# Architecture

This file is the high-level map of SmartSite as a standalone starter.

## Current repo state

SmartSite is a field-driven, section-first Next.js and Payload starter that keeps a protected admin layer, a configuration-driven customization surface, and MongoDB across local, hosted, and self-hosted environments.

## Product surfaces

- public App Router frontend
- protected admin layer
- extensions and overrides
- configuration surface in `src/smartsite.config.ts`
- optional hosted or self-hosted operating model

## Core invariants

- sections remain the main building blocks
- admin remains protected
- configuration over modification remains the default
- hosted and self-hosted flows must preserve the same site behavior
