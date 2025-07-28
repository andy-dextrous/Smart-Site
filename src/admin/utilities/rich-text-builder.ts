/*************************************************************************/
/*  RICH TEXT BUILDER UTILITY
/*  
/*  This utility provides functions to build Lexical editor content for 
/*  Payload CMS. All functions match the exact syntax requirements of the
/*  Lexical editor format used in seed files.
/*************************************************************************/

/*************************************************************************/
/*  TYPE DEFINITIONS
/*************************************************************************/

interface TextNodeOptions {
  format?: 0 | 1 | 2 | 3 | number
  mode?: "normal" | "token" | "segmented"
  style?: string
}

interface BlockNodeOptions {
  direction?: "ltr" | "rtl" | null
  format?: "" | "start" | "center" | "left" | "right" | "end" | "justify"
  indent?: number
}

interface HeadingOptions extends BlockNodeOptions {
  tag?: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
}

interface ParagraphOptions extends BlockNodeOptions {
  textFormat?: number
  textStyle?: string
}

interface ListOptions extends BlockNodeOptions {
  start?: number
}

interface ParagraphBlock {
  children: any[]
  direction: "ltr" | "rtl" | null
  format: "" | "start" | "center" | "left" | "right" | "end" | "justify"
  indent: number
  type: "paragraph"
  version: number
  textFormat: number
  textStyle: string
}

type InlineElement =
  | string
  | { type: "bold"; text: string }
  | { type: "italic"; text: string }
  | { type: "boldItalic"; text: string }
  | { type: "link"; text: string; url: string; newTab?: boolean }
  | { type: "linebreak" }

/*************************************************************************/
/*  FORMATTING CONSTANTS
/*************************************************************************/

export const FORMAT = {
  NORMAL: 0,
  BOLD: 1,
  ITALIC: 2,
  BOLD_ITALIC: 3,
} as const

/*************************************************************************/
/*  CORE TEXT NODE BUILDER
/*************************************************************************/

function createTextNode(text: string, options: TextNodeOptions = {}) {
  return {
    detail: 0,
    format: options.format || 0,
    mode: options.mode || "normal",
    style: options.style || "",
    text,
    type: "text",
    version: 1,
  }
}

/*************************************************************************/
/*  UTILITY FUNCTIONS
/*************************************************************************/

function generateId(): string {
  return Math.random().toString(36).substr(2, 24)
}

export function inlineElements(elements: InlineElement[]) {
  return elements.map(element => {
    if (typeof element === "string") {
      return createTextNode(element)
    }

    switch (element.type) {
      case "bold":
        return createTextNode(element.text, { format: FORMAT.BOLD })
      case "italic":
        return createTextNode(element.text, { format: FORMAT.ITALIC })
      case "boldItalic":
        return createTextNode(element.text, { format: FORMAT.BOLD_ITALIC })
      case "link":
        return {
          children: [createTextNode(element.text)],
          direction: "ltr" as const,
          format: "" as const,
          indent: 0,
          type: "link",
          version: 3,
          fields: {
            linkType: "custom",
            newTab: element.newTab || false,
            url: element.url,
          },
          id: generateId(),
        }
      case "linebreak":
        return {
          type: "linebreak",
          version: 1,
        }
      default:
        return createTextNode("")
    }
  })
}

/*************************************************************************/
/*  BLOCK ELEMENT BUILDERS
/*************************************************************************/

export function heading(text: string, options: HeadingOptions = {}) {
  return {
    children: [createTextNode(text)],
    direction: options.direction || ("ltr" as const),
    format: options.format || ("start" as const),
    indent: options.indent || 0,
    type: "heading",
    version: 1,
    tag: options.tag || "h2",
  }
}

export function paragraph(
  content: string | string[] | ReturnType<typeof inlineElements>,
  options: ParagraphOptions = {}
): ParagraphBlock | ParagraphBlock[] {
  // Handle array of strings - return array of paragraph blocks
  if (Array.isArray(content) && typeof content[0] === "string") {
    return (content as string[]).map(text => ({
      children: [createTextNode(text)],
      direction: options.direction || ("ltr" as const),
      format: options.format || ("start" as const),
      indent: options.indent || 0,
      type: "paragraph",
      version: 1,
      textFormat: options.textFormat || 0,
      textStyle: options.textStyle || "",
    }))
  }

  // Handle single string or inline elements - return single paragraph block
  const children = typeof content === "string" ? [createTextNode(content)] : content

  return {
    children,
    direction: options.direction || ("ltr" as const),
    format: options.format || ("start" as const),
    indent: options.indent || 0,
    type: "paragraph",
    version: 1,
    textFormat: options.textFormat || 0,
    textStyle: options.textStyle || "",
  }
}

export function emptyParagraph() {
  return {
    children: [],
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    type: "paragraph",
    version: 1,
    textFormat: 0,
    textStyle: "",
  }
}

/*************************************************************************/
/*  LIST ELEMENT BUILDERS
/*************************************************************************/

export function listItem(
  content: string | InlineElement[],
  value: number,
  options: { textFormat?: number } = {}
) {
  const children =
    typeof content === "string" ? [createTextNode(content)] : inlineElements(content)

  return {
    children,
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    type: "listitem",
    version: 1,
    textFormat: options.textFormat || 0,
    value,
  }
}

export function bulletList(
  items: Array<string | InlineElement[]>,
  options: ListOptions = {}
) {
  return {
    children: items.map((item, index) => listItem(item, index + 1)),
    direction: options.direction || ("ltr" as const),
    format: options.format || ("start" as const),
    indent: options.indent || 0,
    type: "list",
    version: 1,
    listType: "bullet",
    start: options.start || 1,
    tag: "ul",
  }
}

export function numberedList(
  items: Array<string | InlineElement[]>,
  options: ListOptions = {}
) {
  return {
    children: items.map((item, index) => listItem(item, index + 1)),
    direction: options.direction || ("ltr" as const),
    format: options.format || ("start" as const),
    indent: options.indent || 0,
    type: "list",
    version: 1,
    listType: "number",
    start: options.start || 1,
    tag: "ol",
  }
}

/*************************************************************************/
/*  MEDIA ELEMENT BUILDERS
/*************************************************************************/

export function image(mediaId: string, options: { format?: string; id?: string } = {}) {
  return {
    type: "upload",
    version: 3,
    format: options.format || "",
    id: options.id || generateId(),
    fields: null,
    relationTo: "media",
    value: {
      id: mediaId,
    },
  }
}

/*************************************************************************/
/*  LINK BUILDERS
/*************************************************************************/

export function link(text: string, url: string, options: { newTab?: boolean } = {}) {
  return {
    children: [createTextNode(text)],
    direction: "ltr" as const,
    format: "" as const,
    indent: 0,
    type: "link",
    version: 3,
    fields: {
      linkType: "custom",
      newTab: options.newTab || false,
      url,
    },
    id: generateId(),
  }
}

export function autolink(url: string) {
  return {
    type: "autolink",
    children: [createTextNode(url)],
    direction: "ltr" as const,
    fields: {
      linkType: "custom",
      url,
    },
    format: "" as const,
    indent: 0,
    version: 2,
  }
}

/*************************************************************************/
/*  SPECIAL ELEMENT BUILDERS
/*************************************************************************/

export function lineBreak() {
  return {
    type: "linebreak",
    version: 1,
  }
}

/*************************************************************************/
/*  MAIN RICH TEXT CONTENT BUILDER
/*************************************************************************/

export function createRichText(content: Array<any>) {
  // Flatten array to handle cases where paragraph() returns multiple blocks
  const flatContent = content.flat()

  return {
    root: {
      children: flatContent,
      direction: "ltr" as const,
      format: "" as const,
      indent: 0,
      type: "root",
      version: 1,
    },
  }
}

/*************************************************************************/
/*  CONVENIENCE BUILDERS FOR COMMON PATTERNS
/*************************************************************************/

export function simpleContent(
  items: Array<{ type: "heading" | "paragraph"; text: string; options?: any }>
) {
  const content = items.map(item => {
    if (item.type === "heading") {
      return heading(item.text, item.options)
    }
    return paragraph(item.text, item.options)
  })

  return createRichText(content)
}

export function linkParagraph(
  text: string,
  linkText: string,
  linkUrl: string,
  afterText?: string,
  options?: { newTab?: boolean }
) {
  const elements: InlineElement[] = [
    text,
    { type: "link", text: linkText, url: linkUrl, newTab: options?.newTab },
  ]
  if (afterText) elements.push(afterText)

  return paragraph(inlineElements(elements))
}

export function formattedList(
  items: Array<{ text: string; bold?: boolean; italic?: boolean }>,
  type: "bullet" | "numbered" = "bullet"
) {
  const formattedItems = items.map(item => {
    if (item.bold && item.italic) {
      return [{ type: "boldItalic" as const, text: item.text }]
    } else if (item.bold) {
      return [{ type: "bold" as const, text: item.text }]
    } else if (item.italic) {
      return [{ type: "italic" as const, text: item.text }]
    }
    return item.text
  })

  return type === "bullet" ? bulletList(formattedItems) : numberedList(formattedItems)
}

export function calloutBox(
  title: string,
  description: string,
  buttonText: string,
  buttonUrl: string,
  options?: { newTab?: boolean }
) {
  return [
    heading(title, { tag: "h3" }),
    paragraph(description),
    paragraph(
      inlineElements([
        { type: "link", text: buttonText, url: buttonUrl, newTab: options?.newTab },
      ])
    ),
  ]
}

/*************************************************************************/
/*  HEADING SHORTCUTS
/*************************************************************************/

export const h1 = (text: string, options?: Omit<HeadingOptions, "tag">) =>
  heading(text, { ...options, tag: "h1" })

export const h2 = (text: string, options?: Omit<HeadingOptions, "tag">) =>
  heading(text, { ...options, tag: "h2" })

export const h3 = (text: string, options?: Omit<HeadingOptions, "tag">) =>
  heading(text, { ...options, tag: "h3" })

export const h4 = (text: string, options?: Omit<HeadingOptions, "tag">) =>
  heading(text, { ...options, tag: "h4" })

export const h5 = (text: string, options?: Omit<HeadingOptions, "tag">) =>
  heading(text, { ...options, tag: "h5" })

export const h6 = (text: string, options?: Omit<HeadingOptions, "tag">) =>
  heading(text, { ...options, tag: "h6" })

/*************************************************************************/
/*  STANDALONE TEXT FORMATTING FUNCTIONS
/*************************************************************************/

export function bold(text: string) {
  return createTextNode(text, { format: FORMAT.BOLD })
}

export function italic(text: string) {
  return createTextNode(text, { format: FORMAT.ITALIC })
}

export function boldItalic(text: string) {
  return createTextNode(text, { format: FORMAT.BOLD_ITALIC })
}
