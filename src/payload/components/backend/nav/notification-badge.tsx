"use client"

import { FC } from "react"

type Props = {
  count: number
  className?: string
}

/*******************************************************/
/* Notification Badge Component
/*******************************************************/

export const NotificationBadge: FC<Props> = ({ count, className = "" }) => {
  if (count === 0) {
    return null
  }

  return (
    <div
      className={`notification-badge inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white ${className}`}
      title={`${count} unread form submission${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </div>
  )
}
