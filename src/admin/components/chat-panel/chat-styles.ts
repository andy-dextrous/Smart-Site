"use client"

import { chatOverlayStyles, chatPanelShellStyles } from "./chat-panel-core"
import { chatResizeStyles } from "./chat-resize"
import { chatHeaderStyles } from "./chat-header-tabs"
import { conversationStyles } from "./ai/conversation"
import { messageStyles } from "./ai/message"
import { messageActionsStyles } from "./ai/actions"
import { responseStyles } from "./ai/response"
import { promptInputStyles } from "./ai/prompt-input"
import { sourcesStyles } from "./ai/sources"
import { toolStyles } from "./ai/tool"
import { codeBlockStyles } from "./ai/code-block"
import { contextStyles } from "./ai/context"
import { chainOfThoughtStyles } from "./ai/chain-of-thought"
import { inlineCitationStyles } from "./ai/inline-citation"
import { taskStyles } from "./ai/task"
import { reasoningStyles } from "./ai/reasoning"
import { generatedImageStyles } from "./ai/image"
import { loaderStyles } from "./ai/loader"

const BASE_FONT_STACK = '-apple-system, "system-ui", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'

const base = `
:host, .chat-root, [data-chat-panel-root] {
  font-family: ${BASE_FONT_STACK};
  font-size: 13px;
  line-height: 1.538;
  color: var(--chat-color-text-primary);
  letter-spacing: 0;
  -webkit-font-smoothing: antialiased;
}

:host *, :host *::before, :host *::after,
.chat-root *, .chat-root *::before, .chat-root *::after,
[data-chat-panel-root] *, [data-chat-panel-root] *::before, [data-chat-panel-root] *::after {
  box-sizing: border-box;
}

:host b, :host strong,
.chat-root b, .chat-root strong,
[data-chat-panel-root] b, [data-chat-panel-root] strong {
  font-weight: 600;
}

:host button,
.chat-root button,
[data-chat-panel-root] button,
:host input,
.chat-root input,
[data-chat-panel-root] input,
:host textarea,
.chat-root textarea,
[data-chat-panel-root] textarea {
  font: inherit;
  color: inherit;
}

:host button,
.chat-root button,
[data-chat-panel-root] button {
  cursor: pointer;
}

:host button:not([class*="chat-"]),
.chat-root button:not([class*="chat-"]),
[data-chat-panel-root] button:not([class*="chat-"]) {
  border: none;
  background: none;
}

:host a,
.chat-root a,
[data-chat-panel-root] a {
  color: inherit;
}
`

const tokens = `
:host,
.chat-root,
[data-chat-panel-root] {
  --chat-radius-sm: 8px;
  --chat-radius-md: 12px;
  --chat-radius-lg: 20px;
  --chat-panel-offset: 0px;
  --chat-panel-min-height: 420px;
  --chat-shadow-sm: 0 2px 6px rgba(15, 15, 17, 0.12);
  --chat-shadow-md: 0 12px 32px rgba(15, 15, 17, 0.18);
  --chat-shadow-lg: 0 25px 50px -12px rgba(15, 15, 17, 0.35);
  --chat-color-overlay: rgba(17, 17, 17, 0.45);
  --chat-color-layer-0: #ffffff;
  --chat-color-layer-1: #f8f8f9;
  --chat-color-layer-2: #ebebed;
  --chat-color-accent: #4f37fb;
  --chat-color-accent-soft: #8373fc;
  --chat-color-text-primary: #18181a;
  --chat-color-text-secondary: #686871;
  --chat-color-text-muted: #81818b;
  --chat-color-text-inverse: #ffffff;
  --chat-color-border: #d1d1d4;
  --chat-color-border-strong: #b6b6bc;
  --chat-color-success: #16a34a;
  --chat-color-danger: #dc2626;
  --chat-color-warning: #d97706;
  --chat-bubble-user-bg: var(--chat-color-accent);
  --chat-bubble-user-text: #ffffff;
  --chat-bubble-assistant-bg: #f8f8f9;
  --chat-bubble-assistant-text: #18181a;
}

.chat-root[data-theme="dark"],
[data-chat-panel-root][data-theme="dark"] {
  --chat-color-overlay: rgba(0, 0, 0, 0.6);
  --chat-color-layer-0: #18181a;
  --chat-color-layer-1: #202023;
  --chat-color-layer-2: #37373c;
  --chat-color-accent: #4f37fb;
  --chat-color-accent-soft: #8373fc;
  --chat-color-text-primary: #f8f8f9;
  --chat-color-text-secondary: #c3c3c8;
  --chat-color-text-muted: #9c9ca3;
  --chat-color-text-inverse: #ffffff;
  --chat-color-border: #37373c;
  --chat-color-border-strong: #434349;
  --chat-bubble-user-bg: var(--chat-color-accent);
  --chat-bubble-user-text: #ffffff;
  --chat-bubble-assistant-bg: #202023;
  --chat-bubble-assistant-text: #f8f8f9;
  --chat-shadow-sm: 0 2px 6px rgba(0, 0, 0, 0.45);
  --chat-shadow-md: 0 18px 36px rgba(0, 0, 0, 0.55);
  --chat-shadow-lg: 0 30px 65px -20px rgba(0, 0, 0, 0.7);
}
`

const host = `
.chat-host {
  position: fixed;
  inset: 0;
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  pointer-events: none;
  z-index: var(--chat-host-z-index, 2147483647);
}

.chat-host--open {
  pointer-events: auto;
}
`

const utilities = `
.chat-icon {
  width: 18px;
  height: 18px;
}

.chat-button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border-radius: var(--chat-radius-sm);
  border: none;
  background: var(--chat-bubble-assistant-bg);
  color: var(--chat-color-text-primary);
  font-size: 13px;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.18s ease, color 0.18s ease, box-shadow 0.18s ease, opacity 0.18s ease;
}

.chat-button-icon svg {
  width: 18px;
  height: 18px;
}

.chat-button-icon:hover {
  background: var(--chat-color-layer-2);
  color: var(--chat-color-text-primary);
}

.chat-button-icon:focus-visible {
  outline: none;
  box-shadow: 0 0 0 2px rgba(79, 55, 251, 0.25);
}

.chat-button-icon:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  box-shadow: none;
}

.chat-root[data-theme="dark"] .chat-button-icon,
[data-chat-panel-root][data-theme="dark"] .chat-button-icon {
  color: var(--chat-color-text-primary);
}

.chat-button-icon.chat-button-icon--accent {
  background: var(--chat-color-accent);
  border-color: var(--chat-color-accent);
  color: var(--chat-color-text-inverse);
  box-shadow: 0 12px 26px rgba(79, 55, 251, 0.32);
}

.chat-button-icon.chat-button-icon--accent:hover {
  background: var(--chat-color-accent-soft);
  border-color: var(--chat-color-accent-soft);
  box-shadow: 0 16px 32px rgba(79, 55, 251, 0.4);
}

.chat-button-icon.chat-button-icon--accent:disabled {
  opacity: 0.6;
  box-shadow: none;
  cursor: not-allowed;
}

.chat-root[data-theme="dark"] .chat-button-icon.chat-button-icon--accent,
[data-chat-panel-root][data-theme="dark"] .chat-button-icon.chat-button-icon--accent {
  background: var(--chat-color-accent);
  border-color: var(--chat-color-accent);
  color: var(--chat-color-text-inverse);
  box-shadow: 0 12px 26px rgba(21, 17, 48, 0.55);
}

.chat-root[data-theme="dark"] .chat-button-icon.chat-button-icon--accent:hover,
[data-chat-panel-root][data-theme="dark"] .chat-button-icon.chat-button-icon--accent:hover {
  background: var(--chat-color-accent-soft);
  border-color: var(--chat-color-accent-soft);
  box-shadow: 0 18px 38px rgba(21, 17, 48, 0.65);
}

.chat-root[data-theme="dark"] .chat-button-icon:hover,
[data-chat-panel-root][data-theme="dark"] .chat-button-icon:hover {
  background: var(--chat-color-layer-2);
}

.chat-root[data-theme="dark"] .chat-button-icon:focus-visible,
[data-chat-panel-root][data-theme="dark"] .chat-button-icon:focus-visible {
  box-shadow: 0 0 0 2px rgba(131, 115, 252, 0.45);
}

.chat-sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
`

const animations = `
@keyframes chat-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes chat-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

@keyframes chat-typing-pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.6);
    opacity: 1;
  }
}
`

export const CHAT_PANEL_STYLES = [
  base,
  tokens,
  host,
  chatOverlayStyles,
  chatResizeStyles,
  chatPanelShellStyles,
  chatHeaderStyles,
  conversationStyles,
  contextStyles,
  chainOfThoughtStyles,
  inlineCitationStyles,
  taskStyles,
  reasoningStyles,
  generatedImageStyles,
  loaderStyles,
  messageStyles,
  messageActionsStyles,
  responseStyles,
  promptInputStyles,
  sourcesStyles,
  toolStyles,
  codeBlockStyles,
  utilities,
  animations,
].join("\n\n")

export function injectChatStyles(target: ShadowRoot | Document) {
  const root = target instanceof Document ? target.head : target
  const STYLE_ID = "smart-site-chat-styles"
  if (target instanceof Document) {
    if (target.getElementById(STYLE_ID)) return
  } else if ((target as ShadowRoot).getElementById(STYLE_ID)) {
    return
  }
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = CHAT_PANEL_STYLES
  root.appendChild(style)
}
