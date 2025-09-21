"use client"

import { useSyncExternalStore } from "react"

/*************************************************************************/
/*  CHAT STORE - SHARED ACROSS FRONTEND + ADMIN ROOTS
/*************************************************************************/

type ChatStoreState = {
  isEnabled: boolean
  statusReason: string | null
  isOpen: boolean
}

type ChatStoreListener = () => void

type ChatStoreEvent =
  | { type: "open"; isOpen: boolean }
  | { type: "availability"; isEnabled: boolean; statusReason: string | null }

type ChatStoreSelector<T> = (state: ChatStoreState) => T

type ChatStoreSnapshot = ChatStoreState

const OPEN_KEY = "smart-site-chat-open"
const CHANNEL_NAME = "smart-site-chat"

let state: ChatStoreState = {
  isEnabled: false,
  statusReason: null,
  isOpen: false,
}

const listeners = new Set<ChatStoreListener>()
let broadcast: BroadcastChannel | null = null
let initialized = false

function debugLog(...args: unknown[]) {
  if (process.env.NODE_ENV !== "production") {
    console.debug("[chat-store]", ...args)
  }
}

function emit(event?: ChatStoreEvent) {
  if (event && broadcast) {
    try {
      broadcast.postMessage(event)
    } catch (error) {
      debugLog("Broadcast postMessage failed", { event, error })
    }
  }
  for (const listener of listeners) {
    listener()
  }
}

function persistOpen(value: boolean) {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(OPEN_KEY, JSON.stringify(value))
  } catch (error) {
    debugLog("Persist chat open failed", { error })
  }
}

function loadPersistedState() {
  if (typeof window === "undefined") return
  try {
    const stored = window.localStorage.getItem(OPEN_KEY)
    if (stored !== null) {
      const parsed = JSON.parse(stored)
      if (typeof parsed === "boolean") {
        state = { ...state, isOpen: parsed }
      }
    }
  } catch (error) {
    debugLog("Load persisted state failed", { error })
  }
}

function subscribe(listener: ChatStoreListener) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function handleBroadcast(event: MessageEvent<ChatStoreEvent>) {
  const data = event.data
  if (!data) return
  switch (data.type) {
    case "open": {
      state = { ...state, isOpen: data.isOpen }
      emit()
      break
    }
    case "availability": {
      state = {
        ...state,
        isEnabled: data.isEnabled,
        statusReason: data.statusReason,
      }
      emit()
      break
    }
    default:
      break
  }
}

function handleStorage(event: StorageEvent) {
  if (typeof window === "undefined") return
  if (event.storageArea !== window.localStorage) return
  if (event.key !== OPEN_KEY) return
  if (event.newValue === null) return
  try {
    const parsed = JSON.parse(event.newValue)
    if (typeof parsed === "boolean") {
      state = { ...state, isOpen: parsed }
      emit()
    }
  } catch (error) {
    debugLog("Storage event parse failed", { error })
  }
}

export function initializeChatStore() {
  if (initialized) return
  if (typeof window === "undefined") return
  initialized = true

  loadPersistedState()

  if ("BroadcastChannel" in window) {
    try {
      broadcast = new BroadcastChannel(CHANNEL_NAME)
      broadcast.addEventListener("message", handleBroadcast)
    } catch (error) {
      debugLog("BroadcastChannel setup failed", { error })
      broadcast = null
    }
  }

  window.addEventListener("storage", handleStorage)
}

/*************************************************************************/
/*  PUBLIC API
/*************************************************************************/

export function useChatStore<T>(selector: ChatStoreSelector<T>): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state))
}

export function getChatSnapshot(): ChatStoreSnapshot {
  return state
}

export function setChatAvailability(isEnabled: boolean, statusReason: string | null) {
  const next = {
    ...state,
    isEnabled,
    statusReason,
  }
  state = next
  emit({ type: "availability", isEnabled, statusReason })
}

export function setChatOpen(isOpen: boolean) {
  state = { ...state, isOpen }
  persistOpen(isOpen)
  emit({ type: "open", isOpen })
}

export function toggleChatOpen() {
  setChatOpen(!state.isOpen)
}

export function openChatPanel() {
  setChatOpen(true)
}

export function closeChatPanel() {
  setChatOpen(false)
}

export function resetChatStore() {
  state = {
    isEnabled: false,
    statusReason: null,
    isOpen: false,
  }
  emit()
}
