import parse from "html-react-parser"
import type { ReactNode } from "react"

/**
 * Parse HTML heading and convert span tags to gradient elements
 *
 * This utility function eliminates duplication across 6+ components
 * that all need to parse headings and apply gradient styling to spans.
 *
 * @param heading - HTML string containing the heading text with optional span tags
 * @returns Parsed React elements with span tags converted to gradient spans, or null if no heading
 */
export function parseHeadingGradient(heading?: string | null): ReactNode {
  if (!heading) {
    return null
  }

  return parse(heading, {
    replace: (domNode: any) => {
      if (domNode.name === "span") {
        return <span className="text-gradient">{domNode.children[0]?.data}</span>
      }
    },
  })
}
