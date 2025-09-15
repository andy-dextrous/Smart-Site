/**
 * Thread model
 */
export type Thread = { id: string; title?: string; updatedAt?: string }

/**
 * List available threads
 */
export async function listThreads(): Promise<Thread[]> {
  const res = await fetch("/api/ai/threads", { cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({ threads: [] }))
  return (data?.threads || []) as Thread[]
}

/**
 * Create a new thread
 */
export async function createThread(): Promise<Thread | null> {
  const res = await fetch("/api/ai/threads", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  })
  if (!res.ok) return null
  const thread = (await res.json().catch(() => null)) as Thread | null
  return thread
}

/**
 * Fetch messages for a thread
 */
export async function listThreadMessages(threadId: string, last = 50): Promise<any[]> {
  const res = await fetch(`/api/ai/threads/${threadId}/messages?last=${last}`, {
    cache: "no-store",
  })
  if (!res.ok) return []
  const data = await res.json().catch(() => ({ messages: [] }))
  return (data?.messages || []) as any[]
}

/**
 * Delete a thread
 */
export async function deleteThread(threadId: string): Promise<boolean> {
  const res = await fetch(`/api/ai/threads/${threadId}`, { method: "DELETE" })
  return res.ok
}
