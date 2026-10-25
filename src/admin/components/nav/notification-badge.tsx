"use client"

import { FC } from "react"
import "@/admin/components/nav/styles.scss"

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

  const classes = ["notification-badge"]
  if (className) classes.push(className)

  return (
    <div
      className={classes.join(" ")}
      title={`${count} unread form submission${count === 1 ? "" : "s"}`}
    >
      {count > 99 ? "99+" : count}
    </div>
  )
}
