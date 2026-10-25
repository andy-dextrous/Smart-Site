import { getClientSideURL } from "@/lib/get-url"

/** Same-origin media is a local Next image request, including loopback previews. */
export function mediaURL(value: string, origin = getClientSideURL()): string {
  if (value.startsWith("/") && !value.startsWith("//")) return value
  const url = new URL(value, origin)
  return url.origin === new URL(origin).origin
    ? `${url.pathname}${url.search}${url.hash}`
    : url.href
}
