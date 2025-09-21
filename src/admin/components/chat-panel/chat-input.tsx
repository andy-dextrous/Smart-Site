"use client"

import { useEffect, useId, useRef, useState } from "react"
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
  usePromptInputAttachments,
} from "@/admin/components/chat-panel/ai/prompt-input"
import type { ThreadStatus } from "@/admin/components/chat-panel/chat-threads-provider"

interface ChatInputProps {
  status: ThreadStatus
  onSubmit: (message: PromptInputMessage) => void
  focusSignal: number
  isActive: boolean
}

export function ChatInput({ status, onSubmit, focusSignal, isActive }: ChatInputProps) {
  const [input, setInput] = useState("")
  const textareaId = useId()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const submitLabel = (() => {
    if (status === "streaming") return "Stop response"
    if (status === "submitted") return "Sending message"
    if (status === "error") return "Send message again"
    return "Send message"
  })()

  useEffect(() => {
    if (!focusSignal) return
    if (!isActive) return
    if (!textareaRef.current) return
    textareaRef.current.focus({ preventScroll: true })
  }, [focusSignal, isActive])

  function UploadButton() {
    const { openFileDialog } = usePromptInputAttachments()
    return (
      <PromptInputButton aria-label="Add attachment" onClick={() => openFileDialog()} type="button">
        <svg className="chat-icon" viewBox="0 0 24 24" aria-hidden>
          <path
            d="M21.44 11.05 12.76 3.2a4.19 4.19 0 0 0-5.91.29 4.19 4.19 0 0 0 .29 5.91l8.69 7.86a2.68 2.68 0 0 0 3.78-.18 2.68 2.68 0 0 0-.18-3.78L10 6.5a1.92 1.92 0 0 0-2.71.13 1.92 1.92 0 0 0 .13 2.71l6.23 5.63"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          />
        </svg>
      </PromptInputButton>
    )
  }

  function SubmitButton() {
    const { files } = usePromptInputAttachments()
    const hasAttachments = files.length > 0
    const hasInput = input.trim().length > 0
    const isStreaming = status === "streaming"
    const isSubmitting = status === "submitted" || status === "loading"
    const shouldDisable = isSubmitting || (!isStreaming && !hasInput && !hasAttachments)

    const submitStatus = isStreaming
      ? "streaming"
      : status === "submitted"
        ? "submitted"
        : status === "error"
          ? "error"
          : undefined

    return (
      <PromptInputSubmit
        aria-label={submitLabel}
        disabled={shouldDisable}
        status={submitStatus}
      />
    )
  }

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)
    if (!(hasText || hasAttachments)) {
      return
    }
    onSubmit({ text: message.text || "Sent with attachments", files: message.files })
    setInput("")
  }

  return (
    <PromptInput className="chat-input-form" multiple onSubmit={handleSubmit}>
      <PromptInputAttachments>
        {attachment => <PromptInputAttachment data={attachment} />}
      </PromptInputAttachments>
      <div className="chat-input__row">
        <UploadButton />
        <label className="chat-sr-only" htmlFor={textareaId}>
          Message
        </label>
        <PromptInputTextarea
          id={textareaId}
          onChange={event => setInput(event.target.value)}
          ref={textareaRef}
          value={input}
        />
        <SubmitButton />
      </div>
    </PromptInput>
  )
}
