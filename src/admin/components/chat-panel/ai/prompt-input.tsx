"use client"

import Image from "next/image"
import { nanoid } from "nanoid"
import {
  Children,
  Fragment,
  type ChangeEventHandler,
  type ComponentProps,
  createContext,
  forwardRef,
  type FormEvent,
  type FormEventHandler,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type ReactNode,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { cn } from "@/admin/utilities/ui"
import type { ChatStatus, FileUIPart } from "ai"
import {
  File as FileIcon,
  FileArchive,
  FileAudio,
  FileCode,
  FileImage,
  FileText,
  FileVideo,
  Loader2Icon,
  PaperclipIcon,
  SendIcon,
  SquareIcon,
  XIcon,
} from "lucide-react"

type AttachmentsContextValue = {
  files: (FileUIPart & { id: string })[]
  add: (files: File[] | FileList) => void
  remove: (id: string) => void
  clear: () => void
  openFileDialog: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
}

const AttachmentsContext = createContext<AttachmentsContextValue | null>(null)

export function usePromptInputAttachments() {
  const context = useContext(AttachmentsContext)
  if (!context) {
    throw new Error("usePromptInputAttachments must be used within a PromptInput")
  }
  return context
}

export const promptInputStyles = /* css */ `
.chat-input-form {
  margin-top: 16px;
  flex-shrink: 0;
}

.chat-input {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid var(--chat-color-border);
  border-radius: 18px 18px 12px 12px;
  box-shadow: var(--chat-shadow-sm);
  padding: 12px 16px 16px;
  backdrop-filter: blur(10px);
  font-size: 15px;
  line-height: 1.45;
}

.chat-root[data-theme="dark"] .chat-input,
[data-chat-panel-root][data-theme="dark"] .chat-input {
  background: rgba(24, 24, 26, 0.9);
  border-color: #2e2e32;
  font-size: 15px;
}

.chat-input--drag-active {
  outline: 2px solid var(--chat-color-accent);
  outline-offset: 4px;
}

.chat-input__row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.chat-input__textarea {
  flex: 1;
  min-height: 80px;
  max-height: 180px;
  resize: vertical;
  border: none;
  background: transparent;
  color: var(--chat-color-text-primary);
  outline: none;
  padding: 0 4px;
}

.chat-root[data-theme="dark"] .chat-input__textarea,
[data-chat-panel-root][data-theme="dark"] .chat-input__textarea {
  color: var(--chat-color-text-primary);
}


.chat-input__button {
  box-shadow: none;
}

.chat-input__button--wide {
  width: auto;
  min-width: 120px;
  padding: 0 16px;
  gap: 8px;
}

.chat-input__submit-icon {
  width: 18px;
  height: 18px;
}

.chat-input__submit-icon--spin {
  animation: chat-spin 0.8s linear infinite;
}

.chat-input__attachments-wrapper {
  overflow: hidden;
  transition: height 0.25s ease;
}

.chat-input__attachments {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chat-attachment {
  width: 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.chat-attachment__preview {
  position: relative;
  width: 100%;
  height: 52px;
  border-radius: var(--chat-radius-sm);
  background: var(--chat-color-layer-2);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.chat-root[data-theme="dark"] .chat-attachment__preview,
[data-chat-panel-root][data-theme="dark"] .chat-attachment__preview {
  background: rgba(255, 255, 255, 0.08);
}

.chat-attachment__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-attachment__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--chat-color-text-secondary);
}

.chat-attachment__icon-mark {
  width: 18px;
  height: 18px;
}

.chat-attachment__remove {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #ffffff;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.chat-attachment__preview:hover .chat-attachment__remove {
  opacity: 1;
}

.chat-attachment__remove-icon {
  width: 14px;
  height: 14px;
}

.chat-attachment__name {
  width: 100%;
  text-align: center;
  font-size: 11px;
  color: var(--chat-color-text-secondary);
  line-height: 1.3;
  word-break: break-word;
}

.chat-input__file {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.chat-input__drop-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.chat-input__drop-overlay-backdrop {
  position: absolute;
  inset: 0;
  background: rgba(79, 55, 251, 0.6);
  border-radius: var(--chat-radius-lg);
}

.chat-input__drop-overlay-content {
  position: relative;
  z-index: 1;
  color: #ffffff;
  font-weight: 600;
  font-size: 16px;
}
`

export type PromptInputAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: FileUIPart & { id: string }
  className?: string
}

export function PromptInputAttachment({ data, className, ...props }: PromptInputAttachmentProps) {
  const attachments = usePromptInputAttachments()
  const filename = data.filename || "attachment"
  const type = (data.mediaType || "").toLowerCase()
  const ext = filename.split(".").pop()?.toLowerCase() || ""

  const pickIcon = () => {
    if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
      return FileImage
    }
    if (type.startsWith("video/") || ["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) {
      return FileVideo
    }
    if (type.startsWith("audio/") || ["mp3", "wav", "m4a", "flac", "ogg"].includes(ext)) {
      return FileAudio
    }
    if (["zip", "rar", "7z", "gz", "tar"].includes(ext)) {
      return FileArchive
    }
    if (
      [
        "js",
        "ts",
        "tsx",
        "jsx",
        "json",
        "yml",
        "yaml",
        "xml",
        "html",
        "css",
        "scss",
        "md",
        "mdx",
        "py",
        "rb",
        "go",
        "rs",
        "java",
        "c",
        "cpp",
        "sh",
      ].includes(ext)
    ) {
      return FileCode
    }
    if (["pdf", "txt", "rtf", "doc", "docx", "pages"].includes(ext)) {
      return FileText
    }
    return FileIcon
  }

  const TypeIcon = pickIcon()

  return (
    <div className={cn("chat-attachment", className)} title={filename} {...props}>
      <div className="chat-attachment__preview">
        {data.mediaType?.startsWith("image/") && data.url ? (
          <Image alt={filename} className="chat-attachment__image" height={40} src={data.url} width={40} />
        ) : (
          <div className="chat-attachment__icon">
            <TypeIcon className="chat-attachment__icon-mark" />
          </div>
        )}
        <button
          aria-label="Remove attachment"
          className="chat-attachment__remove"
          onClick={event => {
            event.preventDefault()
            event.stopPropagation()
            attachments.remove(data.id)
          }}
          type="button"
        >
          <XIcon className="chat-attachment__remove-icon" />
        </button>
      </div>
      <div className="chat-attachment__name">{filename}</div>
    </div>
  )
}

export type PromptInputAttachmentsProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  children: (attachment: FileUIPart & { id: string }) => ReactNode
}

export function PromptInputAttachments({ className, children, ...props }: PromptInputAttachmentsProps) {
  const attachments = usePromptInputAttachments()
  const [height, setHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = contentRef.current
    if (!element) {
      return
    }
    const observer = new ResizeObserver(() => {
      setHeight(element.getBoundingClientRect().height)
    })
    observer.observe(element)
    setHeight(element.getBoundingClientRect().height)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      aria-live="polite"
      className={cn("chat-input__attachments-wrapper", className)}
      style={{ height: attachments.files.length ? height : 0 }}
      {...props}
    >
      <div className="chat-input__attachments" ref={contentRef}>
        {attachments.files.map(file => (
          <Fragment key={file.id}>{children(file)}</Fragment>
        ))}
      </div>
    </div>
  )
}

export type PromptInputMessage = {
  text?: string
  files?: FileUIPart[]
}

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  accept?: string
  multiple?: boolean
  maxFiles?: number
  maxFileSize?: number
  onError?: (err: { code: "max_files" | "max_file_size" | "accept"; message: string }) => void
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void
}

export function PromptInput({
  className,
  accept,
  multiple,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  children,
  ...props
}: PromptInputProps) {
  const [items, setItems] = useState<(FileUIPart & { id: string })[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const dragCounterRef = useRef(0)
  const [panelRoot, setPanelRoot] = useState<HTMLElement | null>(null)

  useEffect(() => {
    const root = anchorRef.current?.closest("form")
    if (root instanceof HTMLFormElement) {
      formRef.current = root
    }
    const panel = anchorRef.current?.closest("[data-chat-panel-root]") as HTMLElement | null
    if (panel) {
      setPanelRoot(panel)
    }
  }, [])

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const matchesAccept = useCallback(
    (file: File) => {
      if (!accept || accept.trim() === "") {
        return true
      }
      if (accept.includes("image/*")) {
        return file.type.startsWith("image/")
      }
      return true
    },
    [accept]
  )

  const add = useCallback(
    (files: File[] | FileList) => {
      const incoming = Array.from(files)
      const accepted = incoming.filter(matchesAccept)
      if (accepted.length === 0) {
        onError?.({ code: "accept", message: "No files match the accepted types." })
        return
      }
      const withinSize = (file: File) => (maxFileSize ? file.size <= maxFileSize : true)
      const sized = accepted.filter(withinSize)
      if (sized.length === 0 && accepted.length > 0) {
        onError?.({ code: "max_file_size", message: "All files exceed the maximum size." })
        return
      }
      setItems(previous => {
        const capacity = typeof maxFiles === "number" ? Math.max(0, maxFiles - previous.length) : undefined
        const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized
        if (typeof capacity === "number" && sized.length > capacity) {
          onError?.({ code: "max_files", message: "Too many files. Some were not added." })
        }
        const next: (FileUIPart & { id: string })[] = []
        for (const file of capped) {
          next.push({
            id: nanoid(),
            type: "file",
            url: URL.createObjectURL(file),
            mediaType: file.type,
            filename: file.name,
          })
        }
        return previous.concat(next)
      })
    },
    [matchesAccept, maxFiles, maxFileSize, onError]
  )

  const remove = useCallback((id: string) => {
    setItems(previous => {
      const target = previous.find(file => file.id === id)
      if (target?.url) {
        URL.revokeObjectURL(target.url)
      }
      return previous.filter(file => file.id !== id)
    })
  }, [])

  const clear = useCallback(() => {
    setItems(previous => {
      for (const file of previous) {
        if (file.url) {
          URL.revokeObjectURL(file.url)
        }
      }
      return []
    })
  }, [])

  useEffect(() => {
    if (items.length === 0 && inputRef.current) {
      inputRef.current.value = ""
    }
  }, [items])

  useEffect(() => {
    const root = panelRoot
    if (!root) {
      return
    }

    const onDragOver = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files")) {
        event.preventDefault()
      }
    }
    const onDragEnter = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files")) {
        dragCounterRef.current += 1
        setDragActive(true)
      }
    }
    const onDragLeave = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files")) {
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
        if (dragCounterRef.current === 0) {
          setDragActive(false)
        }
      }
    }
    const onDrop = (event: DragEvent) => {
      if (event.dataTransfer?.types?.includes("Files")) {
        event.preventDefault()
      }
      if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
        add(event.dataTransfer.files)
      }
      dragCounterRef.current = 0
      setDragActive(false)
    }

    root.addEventListener("dragover", onDragOver)
    root.addEventListener("dragenter", onDragEnter)
    root.addEventListener("dragleave", onDragLeave)
    root.addEventListener("drop", onDrop)

    return () => {
      root.removeEventListener("dragover", onDragOver)
      root.removeEventListener("dragenter", onDragEnter)
      root.removeEventListener("dragleave", onDragLeave)
      root.removeEventListener("drop", onDrop)
    }
  }, [add, panelRoot])

  const handleChange: ChangeEventHandler<HTMLInputElement> = event => {
    if (event.currentTarget.files) {
      add(event.currentTarget.files)
    }
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault()
    const files: FileUIPart[] = items.map(item => ({ ...item }))
    onSubmit({ text: event.currentTarget.message.value, files }, event)
    clear()
  }

  const context = useMemo<AttachmentsContextValue>(
    () => ({ files: items.map(item => ({ ...item })), add, remove, clear, openFileDialog, fileInputRef: inputRef }),
    [items, add, remove, clear, openFileDialog]
  )

  return (
    <AttachmentsContext.Provider value={context}>
      <span aria-hidden="true" className="chat-sr-only" ref={anchorRef} />
      <input
        accept={accept}
        className="chat-input__file"
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
      <form
        className={cn("chat-input", dragActive && "chat-input--drag-active", className)}
        onSubmit={handleSubmit}
        {...props}
      >
        {children}
      </form>
      {dragActive && (
        <div className="chat-input__drop-overlay">
          <div className="chat-input__drop-overlay-backdrop" />
          <div className="chat-input__drop-overlay-content">Drop files to upload</div>
        </div>
      )}
    </AttachmentsContext.Provider>
  )
}

export type PromptInputTextareaProps = ComponentProps<"textarea">

export const PromptInputTextarea = forwardRef<HTMLTextAreaElement, PromptInputTextareaProps>(
  ({ className, onChange, ...props }, forwardedRef) => {
    const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = event => {
      if (event.key === "Enter" && !event.shiftKey) {
        if (!event.nativeEvent.isComposing) {
          const form = event.currentTarget.form
          if (form) {
            event.preventDefault()
            form.requestSubmit()
          }
        }
      }
    }

    return (
      <textarea
        className={cn("chat-input__textarea", className)}
        name="message"
        onChange={onChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        ref={forwardedRef}
        rows={3}
        {...props}
      />
    )
  }
)

PromptInputTextarea.displayName = "PromptInputTextarea"

export type PromptInputButtonProps = ComponentProps<"button">

export function PromptInputButton({ className, children, type = "button", ...props }: PromptInputButtonProps) {
  const size = (children && Children.count(children) > 1) || props.title ? "chat-input__button--wide" : ""
  return (
    <button className={cn("chat-button-icon", "chat-input__button", size, className)} type={type} {...props}>
      {children}
    </button>
  )
}

export type PromptInputSubmitProps = ComponentProps<"button"> & {
  status?: ChatStatus
}

export function PromptInputSubmit({ className, status, type = "submit", children, ...props }: PromptInputSubmitProps) {
  let icon: ReactNode = <SendIcon className="chat-input__submit-icon" />
  if (status === "submitted") {
    icon = <Loader2Icon className="chat-input__submit-icon chat-input__submit-icon--spin" />
  } else if (status === "streaming") {
    icon = <SquareIcon className="chat-input__submit-icon" />
  } else if (status === "error") {
    icon = <XIcon className="chat-input__submit-icon" />
  }
  const providedLabel = (props as { [key: string]: unknown })["aria-label"] as string | undefined
  const fallbackLabel = status === "streaming"
    ? "Stop response"
    : status === "submitted"
      ? "Sending message"
      : status === "error"
        ? "Send message again"
        : "Send message"
  const resolvedLabel = providedLabel ?? fallbackLabel
  return (
    <button
      {...props}
      aria-label={resolvedLabel}
      className={cn("chat-button-icon", "chat-button-icon--accent", "chat-input__submit", className)}
      type={type}
    >
      {children ?? icon}
      {!children && !providedLabel && <span className="chat-sr-only">{resolvedLabel}</span>}
    </button>
  )
}
