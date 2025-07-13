import { DefaultAccountIcon } from "@payloadcms/ui/graphics/Account/Default"
import { ServerProps } from "payload"
import { FC } from "react"

import "./index.scss"
import Image from "next/image"

export const Avatar: FC<ServerProps> = props => {
  const { user } = props

  const avatar = user?.avatar as any

  return (
    <div className="avatar">
      {avatar && avatar.url ? (
        <Image
          src={avatar.url}
          alt={user?.username || "User avatar"}
          fill
          className="avatar__image"
        />
      ) : (
        <DefaultAccountIcon active={false} />
      )}
    </div>
  )
}
