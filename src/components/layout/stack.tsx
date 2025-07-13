import React from "react"
import { cn } from "@/utilities/ui"

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The direction to stack the items
   * @default "column"
   */
  direction?: "row" | "column" | "row-reverse" | "column-reverse"
  /**
   * The spacing between items
   * @default "0"
   */
  spacing?: string | number
  /**
   * If true, each child will be wrapped in a div with display: inline-block
   * @default false
   */
  wrap?: boolean
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
   * If true, the children will be divider by a divider
   * @default false
   */
  divider?: React.ReactElement
}

/*************************************************************************/
/*  STACK COMPONENT
/*************************************************************************/

// Removed forwardRef for React 19
function Stack({
  direction = "column",
  spacing = "0",
  wrap = false,
  align = "flex-start",
  justify = "flex-start",
  divider,
  className,
  children,
  ...props
}: StackProps) {
  // Convert numeric spacing to pixels, or use the string value
  const spacingValue = typeof spacing === "number" ? `${spacing}px` : spacing

  // Create class list based on props
  const stackClasses = cn(
    "flex",
    {
      "flex-row": direction === "row",
      "flex-col": direction === "column",
      "flex-row-reverse": direction === "row-reverse",
      "flex-col-reverse": direction === "column-reverse",
      "flex-wrap": wrap,
      "flex-nowrap": !wrap,
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

  // Create style object for gap
  const stackStyles = {
    gap: spacingValue,
  }

  // If no divider, just render children with spacing
  if (!divider) {
    return (
      <div className={stackClasses} style={stackStyles} {...props}>
        {children}
      </div>
    )
  }

  // With divider, children need to be treated specially
  const childrenArray = React.Children.toArray(children).filter(Boolean)
  const clonedWithDivider: React.ReactNode[] = []

  childrenArray.forEach((child, index) => {
    clonedWithDivider.push(child)

    if (index < childrenArray.length - 1) {
      const clonedDivider = React.cloneElement(divider as React.ReactElement<any>, {
        key: `divider-${index}`,
        className: cn(
          (divider as React.ReactElement<any>).props.className || "",
          direction.includes("row")
            ? "mx-[calc(var(--gap)/2)]"
            : "my-[calc(var(--gap)/2)]"
        ),
      })
      clonedWithDivider.push(clonedDivider)
    }
  })

  return (
    <div
      className={stackClasses}
      style={{ ...stackStyles, "--gap": spacingValue } as React.CSSProperties}
      {...props}
    >
      {clonedWithDivider}
    </div>
  )
}

export interface HStackProps extends Omit<StackProps, "direction"> {}

/*************************************************************************/
/*  HSTACK COMPONENT
/*************************************************************************/

function HStack(props: HStackProps) {
  return <Stack direction="row" {...props} />
}

export interface VStackProps extends Omit<StackProps, "direction"> {}

/*************************************************************************/
/*  VSTACK COMPONENT
/*************************************************************************/

function VStack(props: VStackProps) {
  return <Stack direction="column" {...props} />
}

export { Stack, HStack, VStack }
export default Stack
