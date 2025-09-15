"use client"

import { Badge } from "@/admin/components/ui/badge"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/admin/components/ui/collapsible"
import { cn } from "@/admin/utilities/ui"
import type { ToolUIPart } from "ai"
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react"
import type { ComponentProps, ReactNode } from "react"
import { CodeBlock } from "./code-block"

export type ToolProps = ComponentProps<typeof Collapsible>

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn(
      "not-prose dark:border-admin-750 border-admin-200 mb-4 w-full overflow-hidden rounded-md border border-solid",
      className
    )}
    {...props}
  />
)

export type ToolHeaderProps = {
  type: ToolUIPart["type"]
  state: ToolUIPart["state"]
  className?: string
}

const getStatusBadge = (status: ToolUIPart["state"]) => {
  const labels = {
    "input-streaming": "Pending",
    "input-available": "Running",
    "output-available": "Completed",
    "output-error": "Error",
  } as const

  const icons = {
    "input-streaming": <CircleIcon className="size-4" />,
    "input-available": <ClockIcon className="size-4 animate-pulse" />,
    "output-available": <CheckCircleIcon className="size-4 text-green-600" />,
    "output-error": <XCircleIcon className="size-4 text-red-600" />,
  } as const

  return (
    <Badge
      className="bg-admin-150 text-admin-700 dark:bg-admin-800 dark:text-admin-300 gap-1.5 rounded-full text-xs"
      variant="secondary"
    >
      {icons[status]}
      {labels[status]}
    </Badge>
  )
}

export const ToolHeader = ({ className, type, state, ...props }: ToolHeaderProps) => (
  <CollapsibleTrigger
    className={cn(
      "dark:bg-admin-850 bg-admin-100 hover:bg-admin-200 dark:hover:bg-admin-800 flex w-full items-center justify-between gap-4 border-none p-3 transition-colors hover:cursor-pointer",
      className
    )}
    {...props}
  >
    <div className="flex items-center gap-2">
      <WrenchIcon className="text-admin-600 dark:text-admin-400 size-4" />
      <span className="text-admin-900 dark:text-admin-100 text-sm font-medium">
        {type.replace("tool-", "").replace(/_/g, " ")}
      </span>
      {getStatusBadge(state)}
    </div>
    <ChevronDownIcon className="text-admin-600 dark:text-admin-400 size-4 transition-transform group-data-[state=open]:rotate-180" />
  </CollapsibleTrigger>
)

export type ToolContentProps = ComponentProps<typeof CollapsibleContent>

export const ToolContent = ({ className, ...props }: ToolContentProps) => (
  <CollapsibleContent
    className={cn(
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 text-popover-foreground data-[state=closed]:animate-out data-[state=open]:animate-in outline-none",
      className
    )}
    {...props}
  />
)

export type ToolInputProps = ComponentProps<"div"> & {
  input: ToolUIPart["input"]
}

export const ToolInput = ({ className, input, ...props }: ToolInputProps) => (
  <div
    className={cn(
      "border-admin-200 dark:border-admin-800 space-y-2 overflow-hidden border-t p-4",
      className
    )}
    {...props}
  >
    <h4 className="text-admin-600 dark:text-admin-400 text-xs font-medium tracking-wide uppercase">
      Parameters
    </h4>
    <div className="bg-admin-100 dark:bg-admin-850 rounded-md">
      <CodeBlock code={JSON.stringify(input, null, 2)} language="json" />
    </div>
  </div>
)

export type ToolOutputProps = ComponentProps<"div"> & {
  output: ToolUIPart["output"]
  errorText: ToolUIPart["errorText"]
}

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ToolOutputProps) => {
  if (!(output || errorText)) {
    return null
  }

  let Output = <div>{output as ReactNode}</div>

  if (typeof output === "object") {
    Output = <CodeBlock code={JSON.stringify(output, null, 2)} language="json" />
  } else if (typeof output === "string") {
    Output = <CodeBlock code={output} language="json" />
  }

  return (
    <div
      className={cn(
        "border-admin-200 dark:border-admin-800 space-y-2 border-t p-4",
        className
      )}
      {...props}
    >
      <h4 className="text-admin-600 dark:text-admin-400 text-xs font-medium tracking-wide uppercase">
        {errorText ? "Error" : "Result"}
      </h4>
      <div
        className={cn(
          "overflow-x-auto rounded-md p-3 text-xs [&_table]:w-full",
          errorText
            ? "border border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950/20 dark:text-red-200"
            : "bg-admin-100 dark:bg-admin-850 text-admin-900 dark:text-admin-100"
        )}
      >
        {errorText && <div className="mb-2">{errorText}</div>}
        {Output}
      </div>
    </div>
  )
}
