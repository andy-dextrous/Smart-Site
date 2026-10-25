import * as React from "react"
import { tv } from "tailwind-variants"
import { cn } from "@/lib/ui"

const inputStyles = tv({
  base: [
    "flex w-full min-w-0 rounded-md border px-control-lg py-control-md text-sm transition-[color,box-shadow]",
    "bg-white text-dark placeholder:text-dark-600/70 selection:bg-primary selection:text-white",
    "border-dark-border focus-visible:border-primary focus-visible:ring-primary/50 focus-visible:ring-[2px]",
    "file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:text-dark",
    "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-60",
    "aria-invalid:border-destructive aria-invalid:ring-destructive/20",
  ],
})

function Input({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(inputStyles(), className)}
      {...props}
    />
  )
}

export { Input, inputStyles }

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  ref?: React.Ref<HTMLInputElement>
}
