import { ChevronIcon } from "@payloadcms/ui"
import { DefaultAccountIcon } from "@payloadcms/ui/graphics/Account/Default"
import { ServerProps } from "payload"
import { FC } from "react"

import "./index.scss"
import Image from "next/image"
import { Media } from "@/payload/payload-types"

const baseClass = "avatar"

export const Avatar: FC<ServerProps> = props => {
  const { user } = props

  const username = user?.email.split("@").shift()
  const avatar = user?.avatar as Media

  return (
    <div className="avatar flex items-center gap-2">
      {avatar && avatar.url ? (
        <Image
          src={avatar.url}
          alt={user?.username || "User avatar"}
          width={32}
          height={32}
          className="rounded-full"
        />
      ) : (
        <DefaultAccountIcon active={false} />
      )}
      <span className={`${baseClass}__greeting no-underline`}>Hi,</span>
      <span className={`${baseClass}__username capitalize no-underline`}>{username}</span>
      <ChevronIcon direction="right" size="small" className={`${baseClass}__chevron`} />
    </div>
  )
}
