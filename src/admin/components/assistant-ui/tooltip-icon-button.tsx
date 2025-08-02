"use client"

import { ComponentPropsWithoutRef, forwardRef } from "react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Button } from "@/admin/components/ui/button"
import { cn } from "@/admin/utilities/ui"

export type TooltipIconButtonProps = ComponentPropsWithoutRef<typeof Button> & {
  tooltip: string
  side?: "top" | "bottom" | "left" | "right"
}

export const TooltipIconButton = forwardRef<HTMLButtonElement, TooltipIconButtonProps>(
  (
    {
      children,
      tooltip,
      side = "bottom",
      className,
      variant = "ghost",
      size = "sm",
      ...rest
    },
    ref
  ) => {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size={size}
            {...rest}
            className={cn("aui-button-icon", className)}
            ref={ref}
          >
            {children}
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
    )
  }
)

TooltipIconButton.displayName = "TooltipIconButton"
