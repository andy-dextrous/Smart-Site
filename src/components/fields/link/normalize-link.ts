type LinkCandidate = Record<string, any> | null | undefined

function hasLinkProperties(candidate: LinkCandidate) {
  if (!candidate || typeof candidate !== "object") return false
  return (
    "type" in candidate ||
    "url" in candidate ||
    "reference" in candidate ||
    "appearance" in candidate
  )
}

export function normalizeLinkField(candidate: LinkCandidate): Record<string, any> | null {
  if (!candidate || typeof candidate !== "object") {
    return null
  }

  if (hasLinkProperties(candidate)) {
    return {
      appearance: (candidate.appearance as string | undefined) ?? "link",
      ...candidate,
    }
  }

  if ("link" in candidate && typeof candidate.link === "object" && candidate.link) {
    return {
      appearance: "button",
      variant: candidate.variant ?? "default",
      size: candidate.size ?? "lg",
      layout: candidate.layout ?? "default",
      iconOnly: Boolean(candidate.icon),
      iconPosition: candidate.iconPosition ?? "left",
      ...candidate.link,
    }
  }

  return null
}
