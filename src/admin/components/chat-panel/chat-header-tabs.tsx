"use client"

import { Button } from "@/admin/components/ui/button"
import { TabsList, TabsTrigger } from "@/admin/components/ui/tabs"
import { PlusIcon, XIcon } from "lucide-react"
import { type Thread } from "@/admin/lib/ai/threads"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/admin/components/ui/alert-dialog"

/**
 * Component props
 */
interface ChatHeaderTabsProps {
  threads: Thread[]
  openTabs: string[]
  activeThreadId?: string
  onSelect: (id: string) => void
  onCloseTab: (id: string) => void
  onDeleteThread?: (id: string) => void
  hasMessages?: (id: string) => boolean
  onNewThread: () => void
  getDisplayTitle: (t?: Thread) => string
  onClosePanel: () => void
}

/**
 * Chat header with tabs and actions
 */
export function ChatHeaderTabs({
  threads,
  openTabs,
  activeThreadId,
  onSelect,
  onCloseTab,
  onDeleteThread,
  hasMessages,
  onNewThread,
  getDisplayTitle,
  onClosePanel,
}: ChatHeaderTabsProps) {
  return (
    <div className="border-admin-200 bg-admin-100 dark:border-admin-850 dark:bg-admin-900 flex w-full flex-shrink-0 items-center justify-between gap-2 border-b p-2">
      <div className="flex min-w-0 w-full flex-1 items-center gap-2 overflow-x-auto">
        <TabsList className="bg-admin-100 text-admin-600 dark:bg-admin-900 dark:text-admin-400 flex w-full items-center justify-start px-1 py-0 whitespace-nowrap">
          {openTabs.map(tid => {
            const t = threads.find(th => th.id === tid)
            const title = getDisplayTitle(t)
            const showConfirm = hasMessages ? hasMessages(tid) : true
            return (
              <TabsTrigger
                key={tid}
                value={tid}
                className="h-[calc(100%-1px)] px-2.5 sm:px-3 border-none text-admin-900 dark:text-admin-100 hover:text-admin-950 dark:hover:text-admin-50 data-[state=active]:bg-admin-200 dark:data-[state=active]:bg-admin-750 data-[state=active]:text-admin-900 dark:data-[state=active]:text-admin-100 flex-none rounded-md shadow-none data-[state=active]:shadow-none"
              >
                <span className="flex min-w-0 items-center gap-1 text-[13px] max-w-40 truncate">{title}</span>
                {showConfirm ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <span
                        role="button"
                        tabIndex={0}
                        className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded text-admin-700 hover:text-admin-900 dark:text-admin-300 dark:hover:text-admin-100 opacity-80 hover:opacity-100 focus:outline-none"
                        onClick={e => {
                          e.stopPropagation()
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault()
                            e.stopPropagation()
                            ;(e.target as HTMLElement).click()
                          }
                        }}
                        aria-label="Delete thread"
                      >
                        <XIcon className="h-3 w-3" />
                      </span>
                    </AlertDialogTrigger>
                    <AlertDialogContent onClick={e => e.stopPropagation()}>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete this chat thread?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this thread and its messages. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={e => e.stopPropagation()}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={e => {
                            e.stopPropagation()
                            if (onDeleteThread) onDeleteThread(tid)
                            else onCloseTab(tid)
                          }}
                        >
                          Delete thread
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <span
                    role="button"
                    tabIndex={0}
                    className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded text-admin-700 hover:text-admin-900 dark:text-admin-300 dark:hover:text-admin-100 opacity-80 hover:opacity-100 focus:outline-none"
                    onClick={e => {
                      e.stopPropagation()
                      if (onDeleteThread) onDeleteThread(tid)
                      else onCloseTab(tid)
                    }}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        e.stopPropagation()
                        ;(e.target as HTMLElement).click()
                      }
                    }}
                    aria-label="Delete thread"
                  >
                    <XIcon className="h-3 w-3" />
                  </span>
                )}
              </TabsTrigger>
            )
          })}
          {/* New chat button inside the tabs row */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewThread}
            className="flex-none rounded-md bg-transparent dark:bg-transparent hover:text-admin-950 dark:hover:text-admin-50 text-admin-900 dark:text-admin-100 h-[calc(100%-1px)] aspect-square"
            aria-label="New chat"
          >
            <PlusIcon />
          </Button>
        </TabsList>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClosePanel}
        className="bg-transparent hover:bg-transparent text-admin-900 dark:text-admin-100 h-10 w-10 p-2.5"
      >
        <XIcon className="h-6 w-6" />
      </Button>
    </div>
  )
}
