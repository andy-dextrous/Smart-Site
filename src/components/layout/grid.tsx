import React from "react"
import { cn } from "@/utilities/ui"

/*************************************************************************/
/*  GRID SYSTEM COMPONENTS
/*************************************************************************/

interface GridProps {
  children?: React.ReactNode
  className?: string
}

/*************************************************************************/
/*  BACKGROUND GRID LINES - Shows visual grid structure
/*************************************************************************/

interface GridLinesProps extends GridProps {
  fadeLines?: boolean
}

function GridLines({ children, className, fadeLines = false }: GridLinesProps) {
  return (
    <div
      className={cn(
        "border-light-border absolute inset-0 z-10 grid auto-rows-auto grid-cols-[repeat(3,var(--spacing-grid-col-width))_1fr_repeat(3,var(--spacing-grid-col-width))] border-x",
        className
      )}
    >
      {[1, 2, 3, 4, 5, 6, 7].map(item => (
        <div
          key={item}
          className={cn(
            `col-span-1 col-start-${item} col-end-${item + 1} border-light-border row-span-full row-start-1`,
            [2, 3, 4, 5].includes(item) && "xl:border-l",
            [5, 6].includes(item) && "xl:border-r",
            [2, 3].includes(item) && "lg:border-l",
            [5, 6].includes(item) && "lg:border-r",
            [2].includes(item) && "md:border-l",
            [6].includes(item) && "md:border-r"
          )}
        />
      ))}

      {children}
    </div>
  )
}

/*************************************************************************/
/*  CONTENT GRID - Contains actual content with higher z-index
/*************************************************************************/

function Grid({ children, className }: GridProps) {
  return (
    <div
      className={cn(
        "relative z-20 grid auto-rows-auto grid-cols-[repeat(3,var(--spacing-grid-col-width))_1fr_repeat(3,var(--spacing-grid-col-width))]",
        className
      )}
    >
      {children}
    </div>
  )
}

/*************************************************************************/
/*  GRID CONTAINER - Wraps both background lines and content
/*************************************************************************/

interface GridContainerProps {
  children?: React.ReactNode
  className?: string
  showLines?: boolean
  fadeLines?: boolean
}

function GridContainer({
  children,
  className,
  showLines = true,
  fadeLines = false,
}: GridContainerProps) {
  return (
    <div className={cn("relative", className)}>
      {showLines && <GridLines fadeLines={fadeLines} />}
      <Grid>{children}</Grid>
    </div>
  )
}

export { GridLines, Grid, GridContainer }
