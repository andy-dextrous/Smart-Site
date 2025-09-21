"use client"

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react"
import { Resizable } from "re-resizable"

const STORAGE_KEY = "smart-site-chat-width"
const HEIGHT_STORAGE_KEY = "smart-site-chat-height"
const DEFAULT_WIDTH = 620
const MIN_WIDTH = 400
const MAX_WIDTH = 1200
const DEFAULT_HEIGHT = 720
const MIN_HEIGHT = 420
const MAX_HEIGHT = 1200
const KEYBOARD_RESIZE_STEP = 24

type ResizeDirection = "left" | "top" | "topLeft"

function readNumberFromStorage(key: string) {
  if (typeof window === "undefined") {
    return null
  }
  try {
    const stored = window.localStorage.getItem(key)
    if (stored == null) {
      return null
    }
    const parsed = parseInt(stored, 10)
    return Number.isNaN(parsed) ? null : parsed
  } catch {
    return null
  }
}

function writeNumberToStorage(key: string, value: number) {
  if (typeof window === "undefined") {
    return
  }
  try {
    window.localStorage.setItem(key, value.toString())
  } catch {
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getMaxHeight() {
  if (typeof window === "undefined") {
    return MAX_HEIGHT
  }
  return Math.max(MIN_HEIGHT, window.innerHeight)
}

export const chatResizeStyles = /* css */ `
.chat-resize {
  position: relative;
  display: flex;
  padding: 0 96px 24px 24px;
  pointer-events: auto;
  margin-left: auto;
  max-width: 100%;
  justify-content: flex-end;
  background: transparent;
  min-width: 0;
  min-height: var(--chat-panel-min-height);
  max-height: 100vh;
  box-sizing: border-box;
}

.chat-resize__resizable {
  display: flex;
  justify-content: flex-end;
  width: 100%;
  height: 100%;
}

.chat-resize--active {
  user-select: none;
}

.chat-resize__handle-wrapper {
  position: absolute;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  opacity: 0;
  transition: opacity 0.15s ease;
}

.chat-resize:hover .chat-resize__handle-wrapper,
.chat-resize--active .chat-resize__handle-wrapper,
.chat-resize__handle-wrapper:focus-within {
  opacity: 1;
}

.chat-resize__handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 0;
  margin: 0;
  cursor: grab;
  border-radius: 999px;
  outline: none;
}

.chat-resize__handle:focus-visible {
  box-shadow: 0 0 0 2px rgba(79, 55, 251, 0.35);
}

.chat-resize__handle-line {
  display: none;
}

.chat-resize__handle-wrapper--left {
  left: 0;
  top: 0;
  bottom: 0;
  width: 54px;
  transform: translateX(-50%);
}

.chat-resize__handle-wrapper--left .chat-resize__handle {
  width: 100%;
  height: 100%;
}

.chat-resize__handle-wrapper--left .chat-resize__handle-line {
  width: 8px;
  height: 100%;
}

.chat-resize__handle-wrapper--top {
  top: 0;
  left: 0;
  right: 0;
  height: 48px;
  transform: translateY(-50%);
  align-items: center;
}

.chat-resize__handle-wrapper--top .chat-resize__handle {
  width: 100%;
  height: 100%;
}

.chat-resize__handle-wrapper--top .chat-resize__handle-line {
  width: 100%;
  height: 8px;
}

.chat-resize__handle-wrapper--top-left {
  top: 0;
  left: 0;
  width: 44px;
  height: 44px;
  transform: translate(-50%, -50%);
}

.chat-resize__handle-wrapper--top-left .chat-resize__handle {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: nwse-resize;
}

.chat-resize__handle-wrapper--top-left .chat-resize__handle-line {
  width: 16px;
  height: 4px;
  transform: rotate(45deg);
}

.chat-resize__inner {
  display: flex;
  width: 100%;
  height: 100%;
  pointer-events: auto;
  justify-content: flex-end;
  background: transparent;
}
`

interface ChatResizeProps {
  children: ReactNode
  className?: string
  panelRef?: MutableRefObject<HTMLDivElement | null>
}

export function ChatResize({ children, className, panelRef }: ChatResizeProps) {
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const [height, setHeight] = useState(DEFAULT_HEIGHT)
  const [isResizing, setIsResizing] = useState(false)
  const resizeOriginRef = useRef({ width: DEFAULT_WIDTH, height: DEFAULT_HEIGHT })

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const savedWidth = readNumberFromStorage(STORAGE_KEY)
    if (typeof savedWidth === "number") {
      setWidth(clamp(savedWidth, MIN_WIDTH, MAX_WIDTH))
    }

    const savedHeight = readNumberFromStorage(HEIGHT_STORAGE_KEY)
    if (typeof savedHeight === "number") {
      setHeight(clamp(savedHeight, MIN_HEIGHT, getMaxHeight()))
      return
    }

    const viewportHeight = window.innerHeight || DEFAULT_HEIGHT
    const fallbackHeight = clamp(viewportHeight - 64, MIN_HEIGHT, getMaxHeight())
    setHeight(fallbackHeight)
  }, [])

  const updateSize = useCallback((deltaWidth: number, deltaHeight: number) => {
    const origin = resizeOriginRef.current
    const maxHeight = getMaxHeight()
    const nextWidth = clamp(origin.width + deltaWidth, MIN_WIDTH, MAX_WIDTH)
    const nextHeight = clamp(origin.height + deltaHeight, MIN_HEIGHT, maxHeight)
    setWidth(nextWidth)
    setHeight(nextHeight)
    return { nextWidth, nextHeight }
  }, [])

  const handleResizeStart = useCallback(() => {
    resizeOriginRef.current = { width, height }
    setIsResizing(true)
  }, [height, width])

  const handleResize = useCallback(
    (_event: any, _direction: any, _element: HTMLElement, delta: { width: number; height: number }) => {
      updateSize(delta.width, delta.height)
    },
    [updateSize]
  )

  const handleResizeStop = useCallback(
    (_event: any, _direction: any, _element: HTMLElement, delta: { width: number; height: number }) => {
      const { nextWidth, nextHeight } = updateSize(delta.width, delta.height)
      setIsResizing(false)
      writeNumberToStorage(STORAGE_KEY, nextWidth)
      writeNumberToStorage(HEIGHT_STORAGE_KEY, nextHeight)
    },
    [updateSize]
  )

  const setPanelNode = useCallback(
    (node: HTMLDivElement | null) => {
      if (panelRef) {
        panelRef.current = node
      }
    },
    [panelRef]
  )

  const applyKeyboardResize = useCallback(
    (direction: ResizeDirection, event: ReactKeyboardEvent<HTMLButtonElement>) => {
      const step = event.shiftKey ? KEYBOARD_RESIZE_STEP * 2 : KEYBOARD_RESIZE_STEP
      let widthDelta = 0
      let heightDelta = 0

      if (direction === "left" || direction === "topLeft") {
        if (event.key === "ArrowLeft") {
          widthDelta = step
        } else if (event.key === "ArrowRight") {
          widthDelta = -step
        }
      }

      if (direction === "top" || direction === "topLeft") {
        if (event.key === "ArrowUp") {
          heightDelta = step
        } else if (event.key === "ArrowDown") {
          heightDelta = -step
        }
      }

      if (widthDelta === 0 && heightDelta === 0) {
        return
      }

      event.preventDefault()
      resizeOriginRef.current = { width, height }
      const { nextWidth, nextHeight } = updateSize(widthDelta, heightDelta)
      writeNumberToStorage(STORAGE_KEY, nextWidth)
      writeNumberToStorage(HEIGHT_STORAGE_KEY, nextHeight)
    },
    [height, updateSize, width]
  )

  const handleComponent = useMemo(() => ({
    left: (
      <ResizeHandleButton direction="left" onKeyDown={event => applyKeyboardResize("left", event)} />
    ),
    top: (
      <ResizeHandleButton direction="top" onKeyDown={event => applyKeyboardResize("top", event)} />
    ),
    topLeft: (
      <ResizeHandleButton direction="topLeft" onKeyDown={event => applyKeyboardResize("topLeft", event)} />
    ),
  }), [applyKeyboardResize])

  const handleClasses = useMemo(() => ({
    left: "chat-resize__handle-wrapper chat-resize__handle-wrapper--left",
    top: "chat-resize__handle-wrapper chat-resize__handle-wrapper--top",
    topLeft: "chat-resize__handle-wrapper chat-resize__handle-wrapper--top-left",
  }), [])

  const size = useMemo(() => ({ width, height }), [height, width])
  const maxHeightConstraint = typeof window !== "undefined" ? getMaxHeight() : MAX_HEIGHT

  const containerClassName = ["chat-resize", isResizing ? "chat-resize--active" : "", className || ""].filter(Boolean).join(" ")

  return (
    <div className={containerClassName}>
      <Resizable
        size={size}
        minWidth={MIN_WIDTH}
        maxWidth={MAX_WIDTH}
        minHeight={MIN_HEIGHT}
        maxHeight={maxHeightConstraint}
        enable={{ left: true, top: true, topLeft: true }}
        onResizeStart={handleResizeStart}
        onResize={handleResize}
        onResizeStop={handleResizeStop}
        className="chat-resize__resizable"
        handleClasses={handleClasses}
        handleComponent={handleComponent}
      >
        <div className="chat-resize__inner">
          <div className="chat-panel__inner" data-chat-panel-root ref={setPanelNode}>
            {children}
          </div>
        </div>
      </Resizable>
    </div>
  )
}

interface ResizeHandleButtonProps {
  direction: ResizeDirection
  onKeyDown: (event: ReactKeyboardEvent<HTMLButtonElement>) => void
}

function ResizeHandleButton({ direction, onKeyDown }: ResizeHandleButtonProps) {
  const labels: Record<ResizeDirection, string> = {
    left: "Resize chat width",
    top: "Resize chat height",
    topLeft: "Resize chat width and height",
  }

  return (
    <button
      aria-label={labels[direction]}
      className="chat-resize__handle"
      type="button"
      onKeyDown={onKeyDown}
    >
      <span aria-hidden className="chat-resize__handle-line" />
    </button>
  )
}
