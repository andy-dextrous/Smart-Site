import React from "react"
import { cn } from "@/utilities/ui"

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The alignment of items
   * @default "flex-start"
   */
  align?: "flex-start" | "flex-end" | "center" | "stretch" | "baseline"
  /**
   * The distribution of items
   * @default "flex-start"
   */
  justify?:
    | "flex-start"
    | "flex-end"
    | "center"
    | "space-between"
    | "space-around"
    | "space-evenly"
  /**
   * The direction to stack the items
   * @default "row"
   */
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  /**
   * If true, flex items will wrap
   * @default false
   */
  wrap?: boolean | "wrap" | "nowrap" | "wrap-reverse"
  /**
   * The gap between items
   * @default "0"
   */
  gap?: string | number
  /**
   * The basis value
   */
  basis?: string | number
  /**
   * The grow value
   */
  grow?: number | string
  /**
   * The shrink value
   */
  shrink?: number | string
}

/**
 * Flex is a layout component used to group elements together and apply flexbox properties
 */
function Flex({
  align = "flex-start",
  justify = "flex-start",
  direction = "row",
  wrap = false,
  gap = 0,
  basis,
  grow,
  shrink,
  className,
  style,
  children,
  ...props
}: FlexProps) {
  // Process wrap property
  let wrapValue: string
  if (wrap === true) wrapValue = "wrap"
  else if (wrap === false) wrapValue = "nowrap"
  else wrapValue = wrap

  // Process numeric values
  const gapValue = typeof gap === "number" ? `${gap}px` : gap
  const basisValue = typeof basis === "number" ? `${basis}px` : basis

  // Create style object
  const flexStyles: React.CSSProperties = {
    ...style,
    gap: gapValue,
  }

  if (basis !== undefined) flexStyles.flexBasis = basisValue
  if (grow !== undefined) flexStyles.flexGrow = grow
  if (shrink !== undefined) flexStyles.flexShrink = shrink

  // Create class list based on props
  const flexClasses = cn(
    "flex",
    {
      "flex-row": direction === "row",
      "flex-col": direction === "column",
      "flex-row-reverse": direction === "row-reverse",
      "flex-col-reverse": direction === "column-reverse",
    },
    {
      "flex-wrap": wrapValue === "wrap",
      "flex-nowrap": wrapValue === "nowrap",
      "flex-wrap-reverse": wrapValue === "wrap-reverse",
    },
    {
      "items-start": align === "flex-start",
      "items-end": align === "flex-end",
      "items-center": align === "center",
      "items-stretch": align === "stretch",
      "items-baseline": align === "baseline",
    },
    {
      "justify-start": justify === "flex-start",
      "justify-end": justify === "flex-end",
      "justify-center": justify === "center",
      "justify-between": justify === "space-between",
      "justify-around": justify === "space-around",
      "justify-evenly": justify === "space-evenly",
    },
    className
  )

  return (
    <div className={flexClasses} style={flexStyles} {...props}>
      {children}
    </div>
  )
}

export { Flex }
export default Flex
