import { ChevronIcon } from "@payloadcms/ui"
import { DefaultAccountIcon } from "@payloadcms/ui/graphics/Account/Default"
import { ServerProps } from "payload"
import { FC } from "react"

import "./index.scss"
import Image from "next/image"
import { Media } from "@/payload/payload-types"

export const Avatar: FC<ServerProps> = props => {
  const { user } = props

  const avatar = user?.avatar as Media

  return (
    <div className="h-[50px] w-[50px]">
      {avatar && avatar.url ? (
        <Image
          src={avatar.url}
          alt={user?.username || "User avatar"}
          width={46}
          height={46}
          className="h-[50px] w-[50px] rounded-full border-2 border-(--color-base-750) hover:border-(--color-base-700)"
        />
      ) : (
        <DefaultAccountIcon active={false} />
      )}
    </div>
  )
}
