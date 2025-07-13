import { MediaBlock } from "../../../blocks/media/Component"
import {
  DefaultNodeTypes,
  SerializedBlockNode,
  SerializedLinkNode,
  type DefaultTypedEditorState,
} from "@payloadcms/richtext-lexical"
import {
  JSXConvertersFunction,
  LinkJSXConverter,
  RichText as ConvertRichText,
} from "@payloadcms/richtext-lexical/react"

import { CodeBlock, CodeBlockProps } from "../../../blocks/code/Component"

import { cn } from "@/utilities/ui"
import "./styles.scss"

type NodeTypes = DefaultNodeTypes | SerializedBlockNode<any | CodeBlockProps>

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
    code: ({ node }) => <CodeBlock className="col-start-2" {...node.fields} />,
  },
})

type Props = {
  data: DefaultTypedEditorState
  enableGutter?: boolean
  variant?: "default" | "prose"
  textColor?: "inherit" | "dark" | "white" | "muted" | "primary" | "secondary"
} & React.HTMLAttributes<HTMLDivElement>

export default function RichText(props: Props) {
  const {
    className,
    enableGutter = true,
    variant = "default", // Default inherits from typography.css
    textColor = "inherit",
    ...rest
  } = props

  // Color classes mapping
  const colorClasses = {
    inherit: "[&>*]:text-inherit",
    dark: "[&>*]:text-dark",
    white: "[&>*]:text-white",
    muted: "[&>*]:text-gray-600 dark:[&>*]:text-gray-400",
    primary: "[&>*]:text-primary",
    secondary: "[&>*]:text-secondary",
  }

  return (
    <ConvertRichText
      converters={jsxConverters}
      className={cn(
        "payload-richtext",
        {
          // Default: No special classes - inherits from typography.css
          // Prose: Use Tailwind prose for blog content
          "prose prose-lg max-w-none": variant === "prose",

          // Gutter controls
          "payload-richtext--container": enableGutter,
          "payload-richtext--full-width": !enableGutter,
        },
        // Color classes
        colorClasses[textColor],
        className
      )}
      {...rest}
    />
  )
}
