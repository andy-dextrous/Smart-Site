import React from "react"
import { cn } from "@/utilities/ui"

export interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * If true, the content will be wrapped in a box that is full width and height of its parent
   * @default false
   */
  fullSize?: boolean
}

/*************************************************************************/
/*  CENTER COMPONENT
/*************************************************************************/

function Center({ className, fullSize = false, children, ...props }: CenterProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-center",
        fullSize && "h-full w-full",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export interface SquareProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Size (width and height) of the square
   */
  size?: string | number
}

/*************************************************************************/
/*  SQUARE COMPONENT
/*************************************************************************/

function Square({ className, size, children, style, ...props }: SquareProps) {
  const sizeValue = typeof size === "number" ? `${size}px` : size

  return (
    <Center
      className={cn("aspect-square", className)}
      style={{
        ...style,
        width: sizeValue,
        height: sizeValue,
      }}
      {...props}
    >
      {children}
    </Center>
  )
}

export interface CircleProps extends SquareProps {}

/*************************************************************************/
/*  CIRCLE COMPONENT
/*************************************************************************/

function Circle({ className, ...props }: CircleProps) {
  return <Square className={cn("rounded-full", className)} {...props} />
}

export { Center, Square, Circle }
export default Center
