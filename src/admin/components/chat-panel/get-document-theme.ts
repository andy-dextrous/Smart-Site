export type ChatTheme = "light" | "dark"

export function getDocumentTheme(): ChatTheme {
  if (typeof document === "undefined") {
    return "light"
  }
  const html = document.documentElement
  const explicit = html.getAttribute("data-theme")
  if (explicit === "dark") {
    return "dark"
  }
  if (html.classList.contains("dark")) {
    return "dark"
  }
  return "light"
}
