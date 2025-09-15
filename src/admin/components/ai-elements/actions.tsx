"use client"

import { Button } from "@/admin/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/admin/components/ui/tooltip"
import { cn } from "@/admin/utilities/ui"
import type { ComponentProps } from "react"

export type ActionsProps = ComponentProps<"div">

export const Actions = ({ className, children, ...props }: ActionsProps) => (
  <div className={cn("text-admin-600 dark:text-admin-400 flex items-center gap-1", className)} {...props}>
    {children}
  </div>
)

export type ActionProps = ComponentProps<typeof Button> & {
  tooltip?: string
  label?: string
}

export const Action = ({
  tooltip,
  children,
  label,
  className,
  variant = "ghost",
  size = "sm",
  ...props
}: ActionProps) => {
  const button = (
    <Button
      className={cn(
        "text-admin-600 dark:text-admin-400 hover:text-admin-900 dark:hover:text-admin-100",
        className
      )}
      size={size}
      type="button"
      variant={variant}
      {...props}
    >
      {children}
      <span className="sr-only">{label || tooltip}</span>
    </Button>
  )

  if (tooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return button
}
