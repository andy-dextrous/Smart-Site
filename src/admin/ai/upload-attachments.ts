export type UploadedAttachment = {
  id: string
  type: "MEDIA" | "DOCUMENT" | "BUNDLE"
  status: "PENDING" | "PROCESSING" | "READY" | "ERROR"
  filename: string
  mimeType: string
  byteSize: number
  createdAt: string
  readyAt?: string | null
  media?: {
    id: string
    url?: string | null
    width?: number | null
    height?: number | null
    alt?: string | null
  } | null
  document?: {
    title?: string | null
    summary?: string | null
    snippet?: string | null
    chunkCount: number
  } | null
  clientPreview?: {
    url: string
    mediaType: string
    filename: string
  }
}

export async function uploadChatAttachments(params: {
  threadId: string
  files: File[]
  uploaderId?: string
  messageId?: string
}): Promise<UploadedAttachment[]> {
  if (!params.files.length) return []

  const formData = new FormData()
  formData.set("threadId", params.threadId)
  if (params.uploaderId) {
    formData.set("uploaderId", params.uploaderId)
  }
  if (params.messageId) {
    formData.set("messageId", params.messageId)
  }

  for (const file of params.files) {
    formData.append("file", file, file.name)
  }

  const response = await fetch("/api/ai/attachments", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => "")
    throw new Error(errorText || `Attachment upload failed (${response.status})`)
  }

  const payload = await response.json().catch(() => null)
  if (!payload || !Array.isArray(payload.attachments)) {
    throw new Error("Unexpected attachment response format")
  }

  return payload.attachments.map((entry: any): UploadedAttachment => ({
    id: entry?.attachment?.id ?? entry?.id,
    type: entry?.attachment?.type ?? entry?.type ?? "DOCUMENT",
    status: entry?.attachment?.status ?? entry?.status ?? "READY",
    filename: entry?.attachment?.filename ?? entry?.filename ?? "attachment",
    mimeType: entry?.attachment?.mimeType ?? entry?.mimeType ?? "application/octet-stream",
    byteSize: entry?.attachment?.byteSize ?? entry?.byteSize ?? 0,
    createdAt: entry?.attachment?.createdAt ?? entry?.createdAt ?? new Date().toISOString(),
    readyAt: entry?.attachment?.readyAt ?? entry?.readyAt ?? null,
    media: entry?.attachment?.media ?? entry?.media ?? null,
    document: entry?.attachment?.document ?? entry?.document ?? null,
    clientPreview: entry?.clientPreview ?? null,
  }))
}
