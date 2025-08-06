"use client"

import { makeAssistantToolUI } from "@assistant-ui/react"
import { CheckCircle, Loader2, AlertCircle, Server, Globe } from "lucide-react"

/*************************************************************************/
/*  BACKEND TOOL UI
/*************************************************************************/

type BackendToolArgs = {
  message?: string
}

type BackendToolResult = {
  message: string
  timestamp: string
  executionLocation: string
}

export const TestBackendToolUI = makeAssistantToolUI<BackendToolArgs, BackendToolResult>({
  toolName: "testBackend",
  render: ({ args, result, status }) => {
    // Handle different execution states
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <Loader2 className="h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">Running Backend Tool...</p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Executing on Mastra server (port 4112)
            </p>
          </div>
        </div>
      )
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">Backend Tool Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to execute the backend tool
            </p>
          </div>
        </div>
      )
    }

    if (status.type === "complete" && result) {
      return (
        <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-3 mb-3">
            <Server className="h-5 w-5 text-green-600 dark:text-green-400" />
            <p className="font-medium text-green-900 dark:text-green-100">Backend Tool Result</p>
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2 pl-8">
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Message:</span>
              <p className="text-gray-900 dark:text-gray-100">{result.message}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Location:</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">{result.executionLocation}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp:</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return null
  },
})

/*************************************************************************/
/*  FRONTEND TOOL UI
/*************************************************************************/

type FrontendToolArgs = {
  message?: string
}

type FrontendToolResult = {
  message: string
  timestamp: string
  executionLocation: string
}

export const TestFrontendToolUI = makeAssistantToolUI<FrontendToolArgs, FrontendToolResult>({
  toolName: "testFrontend",
  render: ({ args, result, status }) => {
    // Handle different execution states
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-3 p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <Loader2 className="h-5 w-5 animate-spin text-purple-600 dark:text-purple-400" />
          <div>
            <p className="font-medium text-purple-900 dark:text-purple-100">Running Frontend Tool...</p>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Executing in your browser (client-side)
            </p>
          </div>
        </div>
      )
    }

    if (status.type === "incomplete" && status.reason === "error") {
      return (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div>
            <p className="font-medium text-red-900 dark:text-red-100">Frontend Tool Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">
              Failed to execute the frontend tool
            </p>
          </div>
        </div>
      )
    }

    if (status.type === "complete" && result) {
      return (
        <div className="p-4 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-3">
            <Globe className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <p className="font-medium text-purple-900 dark:text-purple-100">Frontend Tool Result</p>
            <CheckCircle className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          </div>
          <div className="space-y-2 pl-8">
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Message:</span>
              <p className="text-gray-900 dark:text-gray-100">{result.message}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Location:</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">{result.executionLocation}</p>
            </div>
            <div>
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Timestamp:</span>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return null
  },
})