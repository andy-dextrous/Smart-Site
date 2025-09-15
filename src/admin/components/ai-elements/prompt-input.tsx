"use client"

import { Button } from "@/admin/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/admin/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select"
import { Textarea } from "@/admin/components/ui/textarea"
import { cn } from "@/admin/utilities/ui"
import type { ChatStatus, FileUIPart } from "ai"
import {
  ImageIcon,
  Loader2Icon,
  PaperclipIcon,
  PlusIcon,
  SendIcon,
  SquareIcon,
  XIcon,
  File as FileIcon,
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  FileCode,
} from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/admin/components/ui/tooltip"
import { nanoid } from "nanoid"
import Image from "next/image"
import {
  type ChangeEventHandler,
  Children,
  type ComponentProps,
  createContext,
  type FormEvent,
  type FormEventHandler,
  Fragment,
  type HTMLAttributes,
  type KeyboardEventHandler,
  type RefObject,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"

type AttachmentsContext = {
  files: (FileUIPart & { id: string })[]
  add: (files: File[] | FileList) => void
  remove: (id: string) => void
  clear: () => void
  openFileDialog: () => void
  fileInputRef: RefObject<HTMLInputElement | null>
}

const AttachmentsContext = createContext<AttachmentsContext | null>(null)

export const usePromptInputAttachments = () => {
  const context = useContext(AttachmentsContext)

  if (!context) {
    throw new Error("usePromptInputAttachments must be used within a PromptInput")
  }

  return context
}

export type PromptInputAttachmentProps = HTMLAttributes<HTMLDivElement> & {
  data: FileUIPart & { id: string }
  className?: string
}

export function PromptInputAttachment({
  data,
  className,
  ...props
}: PromptInputAttachmentProps) {
  const attachments = usePromptInputAttachments()

  const filename = data.filename || "attachment"
  const type = (data.mediaType || "").toLowerCase()
  const ext = filename.split(".").pop()?.toLowerCase() || ""

  const getIcon = () => {
    if (type.startsWith("image/") || ["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) {
      return FileImage
    }
    if (type.startsWith("video/") || ["mp4", "mov", "webm", "avi", "mkv"].includes(ext)) {
      return FileVideo
    }
    if (type.startsWith("audio/") || ["mp3", "wav", "m4a", "flac", "ogg"].includes(ext)) {
      return FileAudio
    }
    if (ext === "zip" || ext === "rar" || ext === "7z" || ext === "gz" || ext === "tar") {
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
    // PDFs and docs fall back to text file icon
    if (["pdf", "txt", "rtf", "doc", "docx", "pages"].includes(ext)) {
      return FileText
    }
    return FileIcon
  }

  const TypeIcon = getIcon()

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className={cn("group w-12", className)} key={data.id} {...props}>
          <div className="relative h-10 w-10 rounded-md bg-admin-100 dark:bg-admin-800">
            {data.mediaType?.startsWith("image/") && data.url ? (
              <Image
                alt={filename}
                className="size-full rounded-md object-cover"
                height={40}
                src={data.url}
                width={40}
              />
            ) : (
              <div className="text-muted-foreground flex size-full items-center justify-center">
                <TypeIcon className="size-5" />
              </div>
            )}
            <Button
              aria-label="Remove attachment"
              className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full opacity-0 group-hover:opacity-100"
              onClick={e => {
                e.preventDefault()
                e.stopPropagation()
                attachments.remove(data.id)
              }}
              size="icon-sm"
              type="button"
              variant="outline"
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="mt-1 w-10 truncate text-center text-[10px] leading-tight text-admin-600 dark:text-admin-400">
            {filename}
          </div>
        </div>
      </TooltipTrigger>
      <TooltipContent className="text-sm">{filename}</TooltipContent>
    </Tooltip>
  )
}

export type PromptInputAttachmentsProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  children: (attachment: FileUIPart & { id: string }) => React.ReactNode
}

export function PromptInputAttachments({
  className,
  children,
  ...props
}: PromptInputAttachmentsProps) {
  const attachments = usePromptInputAttachments()
  const [height, setHeight] = useState(0)
  const contentRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) {
      return
    }
    const ro = new ResizeObserver(() => {
      setHeight(el.getBoundingClientRect().height)
    })
    ro.observe(el)
    setHeight(el.getBoundingClientRect().height)
    return () => ro.disconnect()
  }, [])

  return (
    <div
      aria-live="polite"
      className={cn(
        "overflow-hidden transition-[height] duration-200 ease-out",
        className
      )}
      style={{ height: attachments.files.length ? height : 0 }}
      {...props}
    >
      <div className="flex flex-wrap gap-1.5 p-0" ref={contentRef}>
        {attachments.files.map(file => (
          <Fragment key={file.id}>{children(file)}</Fragment>
        ))}
      </div>
    </div>
  )
}

export type PromptInputActionAddAttachmentsProps = ComponentProps<
  typeof DropdownMenuItem
> & {
  label?: string
}

export const PromptInputActionAddAttachments = ({
  label = "Add photos or files",
  ...props
}: PromptInputActionAddAttachmentsProps) => {
  const attachments = usePromptInputAttachments()

  return (
    <DropdownMenuItem
      {...props}
      onSelect={e => {
        e.preventDefault()
        attachments.openFileDialog()
      }}
    >
      <ImageIcon className="mr-2 size-4" /> {label}
    </DropdownMenuItem>
  )
}

export type PromptInputMessage = {
  text?: string
  files?: FileUIPart[]
}

export type PromptInputProps = Omit<HTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  accept?: string // e.g., "image/*" or leave undefined for any
  multiple?: boolean
  // When true, accepts drops anywhere on document. Default false (opt-in).
  globalDrop?: boolean
  // Render a hidden input with given name and keep it in sync for native form posts. Default false.
  syncHiddenInput?: boolean
  // Minimal constraints
  maxFiles?: number
  maxFileSize?: number // bytes
  onError?: (err: {
    code: "max_files" | "max_file_size" | "accept"
    message: string
  }) => void
  onSubmit: (message: PromptInputMessage, event: FormEvent<HTMLFormElement>) => void
}

export const PromptInput = ({
  className,
  accept,
  multiple,
  globalDrop,
  syncHiddenInput,
  maxFiles,
  maxFileSize,
  onError,
  onSubmit,
  ...props
}: PromptInputProps) => {
  const [items, setItems] = useState<(FileUIPart & { id: string })[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const anchorRef = useRef<HTMLSpanElement>(null)
  const formRef = useRef<HTMLFormElement | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const dragCounterRef = useRef(0)
  const [panelRoot, setPanelRoot] = useState<HTMLElement | null>(null)

  // Find nearest form to scope drag & drop
  useEffect(() => {
    const root = anchorRef.current?.closest("form")
    if (root instanceof HTMLFormElement) {
      formRef.current = root
    }
    // Also resolve the chat panel root for overlay scoping
    const panel = anchorRef.current?.closest('[data-chat-panel-root]') as HTMLElement | null
    if (panel) setPanelRoot(panel)
  }, [])

  const openFileDialog = useCallback(() => {
    inputRef.current?.click()
  }, [])

  const matchesAccept = useCallback(
    (f: File) => {
      if (!accept || accept.trim() === "") {
        return true
      }
      // Simple check: if accept includes "image/*", filter to images; otherwise allow.
      if (accept.includes("image/*")) {
        return f.type.startsWith("image/")
      }
      return true
    },
    [accept]
  )

  const add = useCallback(
    (files: File[] | FileList) => {
      const incoming = Array.from(files)
      const accepted = incoming.filter(f => matchesAccept(f))
      if (accepted.length === 0) {
        onError?.({
          code: "accept",
          message: "No files match the accepted types.",
        })
        return
      }
      const withinSize = (f: File) => (maxFileSize ? f.size <= maxFileSize : true)
      const sized = accepted.filter(withinSize)
      if (sized.length === 0 && accepted.length > 0) {
        onError?.({
          code: "max_file_size",
          message: "All files exceed the maximum size.",
        })
        return
      }
      setItems(prev => {
        const capacity =
          typeof maxFiles === "number" ? Math.max(0, maxFiles - prev.length) : undefined
        const capped = typeof capacity === "number" ? sized.slice(0, capacity) : sized
        if (typeof capacity === "number" && sized.length > capacity) {
          onError?.({
            code: "max_files",
            message: "Too many files. Some were not added.",
          })
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
        return prev.concat(next)
      })
    },
    [matchesAccept, maxFiles, maxFileSize, onError]
  )

  const remove = useCallback((id: string) => {
    setItems(prev => {
      const found = prev.find(file => file.id === id)
      if (found?.url) {
        URL.revokeObjectURL(found.url)
      }
      return prev.filter(file => file.id !== id)
    })
  }, [])

  const clear = useCallback(() => {
    setItems(prev => {
      for (const file of prev) {
        if (file.url) {
          URL.revokeObjectURL(file.url)
        }
      }
      return []
    })
  }, [])

  // Note: File input cannot be programmatically set for security reasons
  // The syncHiddenInput prop is no longer functional
  useEffect(() => {
    if (syncHiddenInput && inputRef.current) {
      // Clear the input when items are cleared
      if (items.length === 0) {
        inputRef.current.value = ""
      }
    }
  }, [items, syncHiddenInput])

  // Attach drop handlers on nearest form and document (opt-in)
  useEffect(() => {
    const root = panelRoot
    if (!root) return
    const onDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault()
    }
    const onDragEnter = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounterRef.current += 1
        setDragActive(true)
      }
    }
    const onDragLeave = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        dragCounterRef.current = Math.max(0, dragCounterRef.current - 1)
        if (dragCounterRef.current === 0) setDragActive(false)
      }
    }
    const onDrop = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) e.preventDefault()
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) add(e.dataTransfer.files)
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

  // Remove global document listeners for overlay; we scope to the chat panel root instead

  const handleChange: ChangeEventHandler<HTMLInputElement> = event => {
    if (event.currentTarget.files) {
      add(event.currentTarget.files)
    }
  }

  const handleSubmit: FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault()

    const files: FileUIPart[] = items.map(({ ...item }) => ({
      ...item,
    }))

    onSubmit({ text: event.currentTarget.message.value, files }, event)
  }

  const ctx = useMemo<AttachmentsContext>(
    () => ({
      files: items.map(item => ({ ...item, id: item.id })),
      add,
      remove,
      clear,
      openFileDialog,
      fileInputRef: inputRef,
    }),
    [items, add, remove, clear, openFileDialog]
  )

  return (
    <AttachmentsContext.Provider value={ctx}>
      <span aria-hidden="true" className="hidden" ref={anchorRef} />
      <input
        accept={accept}
        className="hidden"
        multiple={multiple}
        onChange={handleChange}
        ref={inputRef}
        type="file"
      />
      <form
        className={cn(
          "focus-within:ring-admin-accent/20 border-admin-200 bg-admin-100/80 hover:border-admin-300 dark:border-admin-800 dark:bg-admin-900/80 dark:hover:border-admin-700",
          "flex w-full flex-wrap items-center rounded-t-xl rounded-b-none border px-3 pt-3 shadow-sm backdrop-blur-sm transition-all ease-in-out focus-within:ring-2",
          className
        )}
        onSubmit={handleSubmit}
        {...props}
      >
        {props.children}
      </form>
      {dragActive && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center pointer-events-none">
          <div className="absolute inset-0 bg-admin-accent/70" />
          <div className="relative z-10 text-white font-medium text-lg">Drop files to upload</div>
        </div>
      )}
    </AttachmentsContext.Provider>
  )
}

export type PromptInputBodyProps = HTMLAttributes<HTMLDivElement>

export const PromptInputBody = ({ className, ...props }: PromptInputBodyProps) => (
  <div className={cn(className, "flex flex-col")} {...props} />
)

export type PromptInputTextareaProps = ComponentProps<typeof Textarea>

export const PromptInputTextarea = ({
  onChange,
  className,
  placeholder = "Type your message...",
  ...props
}: PromptInputTextareaProps) => {
  const handleKeyDown: KeyboardEventHandler<HTMLTextAreaElement> = e => {
    if (e.key === "Enter") {
      // Don't submit if IME composition is in progress
      if (e.nativeEvent.isComposing) {
        return
      }

      if (e.shiftKey) {
        // Allow newline
        return
      }

      // Submit on Enter (without Shift)
      e.preventDefault()
      const form = e.currentTarget.form
      if (form) {
        form.requestSubmit()
      }
    }
  }

  return (
    <Textarea
      className={cn(
        "text-admin-900 placeholder:text-admin-500 dark:text-admin-100 dark:placeholder:text-admin-500",
        "max-h-48 flex-grow resize-none border-none bg-transparent px-4 py-5 font-sans text-lg outline-none focus:ring-0 disabled:cursor-not-allowed",
        "w-full rounded-none shadow-none ring-0",
        "focus:border-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
        className
      )}
      name="message"
      onChange={e => {
        onChange?.(e)
      }}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      {...props}
    />
  )
}

export type PromptInputToolbarProps = HTMLAttributes<HTMLDivElement>

export const PromptInputToolbar = ({ className, ...props }: PromptInputToolbarProps) => (
  <div className={cn("flex items-center justify-between p-1", className)} {...props} />
)

export type PromptInputToolsProps = HTMLAttributes<HTMLDivElement>

export const PromptInputTools = ({ className, ...props }: PromptInputToolsProps) => (
  <div
    className={cn(
      "flex items-center gap-1",
      "[&_button:first-child]:rounded-bl-xl",
      className
    )}
    {...props}
  />
)

export type PromptInputButtonProps = ComponentProps<typeof Button>

export const PromptInputButton = ({
  variant = "ghost",
  className,
  size,
  ...props
}: PromptInputButtonProps) => {
  const newSize = (size ?? Children.count(props.children) > 1) ? "default" : "icon"

  return (
    <Button
      className={cn(className)}
      size={newSize}
      type="button"
      variant={variant}
      {...props}
    />
  )
}

export type PromptInputActionMenuProps = ComponentProps<typeof DropdownMenu>
export const PromptInputActionMenu = (props: PromptInputActionMenuProps) => (
  <DropdownMenu {...props} />
)

export type PromptInputActionMenuTriggerProps = ComponentProps<typeof Button> & {}
export const PromptInputActionMenuTrigger = ({
  className,
  children,
  ...props
}: PromptInputActionMenuTriggerProps) => (
  <DropdownMenuTrigger asChild>
    <PromptInputButton className={className} {...props}>
      {children ?? <PaperclipIcon className="h-8 w-8" />}
    </PromptInputButton>
  </DropdownMenuTrigger>
)

export type PromptInputActionMenuContentProps = ComponentProps<typeof DropdownMenuContent>
export const PromptInputActionMenuContent = ({
  className,
  ...props
}: PromptInputActionMenuContentProps) => (
  <DropdownMenuContent align="start" className={cn(className)} {...props} />
)

export type PromptInputActionMenuItemProps = ComponentProps<typeof DropdownMenuItem>
export const PromptInputActionMenuItem = ({
  className,
  ...props
}: PromptInputActionMenuItemProps) => (
  <DropdownMenuItem className={cn(className)} {...props} />
)

// Note: Actions that perform side-effects (like opening a file dialog)
// are provided in opt-in modules (e.g., prompt-input-attachments).

export type PromptInputSubmitProps = ComponentProps<typeof Button> & {
  status?: ChatStatus
}

export const PromptInputSubmit = ({
  className,
  variant = "secondary",
  size = "default",
  status,
  children,
  ...props
}: PromptInputSubmitProps) => {
  let Icon = <SendIcon className="h-5 w-5" />

  if (status === "submitted") {
    Icon = <Loader2Icon className="h-5 w-5 animate-spin" />
  } else if (status === "streaming") {
    Icon = <SquareIcon className="h-5 w-5" />
  } else if (status === "error") {
    Icon = <XIcon className="h-5 w-5" />
  }

  return (
    <Button
      className={cn(
        "mb-3 h-10 px-3 transition-all duration-100 hover:scale-105",
        className
      )}
      size={size}
      type="submit"
      variant={variant}
      {...props}
    >
      {children ?? Icon}
    </Button>
  )
}

export type PromptInputModelSelectProps = ComponentProps<typeof Select>

export const PromptInputModelSelect = (props: PromptInputModelSelectProps) => (
  <Select {...props} />
)

export type PromptInputModelSelectTriggerProps = ComponentProps<typeof SelectTrigger>

export const PromptInputModelSelectTrigger = ({
  className,
  ...props
}: PromptInputModelSelectTriggerProps) => (
  <SelectTrigger
    className={cn(
      "text-muted-foreground border-none bg-transparent font-medium shadow-none transition-colors",
      'hover:bg-accent hover:text-foreground [&[aria-expanded="true"]]:bg-accent [&[aria-expanded="true"]]:text-foreground',
      className
    )}
    {...props}
  />
)

export type PromptInputModelSelectContentProps = ComponentProps<typeof SelectContent>

export const PromptInputModelSelectContent = ({
  className,
  ...props
}: PromptInputModelSelectContentProps) => (
  <SelectContent className={cn(className)} {...props} />
)

export type PromptInputModelSelectItemProps = ComponentProps<typeof SelectItem>

export const PromptInputModelSelectItem = ({
  className,
  ...props
}: PromptInputModelSelectItemProps) => <SelectItem className={cn(className)} {...props} />

export type PromptInputModelSelectValueProps = ComponentProps<typeof SelectValue>

export const PromptInputModelSelectValue = ({
  className,
  ...props
}: PromptInputModelSelectValueProps) => (
  <SelectValue className={cn(className)} {...props} />
)
