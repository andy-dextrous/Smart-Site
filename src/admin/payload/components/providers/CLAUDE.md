# CLAUDE.md - Smart Site AI Client-Side Integration

**System**: Admin Provider Layer - AI Context & Tool UI Components  
**Purpose**: Critical foundation for client-side AI features, managing Mastra connection state and Assistant UI tool rendering  
**Location**: `src/admin/providers/`

## Technical Architecture

**Core Files**:
- `ai-provider.tsx` - AI context provider with Mastra client state management
- `layout-provider/chat-panel.tsx` - Assistant UI streaming chat interface
- `/api/ai/chat/route.ts` - Edge function proxying to Mastra backend (port 4112)
- `/api/ai/health/route.ts` - AI service health check endpoint

**Main Process Flow**:
```typescript
// 1. AI Provider initializes Mastra client
const client = getMastraClient() // Connects to smart-site-ai backend

// 2. Chat runtime streams through API route  
const runtime = useChatRuntime({ api: "/api/ai/chat" })

// 3. Tool UIs render execution state
<AssistantToolUI toolName="generateMeta" render={...} />
```

**What this system provides**:
✅ Persistent Mastra client connection management  
✅ Real-time streaming chat interface with Assistant UI  
✅ Tool execution visualization and approval workflows  
✅ Client-side tool execution for DOM manipulation  
✅ Server-side tool UI rendering for backend operations

## Integration Points

### 1. Mastra Client Connection

**Files**: `admin/lib/mastra-client.ts`, `smartsite.config.ts`  
**Functionality**: Manages connection to smart-site-ai backend

```typescript
// smartsite.config.ts configuration
features: {
  ai: {
    enabled: true,
    endpoint: "http://localhost:4112",
  },
}

// Client initialization with JWT auth
const mastraClient = new MastraClient({
  baseUrl: serverUrl,
  headers: { Authorization: `Bearer ${process.env.MASTRA_JWT_TOKEN}` }
})
```

### 2. Assistant UI Chat Integration

**Files**: `chat-panel.tsx`, `/api/ai/chat/route.ts`  
**Functionality**: Streaming chat with tool execution display

```typescript
// API route forwards to Mastra with streaming support
const agent = client.getAgent(agentId)
const result = await agent.stream({ messages })
return result // Streaming response compatible with Assistant UI
```

### 3. Tool UI Component System

**Files**: Tool UI components in `admin/components/ai/tool-uis/`  
**Functionality**: Visual representation of tool execution states

## AI Provider Setup

The AI Provider manages the connection state and provides the Mastra client to all child components:

```typescript
// In layout provider or root component
import { AIProvider } from "@/admin/providers/ai-provider"

export function RootLayout({ children }) {
  return (
    <AIProvider>
      {children}
    </AIProvider>
  )
}
```

## Using AI Context

Access AI functionality anywhere in the admin:

```typescript
import { useAIContext } from "@/admin/providers/ai-provider"

function MyComponent() {
  const { isConnected, client, openChat, toggleChat } = useAIContext()
  
  // Check if AI is available
  if (!isConnected) {
    return <div>AI features not available</div>
  }
  
  // Open chat programmatically
  const handleAIAssist = () => {
    openChat()
  }
}
```

## Chat Integration with Assistant UI

The chat panel uses Assistant UI's streaming runtime for real-time responses:

```typescript
import { useChatRuntime } from "@assistant-ui/react-ai-sdk"

const runtime = useChatRuntime({
  api: "/api/ai/chat", // Proxies to Mastra backend
})
```

## Risk-Based Development Guidelines

### ⚠️ High-Impact Files

- `ai-provider.tsx` - Affects all AI functionality across admin
- `/api/ai/chat/route.ts` - Critical streaming endpoint
- `mastra-client.ts` - Connection configuration affects entire AI system

### ✅ Recommended Patterns

**Tool UI Creation Pattern**:
```typescript
// ✅ CORRECT: Type-safe tool UI with all states handled
export const MetaDescriptionToolUI = makeAssistantToolUI<
  { pageTitle: string; pageContent: string },
  { metaDescription: string; characterCount: number }
>({
  toolName: "generateMetaDescription", // Must match backend exactly
  render: ({ args, result, status }) => {
    // Always handle all status types
    switch (status.type) {
      case "running":
        return <LoadingState message="Analyzing page for SEO..." />
      case "incomplete":
        return <ErrorState reason={status.reason} />
      case "complete":
        return <ResultDisplay result={result} />
      default:
        return null
    }
  }
})

// ❌ INCORRECT: Missing status handling
render: ({ result }) => <div>{result.text}</div> // Will crash when running
```

**Client-Side Tool Pattern**:
```typescript
// ✅ CORRECT: Client tool with DOM access
const navigateTool = makeAssistantTool({
  ...tool({
    description: "Navigate to admin page",
    parameters: z.object({ path: z.string() }),
    execute: async ({ path }) => {
      // Direct DOM manipulation allowed
      window.location.href = path
      return { navigated: true }
    }
  }),
  toolName: "navigate"
})

// ❌ INCORRECT: Server operation in client tool
execute: async () => {
  await fetch('/api/database/update') // Should be server-side tool
}
```

### ⚠️ High-Risk Modifications

- **Never modify** tool names after deployment - breaks UI/backend sync
- **Never skip** status.type checks in render functions - causes runtime errors
- **Never expose** secrets in client-side tool code
- **Never mix** server operations in client-side tools

## Tool Categories for Planned Features

### 1. Content Generation Tools (Server-Side with UI)

**For**: AI Meta Descriptions, Blog Posts, Page Creation  
**Pattern**: Backend generates content → Frontend displays preview → User approves

```typescript
// Backend tool (in smart-site-ai)
const generateMetaDescriptionTool = createTool({
  id: "generateMetaDescription",
  description: "Generate SEO-optimized meta description analyzing page content",
  inputSchema: z.object({
    pageTitle: z.string(),
    pageContent: z.string(),
    targetKeywords: z.array(z.string())
  }),
  execute: async ({ context }) => {
    // AI analysis and generation
    return { 
      metaDescription: "...",
      characterCount: 155,
      seoStrategy: "Keyword-focused with CTA"
    }
  }
})

// Frontend UI (in smart-site admin)
const MetaDescriptionToolUI = makeAssistantToolUI<...>({
  toolName: "generateMetaDescription",
  render: ({ status, result }) => {
    if (status.type === "complete") {
      return <MetaPreview {...result} onApprove={updateField} />
    }
    // ... other states
  }
})
```

```typescript
import { makeAssistantTool, tool } from "@assistant-ui/react"
import { z } from "zod"

// Define a client-side tool
const navigateTool = tool({
  description: "Navigate to a different page in the admin",
  parameters: z.object({
    path: z.string().describe("The path to navigate to"),
  }),
  execute: async ({ path }) => {
    // Client-side execution
    window.location.href = path
    return { success: true }
  }
})

// Create the tool component
export const NavigateTool = makeAssistantTool({
  ...navigateTool,
  toolName: "navigate",
})

// Use in chat panel
<AssistantRuntimeProvider runtime={runtime}>
  <NavigateTool />
  <Thread />
</AssistantRuntimeProvider>
```

### 2. Payload Field Update Tools (Client-Side)

**For**: Direct CMS field updates after AI generation  
**Pattern**: Client-side execution for immediate Payload updates

```typescript
const updatePayloadFieldTool = makeAssistantTool({
  toolName: "updateField",
  description: "Update Payload CMS field directly",
  parameters: z.object({
    collection: z.string(),
    documentId: z.string(),
    field: z.string(),
    value: z.any()
  }),
  execute: async ({ collection, documentId, field, value }) => {
    // Direct Payload API call from client
    const response = await fetch(`/api/${collection}/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ [field]: value })
    })
    return { updated: response.ok }
  }
})
```

### 3. Analysis & Monitoring Tools (Server-Side)

**For**: SEO Analysis, Competitor Monitoring, Site Audits  
**Pattern**: Long-running backend analysis with streaming progress

```typescript
// Tool UI for SEO analysis workflow
const SEOAnalysisToolUI = makeAssistantToolUI<
  { pageId: string },
  { score: number; issues: string[]; recommendations: string[] }
>({
  toolName: "analyzeSEO",
  render: ({ status, result }) => {
    if (status.type === "running") {
      return <SEOAnalysisProgress /> // Show analysis steps
    }
    if (status.type === "complete") {
      return <SEOScoreCard {...result} /> // Yoast-like display
    }
  }
})
```

### 4. Migration & Import Tools (Hybrid)

**For**: WordPress Migration, Content Import  
**Pattern**: Server analyzes → Client approves mappings → Server executes

```typescript
const WordPressMigrationUI = makeAssistantToolUI<
  { wpSiteUrl: string },
  { mappings: BlockMapping[]; mediaCount: number }
>({
  toolName: "analyzeWordPressSite",
  render: ({ status, result, addResult }) => {
    if (status.type === "requires-action") {
      return (
        <MigrationApproval 
          mappings={result.mappings}
          onApprove={(approved) => addResult({ approved })}
        />
      )
    }
    // ... other states
  }
})
```

```typescript
import { makeAssistantToolUI } from "@assistant-ui/react"

// Define types for the tool
type MetaDescriptionArgs = {
  pageTitle: string
  pageContent: string
  targetKeywords: string[]
}

type MetaDescriptionResult = {
  metaDescription: string
  characterCount: number
  seoStrategy: string
}

// Create UI component for server tool
export const MetaDescriptionToolUI = makeAssistantToolUI<
  MetaDescriptionArgs,
  MetaDescriptionResult
>({
  toolName: "generateMetaDescription", // Must match backend tool name
  render: ({ args, result, status }) => {
    // Render based on execution status
    if (status.type === "running") {
      return (
        <div className="flex items-center gap-2">
          <Spinner />
          <span>Generating SEO-optimized meta description...</span>
        </div>
      )
    }
    
    if (status.type === "incomplete" && status.reason === "error") {
      return (
        <div className="text-red-500">
          Failed to generate meta description
        </div>
      )
    }
    
    // Render the result
    return (
      <div className="rounded-lg bg-blue-50 p-4">
        <h3 className="font-bold mb-2">Generated Meta Description</h3>
        <p className="mb-2 italic">"{result.metaDescription}"</p>
        <div className="text-sm text-gray-600">
          <p>Character count: {result.characterCount}/160</p>
          <p>Strategy: {result.seoStrategy}</p>
        </div>
      </div>
    )
  }
})
```

## Utility Functions Reference

### 🔧 AI Context Utilities

```typescript
import { useAIContext } from "@/admin/providers/ai-provider"
// Access AI state and controls

import { getMastraClient, isAIEnabled } from "@/admin/lib/mastra-client"  
// Server-side Mastra client access

import { makeAssistantTool, makeAssistantToolUI } from "@assistant-ui/react"
// Tool creation utilities

import { useChatRuntime } from "@assistant-ui/react-ai-sdk"
// Streaming chat runtime
```

### 🔧 Tool Status Types

```typescript
type ToolStatus = 
  | { type: "running" }
  | { type: "requires-action"; reason: string }
  | { type: "incomplete"; reason: "cancelled" | "error"; error?: unknown }
  | { type: "complete" }

// Always handle all states in render functions
```

```typescript
export const ApprovalToolUI = makeAssistantToolUI<
  { action: string; details: any },
  { approved: boolean; reason?: string }
>({
  toolName: "requestApproval",
  render: ({ args, result, addResult }) => {
    const [reason, setReason] = useState("")
    
    if (result) {
      return (
        <div className={result.approved ? "text-green-600" : "text-red-600"}>
          {result.approved ? "✅ Approved" : `❌ Rejected: ${result.reason}`}
        </div>
      )
    }
    
    return (
      <div className="border-2 border-yellow-400 rounded p-4">
        <h4 className="font-bold">Approval Required</h4>
        <p>{args.action}</p>
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => addResult({ approved: true })}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Approve
          </button>
          <button
            onClick={() => addResult({ approved: false, reason })}
            className="bg-red-500 text-white px-4 py-2 rounded"
          >
            Reject
          </button>
        </div>
      </div>
    )
  }
})
```

## Tool Status Handling

All tool UIs receive a status object indicating execution state:

```typescript
type ToolStatus = 
  | { type: "running" }
  | { type: "requires-action"; reason: string }
  | { type: "incomplete"; reason: "cancelled" | "error"; error?: unknown }
  | { type: "complete" }

// Handle all states in your render function
render: ({ status, args, result }) => {
  switch (status.type) {
    case "running":
      return <LoadingState />
    case "requires-action":
      return <UserInputRequired reason={status.reason} />
    case "incomplete":
      if (status.reason === "error") {
        return <ErrorDisplay error={status.error} />
      }
      return <div>Cancelled</div>
    case "complete":
      return <ResultDisplay result={result} />
  }
}
```

## System Dependencies

**Client-Side AI System depends on**:
- **100+ files** in Assistant UI components
- **50+ files** in Mastra client SDK  
- **Core admin files**:
  - `admin/lib/mastra-client.ts` - Connection management
  - `admin/payload/components/providers/ai-provider.tsx` - Context provider
  - `admin/payload/components/providers/layout-provider/chat-panel.tsx` - Chat UI
  - `app/(frontend)/api/ai/chat/route.ts` - Streaming endpoint
  - `smartsite.config.ts` - AI configuration

```typescript
const PageNavigationTool = makeAssistantTool({
  toolName: "navigateToPage",
  description: "Navigate to a specific page in the CMS",
  parameters: z.object({
    pageId: z.string(),
    openInNewTab: z.boolean().optional(),
  }),
  execute: async ({ pageId, openInNewTab }) => {
    const url = `/admin/collections/pages/${pageId}`
    if (openInNewTab) {
      window.open(url, '_blank')
    } else {
      window.location.href = url
    }
    return { navigated: true, url }
  }
})
```

### 2. Field Update Tool UI

```typescript
const FieldUpdateToolUI = makeAssistantToolUI<
  { field: string; value: any; entityId: string },
  { updated: boolean; newValue: any }
>({
  toolName: "updateField",
  render: ({ args, result, status }) => {
    if (status.type === "complete" && result.updated) {
      return (
        <div className="bg-green-50 p-3 rounded">
          ✅ Updated {args.field} to: {JSON.stringify(result.newValue)}
        </div>
      )
    }
    // ... handle other states
  }
})
```

### 3. Content Generation Tool UI

```typescript
const ContentGeneratorUI = makeAssistantToolUI<
  { contentType: string; guidelines: string },
  { content: string; wordCount: number }
>({
  toolName: "generateContent",
  render: ({ args, result, status }) => {
    if (status.type === "running") {
      return <div>Generating {args.contentType}...</div>
    }
    
    return (
      <div className="border rounded p-4">
        <h4>Generated {args.contentType}</h4>
        <p className="mt-2">{result.content}</p>
        <span className="text-sm text-gray-500">
          {result.wordCount} words
        </span>
      </div>
    )
  }
})
```

## Registering Multiple Tool UIs

Organize all tool UIs in a central location:

```typescript
// admin/components/ai/tool-uis/index.tsx
export { NavigateTool } from "./navigate-tool"
export { MetaDescriptionToolUI } from "./meta-description-tool-ui"
export { FieldUpdateToolUI } from "./field-update-tool-ui"
export { ContentGeneratorUI } from "./content-generator-ui"

// In chat panel component
import * as ToolUIs from "@/admin/components/ai/tool-uis"

function ChatPanel() {
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {/* Register all tool UIs */}
      {Object.values(ToolUIs).map((ToolUI, index) => (
        <ToolUI key={index} />
      ))}
      <Thread />
    </AssistantRuntimeProvider>
  )
}
```

## Dynamic Tool UI Registration

For tools that need access to local state:

```typescript
function useContextualToolUI() {
  const { currentPage } = usePageContext()
  
  useAssistantToolUI({
    toolName: "updateCurrentPage",
    render: ({ args, result }) => {
      // Access currentPage from context
      return (
        <div>
          Updating {currentPage.title}: {args.field}
        </div>
      )
    }
  })
}
```

## Tool UI Best Practices

### 1. Provide Clear Feedback

Always show what the tool is doing:

```typescript
if (status.type === "running") {
  return <div>Analyzing {args.pageCount} pages for SEO issues...</div>
}
```

### 2. Handle Errors Gracefully

```typescript
if (status.type === "incomplete" && status.reason === "error") {
  return (
    <Alert variant="destructive">
      <AlertDescription>
        Failed to complete action. Please try again.
        {status.error && <details>{status.error.message}</details>}
      </AlertDescription>
    </Alert>
  )
}
```

### 3. Show Meaningful Results

Transform raw data into user-friendly displays:

```typescript
// Instead of showing raw JSON
return <pre>{JSON.stringify(result)}</pre>

// Show formatted, meaningful output
return (
  <Card>
    <CardHeader>
      <CardTitle>SEO Analysis Complete</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <p>✅ {result.passedChecks} checks passed</p>
        <p>⚠️ {result.warnings} warnings found</p>
        <p>❌ {result.errors} errors to fix</p>
      </div>
    </CardContent>
  </Card>
)
```

## Troubleshooting

### Tool UI Not Rendering

1. **Check tool name matches exactly** between frontend and backend
2. **Verify tool is registered** in AssistantRuntimeProvider
3. **Check console for errors** in render function
4. **Ensure all status types handled** in render logic

### Connection Issues

1. **Verify smart-site-ai is running** on configured port (default 4112)
2. **Check JWT tokens match** between applications
3. **Test health endpoint**: `curl http://localhost:4112/api/health`
4. **Check browser network tab** for streaming response

### Tool Execution Failures

1. **Check tool parameters match** schema definition
2. **Verify client vs server tool type** is appropriate
3. **Check for abort signal handling** in long operations
4. **Review error in status.error** when status.type === "incomplete"

```typescript
const smartSiteConfig = defineConfig({
  settings: {
    ai: {
      enabled: true,
      endpoint: "http://localhost:4112",
    },
  },
})
```

## Environment Variables

Required environment variables for AI functionality:

```bash
# .env.local
MASTRA_JWT_TOKEN=your-jwt-token          # Authentication token
SMARTSITE_AI_REGISTRATION_SECRET=token   # Enables identity registration during seeding
```

## Testing Tool UIs

When developing tool UIs, test different states:

```typescript
// Mock different states during development
const mockStatuses = [
  { type: "running" as const },
  { type: "complete" as const },
  { type: "incomplete" as const, reason: "error" as const },
]

// Cycle through states for testing
const [mockIndex, setMockIndex] = useState(0)
const mockStatus = mockStatuses[mockIndex]
```

## Performance Considerations

1. **Lazy Load Tool UIs**: Only load tool UIs when the chat panel is opened
2. **Memoize Complex Renders**: Use `React.memo` for expensive tool UI components
3. **Stream Large Results**: For tools returning large datasets, implement progressive rendering

## Security Notes

- Client-side tools have full access to the browser environment
- Validate all tool inputs before execution
- Server-side tools should handle sensitive operations
- Never expose API keys or secrets in client-side tool code

## Debugging

Enable debug logging for AI features:

```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[AI]', 'Tool executed:', toolName, args)
  console.log('[AI]', 'Tool result:', result)
}
```

## Critical Warnings

⚠️ **Tool names must match exactly** between frontend UI and backend definition  
⚠️ **All status types must be handled** in render functions to prevent crashes  
⚠️ **Client tools have full DOM access** - validate all inputs for security  
⚠️ **Never expose API keys** or secrets in client-side tool code  
⚠️ **Tool UI components must be registered** inside AssistantRuntimeProvider

This client-side AI system is the critical foundation for all Smart Site AI features. Handle with care when modifying core provider files or API routes.
