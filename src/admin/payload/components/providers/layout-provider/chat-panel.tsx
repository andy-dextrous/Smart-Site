"use client"

import { AssistantRuntimeProvider } from "@assistant-ui/react"
import { useChatRuntime } from "@assistant-ui/react-ai-sdk"
import {
  ActionBarPrimitive,
  AttachmentPrimitive,
  BranchPickerPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ThreadPrimitive,
} from "@assistant-ui/react"
import type { FC } from "react"
import {
  ArrowDownIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  PaperclipIcon,
  RefreshCwIcon,
  SendHorizontalIcon,
  SparklesIcon,
  XIcon,
} from "lucide-react"
import { cn } from "@/admin/utilities/ui"
import { Button } from "@/admin/components/ui/button"
import { Sheet, SheetContent, SheetHeader } from "@/admin/components/ui/sheet"

import { TooltipIconButton } from "@/admin/components/assistant-ui/tooltip-icon-button"
import { useAIContext } from "../ai-provider"
import { DialogTitle } from "@/components/ui/dialog"

/*************************************************************************/
/*  CHAT PANEL COMPONENT
/*************************************************************************/

export function ChatPanel() {
  const { isChatOpen, closeChat } = useAIContext()

  const runtime = useChatRuntime({
    api: "/api/ai/chat",
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <Sheet open={isChatOpen} onOpenChange={open => !open && closeChat()}>
        <SheetContent
          side="right"
          className="bg-admin-50 border-admin-200 dark:bg-admin-950 dark:border-admin-800 flex w-[620px] max-w-[620px] flex-col overflow-hidden p-0 sm:max-w-[480px]"
        >
          <ChatHeader />
          <ChatThread />
        </SheetContent>
      </Sheet>
    </AssistantRuntimeProvider>
  )
}

/*************************************************************************/
/*  CHAT HEADER
/*************************************************************************/

function ChatHeader() {
  return (
    <SheetHeader className="border-admin-200 bg-admin-100 dark:border-admin-850 dark:bg-admin-900 border-b p-4">
      <div className="flex items-center gap-3">
        <div className="bg-admin-accent/30 flex h-8 w-8 items-center justify-center rounded-full">
          <SparklesIcon className="text-admin-accent-light h-4 w-4" />
        </div>
        <div className="flex flex-col">
          <DialogTitle>Smart Site Assistant</DialogTitle>
        </div>
      </div>
    </SheetHeader>
  )
}

/*************************************************************************/
/*  CHAT THREAD
/*************************************************************************/

function ChatThread() {
  return (
    <ThreadPrimitive.Root className="flex flex-1 flex-col overflow-hidden">
      <ThreadPrimitive.Viewport className="flex flex-1 flex-col gap-4 overflow-y-auto scroll-smooth p-4">
        <ThreadWelcome />

        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessage,
            EditComposer: EditComposer,
            AssistantMessage: AssistantMessage,
          }}
        />

        <ThreadPrimitive.If empty={false}>
          <div className="min-h-8 flex-grow" />
        </ThreadPrimitive.If>

        <div className="from-admin-50 via-admin-50/95 dark:from-admin-950 dark:via-admin-950/95 sticky bottom-0 mt-6 flex w-full flex-col items-center justify-end gap-3 rounded-t-lg bg-gradient-to-t to-transparent pt-8 pb-6">
          <ThreadScrollToBottom />
          <Composer />
        </div>
      </ThreadPrimitive.Viewport>
    </ThreadPrimitive.Root>
  )
}

const ThreadScrollToBottom: FC = () => {
  return (
    <ThreadPrimitive.ScrollToBottom asChild>
      <Button
        variant="outline"
        size="sm"
        className="bg-admin-100 border-admin-300 text-admin-700 hover:bg-admin-200 hover:text-admin-900 dark:bg-admin-900 dark:border-admin-800 dark:text-admin-300 dark:hover:bg-admin-850 dark:hover:text-admin-100 rounded-full disabled:invisible"
      >
        <ArrowDownIcon className="h-4 w-4" />
      </Button>
    </ThreadPrimitive.ScrollToBottom>
  )
}

const ThreadWelcome: FC = () => {
  return (
    <ThreadPrimitive.Empty>
      <div className="flex min-h-80 w-full flex-grow flex-col items-center justify-center">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="from-admin-accent/20 to-admin-accent/5 border-admin-accent/10 mb-4 flex h-16 w-16 items-center justify-center rounded-full border bg-gradient-to-br">
            <SparklesIcon className="text-admin-accent h-8 w-8" />
          </div>
          <h2 className="text-admin-900 dark:text-admin-50 m-0 mb-2 text-2xl font-semibold">
            Smart Site Assistant
          </h2>
          <p className="text-admin-600 dark:text-admin-400 m-0 max-w-80 text-sm leading-6">
            I can help you build and manage your website sections, configure CMS fields,
            optimize content, and guide you through the platform&apos;s features.
          </p>
        </div>
        <ThreadWelcomeSuggestions />
      </div>
    </ThreadPrimitive.Empty>
  )
}

const ThreadWelcomeSuggestions: FC = () => {
  return (
    <div className="flex w-full flex-wrap justify-center gap-3">
      <ThreadPrimitive.Suggestion
        className="border-admin-300 bg-admin-100 hover:border-admin-400 hover:bg-admin-200 dark:border-admin-700 dark:bg-admin-850 dark:hover:border-admin-600 dark:hover:bg-admin-800 flex cursor-pointer flex-col rounded-lg border p-3 transition-all duration-100 hover:-translate-y-px hover:shadow-lg"
        prompt="How do I add a new page?"
        method="replace"
        autoSend
      >
        <div className="text-admin-900 dark:text-admin-100 mb-1 font-semibold">
          Add a new page
        </div>
      </ThreadPrimitive.Suggestion>

      <ThreadPrimitive.Suggestion
        className="border-admin-300 bg-admin-100 hover:border-admin-400 hover:bg-admin-200 dark:border-admin-700 dark:bg-admin-850 dark:hover:border-admin-600 dark:hover:bg-admin-800 flex cursor-pointer flex-col rounded-lg border p-3 transition-all duration-100 hover:-translate-y-px hover:shadow-lg"
        prompt="What can you help me with?"
        method="replace"
        autoSend
      >
        <div className="text-admin-900 dark:text-admin-100 mb-1 font-semibold">
          Create A Blog Post
        </div>
      </ThreadPrimitive.Suggestion>
    </div>
  )
}

/*************************************************************************/
/*  ATTACHMENT COMPONENTS
/*************************************************************************/

const AttachmentUI: FC = () => {
  return (
    <AttachmentPrimitive.Root className="border-admin-300 bg-admin-100 hover:bg-admin-200 dark:border-admin-700 dark:bg-admin-850 dark:hover:bg-admin-800 flex items-center gap-2 rounded-lg border p-2 transition-colors duration-100">
      {/* <AttachmentPrimitive.Name className="text-admin-100 truncate text-sm font-medium" /> */}
      <AttachmentPrimitive.Remove asChild>
        <button className="text-admin-600 hover:text-admin-900 hover:bg-admin-300 dark:text-admin-400 dark:hover:text-admin-100 dark:hover:bg-admin-700 flex h-4 w-4 items-center justify-center rounded-sm">
          <XIcon className="h-3 w-3" />
        </button>
      </AttachmentPrimitive.Remove>
    </AttachmentPrimitive.Root>
  )
}

const UserMessageAttachments: FC = () => {
  return (
    <div className="col-span-full col-start-1 row-start-1 flex w-full flex-row justify-end gap-3">
      <MessagePrimitive.Attachments components={{ Attachment: AttachmentUI }} />
    </div>
  )
}

const ComposerAttachments: FC = () => {
  return (
    <div className="flex w-full flex-row gap-3 overflow-x-auto">
      <ComposerPrimitive.Attachments components={{ Attachment: AttachmentUI }} />
    </div>
  )
}

const ComposerAddAttachment: FC = () => {
  return (
    <ComposerPrimitive.AddAttachment asChild>
      <TooltipIconButton
        className="my-2.5 size-8 p-2 transition-opacity ease-in-out"
        tooltip="Add Attachment"
        variant="ghost"
      >
        <PaperclipIcon className="h-4 w-4" />
      </TooltipIconButton>
    </ComposerPrimitive.AddAttachment>
  )
}

/*************************************************************************/
/*  COMPOSER COMPONENT
/*************************************************************************/

const Composer: FC = () => {
  return (
    <ComposerPrimitive.Root className="focus-within:ring-admin-accent/20 border-admin-300 bg-admin-100/80 hover:border-admin-400 dark:border-admin-700 dark:bg-admin-900/80 dark:hover:border-admin-600 flex w-full flex-wrap items-end rounded-xl border px-2.5 shadow-sm backdrop-blur-sm transition-all ease-in-out focus-within:ring-2">
      <ComposerAttachments />
      <ComposerAddAttachment />
      <ComposerPrimitive.Input
        rows={1}
        autoFocus
        placeholder="Type your message..."
        className="text-admin-900 placeholder:text-admin-500 dark:text-admin-100 dark:placeholder:text-admin-500 max-h-40 flex-grow resize-none border-none bg-transparent px-2 py-4 text-sm outline-none focus:ring-0 disabled:cursor-not-allowed"
      />
      <ComposerAction />
    </ComposerPrimitive.Root>
  )
}

const ComposerAction: FC = () => {
  return (
    <>
      <ThreadPrimitive.If running={false}>
        <ComposerPrimitive.Send asChild>
          <Button
            variant="default"
            size="sm"
            className="bg-admin-accent text-admin-0 hover:bg-admin-accent/90 my-2.5 h-8 w-8 rounded-full p-2 transition-all duration-100 hover:scale-105"
          >
            <SendHorizontalIcon className="h-4 w-4" />
          </Button>
        </ComposerPrimitive.Send>
      </ThreadPrimitive.If>
      <ThreadPrimitive.If running>
        <ComposerPrimitive.Cancel asChild>
          <Button variant="outline" size="sm" className="my-2.5 h-8 w-8 rounded-full p-2">
            <CircleStopIcon />
          </Button>
        </ComposerPrimitive.Cancel>
      </ThreadPrimitive.If>
    </>
  )
}

const UserMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="mb-4 grid grid-cols-[minmax(72px,1fr)_auto] gap-2 [&>*]:col-start-2">
      <UserMessageAttachments />
      <div className="bg-admin-accent text-admin-0 max-w-64 rounded-[20px_20px_4px_20px] px-4 py-3 text-lg leading-snug break-words">
        <MessagePrimitive.Content />
      </div>
      <BranchPicker className="text-admin-600 dark:text-admin-400 col-start-1 -mr-1 inline-flex items-center justify-end gap-1 text-xs" />
    </MessagePrimitive.Root>
  )
}

const UserActionBar: FC = () => {
  return null
}

const EditComposer: FC = () => {
  return (
    <ComposerPrimitive.Root className="border-admin-300 bg-admin-100 dark:border-admin-700 dark:bg-admin-850 my-4 flex w-full flex-col gap-3 rounded-xl border p-4">
      <ComposerPrimitive.Input className="text-admin-900 dark:text-admin-100 min-h-10 resize-none border-none bg-transparent outline-none" />
      <div className="flex items-center justify-end gap-2">
        <ComposerPrimitive.Cancel asChild>
          <Button variant="ghost" size="sm">
            Cancel
          </Button>
        </ComposerPrimitive.Cancel>
        <ComposerPrimitive.Send asChild>
          <Button size="sm">Update</Button>
        </ComposerPrimitive.Send>
      </div>
    </ComposerPrimitive.Root>
  )
}

const AssistantMessage: FC = () => {
  return (
    <MessagePrimitive.Root className="mb-4 grid grid-cols-[auto_1fr_auto] grid-rows-[auto_1fr] gap-2">
      <div className="col-span-2 flex items-start gap-3">
        <div className="from-admin-accent/20 to-admin-accent/5 border-admin-accent/10 mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border bg-gradient-to-br">
          <SparklesIcon className="text-admin-accent h-4 w-4" />
        </div>
        <div className="text-admin-900 dark:text-admin-100 max-w-64 text-lg leading-relaxed break-words">
          <MessagePrimitive.Content />
        </div>
      </div>
      <AssistantActionBar />
      <BranchPicker className="text-admin-600 dark:text-admin-400 col-start-2 ml-11 inline-flex items-center justify-end gap-1 text-xs" />
    </MessagePrimitive.Root>
  )
}

const AssistantActionBar: FC = () => {
  return (
    <ActionBarPrimitive.Root
      hideWhenRunning
      autohide="not-last"
      autohideFloat="single-branch"
      className="text-admin-600 data-[floating]:bg-admin-100 data-[floating]:border-admin-300 dark:text-admin-400 dark:data-[floating]:bg-admin-900 dark:data-[floating]:border-admin-700 col-start-3 mt-1 flex gap-1 data-[floating]:absolute data-[floating]:rounded-md data-[floating]:border data-[floating]:p-1 data-[floating]:shadow-lg"
    >
      <ActionBarPrimitive.Copy asChild>
        <Button variant="ghost" size="sm">
          <MessagePrimitive.If copied>
            <CheckIcon className="h-3.5 w-3.5" />
          </MessagePrimitive.If>
          <MessagePrimitive.If copied={false}>
            <CopyIcon className="h-3.5 w-3.5" />
          </MessagePrimitive.If>
        </Button>
      </ActionBarPrimitive.Copy>
      <ActionBarPrimitive.Reload asChild>
        <Button variant="ghost" size="sm">
          <RefreshCwIcon className="h-3.5 w-3.5" />
        </Button>
      </ActionBarPrimitive.Reload>
    </ActionBarPrimitive.Root>
  )
}

const BranchPicker: FC<{ className?: string }> = ({ className }) => {
  return (
    <BranchPickerPrimitive.Root
      hideWhenSingleBranch
      className={cn(
        "text-admin-600 dark:text-admin-400 inline-flex items-center gap-1 text-xs",
        className
      )}
    >
      <BranchPickerPrimitive.Previous asChild>
        <Button variant="ghost" size="sm">
          <ChevronLeftIcon className="h-3 w-3" />
        </Button>
      </BranchPickerPrimitive.Previous>
      <span className="font-medium">
        <BranchPickerPrimitive.Number /> / <BranchPickerPrimitive.Count />
      </span>
      <BranchPickerPrimitive.Next asChild>
        <Button variant="ghost" size="sm">
          <ChevronRightIcon className="h-3 w-3" />
        </Button>
      </BranchPickerPrimitive.Next>
    </BranchPickerPrimitive.Root>
  )
}

const CircleStopIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="currentColor"
      width="16"
      height="16"
    >
      <rect width="10" height="10" x="3" y="3" rx="2" />
    </svg>
  )
}
