import { MediaBlock } from "@/components/fields/media/block"
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from "@payloadcms/richtext-lexical"
import type {
  SerializedEditorState,
  SerializedLexicalNode,
} from "@payloadcms/richtext-lexical/lexical"
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from "@payloadcms/richtext-lexical/react"

import { cn } from "@/utilities/ui"

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<any>

/*************************************************************************/
/*  INTERNAL LINK RESOLVER - URI-FIRST ARCHITECTURE
/*************************************************************************/

const internalDocToHref = ({ linkNode }: { linkNode: SerializedLinkNode }) => {
  const { value, relationTo } = linkNode.fields.doc!
  if (typeof value !== "object") {
    throw new Error("Expected value to be an object")
  }

  // Homepage special case
  if (value.slug === "home") {
    return "/"
  }

  // Priority 1: Use URI field if available (Smart Routing Engine)
  if (value.uri && typeof value.uri === "string") {
    return value.uri.startsWith("/") ? value.uri : `/${value.uri}`
  }

  // Fallback: Basic slug construction (documents without URI field)
  const slug = value.slug
  return slug && typeof slug === "string" ? `/${slug}` : "/"
}

const jsxConverters: JSXConvertersFunction<NodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref }),
  blocks: {
    mediaBlock: ({ node }) => (
      <MediaBlock
        className="col-span-3 col-start-1"
        imgClassName="m-0"
        {...node.fields}
        captionClassName="mx-auto max-w-[48rem]"
        enableGutter={false}
        disableInnerContainer={true}
      />
    ),
  },
})

type RichTextVariant = "default" | "article" | "prose"

type Props = {
  data: DefaultTypedEditorState | SerializedEditorState<SerializedLexicalNode>
  enableGutter?: boolean
  variant?: RichTextVariant
  textColor?: "inherit" | "dark" | "white" | "muted" | "primary" | "secondary"
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const {
    className,
    enableGutter = true,
    variant = "default", // Default uses sitewide typography tokens
    textColor = "inherit",
    ...rest
  } = props

  const normalizedVariant = variant === "prose" ? "article" : variant

  // Color classes mapping
  const colorClasses = {
    inherit: "[&>*]:text-inherit",
    dark: "[&>*]:text-dark",
    white: "[&>*]:text-white",
    muted: "[&>*]:text-dark-600 dark:[&>*]:text-white/70",
    primary: "[&>*]:text-primary",
    secondary: "[&>*]:text-secondary",
  }

  const baseClass =
    normalizedVariant === "article" ? "prose prose-lg max-w-none" : "rich-text max-w-none"

  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        baseClass,
        enableGutter ? "mx-auto max-w-[75ch]" : null,
        colorClasses[textColor],
        className
      )}
      {...rest}
    />
  )
}
