"use client"

import { ResizableBox } from "react-resizable"
import { useState, useEffect, useCallback, ReactNode } from "react"
import { cn } from "@/admin/utilities/ui"

/*************************************************************************/
/*  CONSTANTS
/*************************************************************************/

const STORAGE_KEY = "smart-site-chat-width"
const DEFAULT_WIDTH = 620
const MIN_WIDTH = 400
const MAX_WIDTH = 1200

/*************************************************************************/
/*  CHAT RESIZE COMPONENT
/*************************************************************************/

interface ChatResizeProps {
  children: ReactNode
  className?: string
}

export function ChatResize({ children, className }: ChatResizeProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [isResizing, setIsResizing] = useState(false)

  useEffect(() => {
    const savedWidth = localStorage.getItem(STORAGE_KEY)
    if (savedWidth) {
      const parsedWidth = parseInt(savedWidth, 10)
      if (!isNaN(parsedWidth) && parsedWidth >= MIN_WIDTH && parsedWidth <= MAX_WIDTH) {
        setWidth(parsedWidth)
      }
    }
  }, [])

  const handleResize = useCallback((_e: any, { size }: any) => {
    setWidth(size.width)
    localStorage.setItem(STORAGE_KEY, size.width.toString())
  }, [])

  const handleResizeStart = useCallback(() => {
    setIsResizing(true)
  }, [])

  const handleResizeStop = useCallback(() => {
    setIsResizing(false)
  }, [])

  return (
    <ResizableBox
      width={width}
      height={Infinity}
      minConstraints={[MIN_WIDTH, Infinity]}
      maxConstraints={[MAX_WIDTH, Infinity]}
      onResize={handleResize}
      onResizeStart={handleResizeStart}
      onResizeStop={handleResizeStop}
      axis="x"
      resizeHandles={["w"]}
      handle={
        <div className="hover:bg-admin-accent/10 group absolute top-0 bottom-0 left-0 -ml-1 flex w-3 cursor-ew-resize items-center justify-center transition-colors">
          <div className="bg-admin-300 dark:bg-admin-700 group-hover:bg-admin-accent h-16 w-1.5 rounded-full opacity-50 transition-all group-hover:opacity-100" />
        </div>
      }
      className={cn(
        "bg-admin-50 border-admin-200 dark:bg-admin-950 dark:border-admin-800 relative flex h-screen flex-col overflow-hidden border-l shadow-xl",
        isResizing && "select-none",
        className
      )}
      >
      <div data-chat-panel-root className="relative flex h-full flex-col">
        {children}
      </div>
    </ResizableBox>
  )
}
