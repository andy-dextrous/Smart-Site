const authBootstrapSegments = new Set(["login", "create-first-user"])

export function isAuthBootstrapRoute(pathname?: string | null): boolean {
  if (!pathname) {
    return false
  }

  const segments = pathname.split("/").filter(Boolean)
  if (segments.length < 2) {
    return false
  }

  const lastSegment = segments[segments.length - 1]
  return authBootstrapSegments.has(lastSegment)
}
