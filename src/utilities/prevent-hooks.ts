import type { Payload } from "payload"

/*************************************************************************/
/*  HOOK PREVENTION UTILITY
/*
/*  This utility uses PayloadCMS context pattern to prevent hooks during
/*  bulk operations like seeding. Context-based approach eliminates race
/*  conditions and database overhead.
/*************************************************************************/

export function shouldPreventHooks(payload: Payload, context?: any): boolean {
  return context?.preventHooks === true
}

/*************************************************************************/
/*  CONTEXT MANAGEMENT FUNCTIONS
/*************************************************************************/

export function disableSyncHooks(payload: Payload, context?: any): void {
  if (context) {
    context.preventHooks = true
  }
  payload.logger.info("Hook prevention enabled for seeding operations")
}

export function enableSyncHooks(payload: Payload, context?: any): void {
  if (context) {
    context.preventHooks = false
  }
  payload.logger.info("Hook prevention disabled - normal operations resumed")
}
