import { createHash } from "node:crypto"

/*************************************************************************/
/*  SEED SITE IDENTITY
/*************************************************************************/

type SeedIdentityInput = {
  payloadSecret: string
  previewSecret: string
  siteName: string
  publicUrl: string
}

function normalizeValue(value: string | undefined | null): string {
  return (value || "").trim()
}

export function createSeedSiteId(input: Omit<SeedIdentityInput, "previewSecret">): string {
  const payload = [
    "smartsite-seed-site-id",
    normalizeValue(input.siteName),
    normalizeValue(input.publicUrl),
    normalizeValue(input.payloadSecret),
  ].join("|")

  return createHash("sha256").update(payload).digest("hex").slice(0, 24)
}

export function createSeedProof(input: SeedIdentityInput): string {
  const siteId = createSeedSiteId(input)
  const payload = [
    "smartsite-seed-proof",
    siteId,
    normalizeValue(input.payloadSecret),
    normalizeValue(input.previewSecret),
  ].join("|")

  return createHash("sha256").update(payload).digest("hex")
}
