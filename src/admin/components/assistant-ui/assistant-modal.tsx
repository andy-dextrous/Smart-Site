"use client"

import { BotIcon, ChevronDownIcon, SparklesIcon } from "lucide-react"

import { type FC, forwardRef } from "react"
import { AssistantModalPrimitive } from "@assistant-ui/react"

import { Thread } from "@/admin/components/assistant-ui/thread"
import { TooltipIconButton } from "@/admin/components/assistant-ui/tooltip-icon-button"

export const AssistantModal: FC = () => {
  return (
    <AssistantModalPrimitive.Root>
      <AssistantModalPrimitive.Anchor className="fixed right-8 bottom-8 size-20">
        <AssistantModalPrimitive.Trigger asChild>
          <AssistantModalButton />
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>
      <AssistantModalPrimitive.Content
        sideOffset={16}
        className="bg-admin-900 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out data-[state=open]:zoom-in data-[state=open]:slide-in-from-bottom-1/2 data-[state=open]:slide-in-from-right-1/2 data-[state=closed]:slide-out-to-bottom-1/2 data-[state=closed]:slide-out-to-right-1/2 border-admin-800 z-50 h-[80vh] max-h-[800px] w-[400px] overflow-clip rounded-xl border p-0 shadow-md outline-none [&>.aui-thread-root]:bg-inherit"
      >
        <Thread />
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  )
}

type AssistantModalButtonProps = { "data-state"?: "open" | "closed" }

const AssistantModalButton = forwardRef<HTMLButtonElement, AssistantModalButtonProps>(
  ({ "data-state": state, ...rest }, ref) => {
    const tooltip = state === "open" ? "Close Assistant" : "Open Assistant"

    return (
      <TooltipIconButton
        variant="secondary"
        size="icon-round-xl"
        tooltip={tooltip}
        side="top"
        {...rest}
        className="shadow transition-transform hover:scale-105 active:scale-95"
        ref={ref}
      >
        <SparklesIcon
          data-state={state}
          className="absolute transition-all data-[state=closed]:scale-100 data-[state=closed]:rotate-0 data-[state=open]:scale-0 data-[state=open]:rotate-90"
        />

        <ChevronDownIcon
          data-state={state}
          className="absolute transition-all data-[state=closed]:scale-0 data-[state=closed]:-rotate-90 data-[state=open]:scale-100 data-[state=open]:rotate-0"
        />
      </TooltipIconButton>
    )
  }
)

AssistantModalButton.displayName = "AssistantModalButton"
