"use client"

import { useState } from "react"
import {
  PromptInput,
  PromptInputAttachment,
  PromptInputAttachments,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  type PromptInputMessage,
} from "@/admin/components/ai-elements/prompt-input"
import { usePromptInputAttachments } from "@/admin/components/ai-elements/prompt-input"
import { PaperclipIcon } from "lucide-react"

/**
 * Component props
 */
interface ChatInputProps {
  status: any
  onSubmit: (message: PromptInputMessage) => void
}

/**
 * Prompt input with attachments and submit
 */
export function ChatInput({ status, onSubmit }: ChatInputProps) {
  const [input, setInput] = useState("")
  function UploadButton() {
    // Must be used within PromptInput provider context
    const { openFileDialog } = usePromptInputAttachments()
    return (
      <PromptInputButton onClick={() => openFileDialog()}>
        <PaperclipIcon />
      </PromptInputButton>
    )
  }

  /**
   * Normalize and forward submit
   */
  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text)
    const hasAttachments = Boolean(message.files?.length)
    if (!(hasText || hasAttachments)) return
    onSubmit({ text: message.text || "Sent with attachments", files: message.files })
    setInput("")
  }

  return (
    <PromptInput onSubmit={handleSubmit} className="mt-4 flex-shrink-0" multiple>
      <PromptInputAttachments>{attachment => <PromptInputAttachment data={attachment} />}</PromptInputAttachments>
      <div className="flex w-full items-center">
        <UploadButton />
        <PromptInputTextarea className="flex-1" onChange={e => setInput(e.target.value)} value={input} />
        <PromptInputSubmit disabled={!input && !status} status={status} />
      </div>
    </PromptInput>
  )
}
