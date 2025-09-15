import { Avatar, AvatarFallback, AvatarImage } from "@/admin/components/ui/avatar"
import { cn } from "@/admin/utilities/ui"
import type { UIMessage } from "ai"
import { cva, type VariantProps } from "class-variance-authority"
import type { ComponentProps, HTMLAttributes } from "react"
import { SparklesIcon, User as UserIcon } from "lucide-react"

export type MessageProps = HTMLAttributes<HTMLDivElement> & {
  from: UIMessage["role"]
  userAvatarSrc?: string
  userName?: string
  alignMiddle?: boolean
}

export const Message = ({ className, from, userAvatarSrc, userName, alignMiddle, ...props }: MessageProps) => {
  if (from === "user") {
    return (
      <div className={cn("group is-user mb-4", className)}>
        <div className="flex items-start justify-end gap-3">
          <div className="max-w-full">{props.children}</div>
          <MessageAvatar src={userAvatarSrc || ""} name={userName} />
        </div>
      </div>
    )
  }

  // Assistant message with avatar
  return (
    <div className={cn("group is-assistant mb-4", className)} {...props}>
      <div className="flex items-start gap-5">
        <div className="from-admin-accent/20 to-admin-accent/5 border-admin-accent/10 mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full border bg-gradient-to-br">
          <SparklesIcon className="text-admin-accent h-5 w-5" />
        </div>
        <div className={cn("flex-1", alignMiddle && "self-center")}>{props.children}</div>
      </div>
    </div>
  )
}

const messageContentVariants = cva(
  "overflow-hidden text-lg leading-tight break-words",
  {
    variants: {
      variant: {
        contained: [
          "max-w-[400px] px-4 py-3",
          "group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground",
          "group-[.is-assistant]:bg-secondary group-[.is-assistant]:text-foreground",
        ],
        flat: [
          "group-[.is-user]:max-w-[400px] group-[.is-user]:bg-secondary group-[.is-user]:px-4 group-[.is-user]:py-3 group-[.is-user]:text-foreground",
          "group-[.is-assistant]:text-foreground",
        ],
        admin: [
          // User message styling
          "group-[.is-user]:bg-admin-accent group-[.is-user]:text-admin-0",
          "group-[.is-user]:rounded-[20px_20px_4px_20px] group-[.is-user]:px-4 group-[.is-user]:py-3",
          "group-[.is-user]:max-w-[400px]",
          // Assistant message styling
          "group-[.is-assistant]:text-admin-900 dark:group-[.is-assistant]:text-admin-100",
          "group-[.is-assistant]:leading-tight",
        ],
      },
    },
    defaultVariants: {
      variant: "admin",
    },
  }
)

export type MessageContentProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof messageContentVariants>

export const MessageContent = ({
  children,
  className,
  variant,
  ...props
}: MessageContentProps) => (
  <div className={cn(messageContentVariants({ variant, className }))} {...props}>
    {children}
  </div>
)

export type MessageAvatarProps = ComponentProps<typeof Avatar> & {
  src: string
  name?: string
}

export const MessageAvatar = ({ src, name, className, ...props }: MessageAvatarProps) => (
  <Avatar
    className={cn(
      "size-10",
      !src && "from-admin-300/30 to-admin-300/10 dark:from-admin-700/30 dark:to-admin-700/10 border-admin-300/30 dark:border-admin-700/40 border bg-gradient-to-br",
      className
    )}
    {...props}
  >
    {src ? (
      <AvatarImage alt="" className="mt-0 mb-0" src={src} />
    ) : (
      <div className="flex size-full items-center justify-center text-admin-600 dark:text-admin-300">
        <UserIcon className="h-5 w-5" />
      </div>
    )}
  </Avatar>
)
