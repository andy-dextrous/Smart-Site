# Mastra AI Architecture for Smart Site CMS

## The Mastra Way - Architecture Overview

Based on deep research into Mastra's patterns and best practices, this document outlines the recommended approach for building a sophisticated AI backend for Smart Site CMS.

## Core Principles

1. **Workflows First** - Deterministic processes are the foundation
2. **Autonomous Agents** - Self-contained specialists with their own tools
3. **Minimal Orchestration** - NewAgentNetwork only for dynamic routing
4. **Bidirectional Integration** - Workflows can call agents, agents can use workflows
5. **Composable Architecture** - Small, focused components that combine powerfully

## Architecture Components

### 1. Workflows (Deterministic Processes)

Workflows are graph-based state machines that handle multi-step operations with predictable outcomes.

```typescript
// Content Creation Workflow
const contentWorkflow = createWorkflow({
  id: "content-creation",
  description: "End-to-end content creation with optimization",
  inputSchema: z.object({ 
    topic: z.string(),
    keywords: z.array(z.string()).optional(),
  })
})
  .then("research", researchStep)
  .then("generate", generateStep)
  .then("optimize", optimizeStep)
  .then("publish", publishStep)
  .commit()

// WordPress Migration Workflow
const migrationWorkflow = createWorkflow({
  id: "wp-migration",
  description: "Import and transform WordPress content"
})
  .then("extract", extractWPContent)
  .then("transform", transformContent)
  .then("deduplicate", checkDuplicates)
  .then("import", importToPayload)
  .commit()

// SEO Optimization Workflow
const seoWorkflow = createWorkflow({
  id: "seo-optimization"
})
  .then("analyze", analyzeContent)
  .then("keywords", extractKeywords)
  .then("meta", generateMetaTags)
  .then("schema", createSchemaMarkup)
  .commit()
```

Key features:
- Built-in OpenTelemetry tracing
- Error handling and retries
- Suspend/resume capabilities
- Human-in-the-loop support

### 2. Agents (Autonomous Specialists)

Agents are self-contained AI entities with specific expertise and their own tool sets.

```typescript
// Content Specialist Agent
const contentAgent = new Agent({
  name: "content-specialist",
  description: "Manages all content operations",
  instructions: `You are a content management specialist.
    You can search, create, update, and optimize content.
    Always create drafts first for human review.
    Use semantic search to avoid duplicates.`,
  model: openai("gpt-4o"),
  tools: {
    queryPayload: payloadQueryTool,
    createContent: payloadCreateTool,
    updateContent: payloadUpdateTool,
    semanticSearch: vectorSearchTool,
    generateText: contentGenerationTool,
  },
  memory: true, // Enable persistent memory
})

// SEO Expert Agent
const seoAgent = new Agent({
  name: "seo-expert",
  description: "SEO optimization specialist",
  instructions: `You are an SEO expert with deep knowledge of:
    - Technical SEO
    - Content optimization
    - Schema markup
    - Meta tag generation
    Use data-driven approaches and best practices.`,
  model: openai("gpt-4o"),
  tools: {
    analyzeContent: seoAnalysisTool,
    generateMeta: metaGenerationTool,
    createSchema: schemaGenerationTool,
    keywordResearch: keywordTool,
  },
  memory: true,
})

// Analytics Agent
const analyticsAgent = new Agent({
  name: "analytics-expert",
  description: "Performance and analytics specialist",
  instructions: `You analyze content performance and provide insights.
    Focus on actionable recommendations.
    Use data to drive content strategy.`,
  model: openai("gpt-4o-mini"),
  tools: {
    queryAnalytics: analyticsQueryTool,
    generateReports: reportGenerationTool,
    trackConversions: conversionTool,
  },
  memory: true,
})
```

### 3. NewAgentNetwork (Dynamic Router)

Use NewAgentNetwork sparingly - only for non-deterministic routing based on user intent.

```typescript
const cmsNetwork = new NewAgentNetwork({
  id: "cms-coordinator",
  name: "CMS AI Coordinator",
  instructions: `You coordinate AI operations for the CMS.
    Analyze user requests and route to the appropriate specialist:
    - Content tasks → content-specialist
    - SEO tasks → seo-expert
    - Analytics → analytics-expert
    - Complex multi-step tasks → use workflows
    
    You can also combine agents and workflows for sophisticated operations.`,
  model: anthropic("claude-3-5-sonnet"),
  agents: {
    content: contentAgent,
    seo: seoAgent,
    analytics: analyticsAgent,
  },
  workflows: {
    createContent: contentWorkflow,
    migrateSite: migrationWorkflow,
    optimizeSEO: seoWorkflow,
  },
  memory: mastra.memory,
})
```

### 4. Tools (Atomic Functions)

Tools are simple, focused functions that perform specific operations.

```typescript
// Payload Query Tool
const payloadQueryTool = new Tool({
  id: "payload-query",
  description: "Query Payload CMS collections",
  inputSchema: z.object({
    collection: z.string(),
    where: z.record(z.any()).optional(),
    limit: z.number().optional(),
  }),
  execute: async ({ input }) => {
    const payload = await getPayload()
    return payload.find(input)
  },
})

// Vector Search Tool
const vectorSearchTool = new Tool({
  id: "vector-search",
  description: "Semantic search using embeddings",
  inputSchema: z.object({
    query: z.string(),
    threshold: z.number().default(0.7),
  }),
  execute: async ({ input }) => {
    const embedding = await generateEmbedding(input.query)
    return searchSimilarDocuments(embedding, {
      minScore: input.threshold,
    })
  },
})

// Content Generation Tool
const contentGenerationTool = new Tool({
  id: "generate-content",
  description: "Generate AI content",
  inputSchema: z.object({
    prompt: z.string(),
    style: z.string().optional(),
    length: z.enum(["short", "medium", "long"]),
  }),
  execute: async ({ input }) => {
    return generateAIContent(input)
  },
})
```

## Memory Strategy

Mastra supports multiple memory retrieval strategies:

### 1. Working Memory
Current conversation context for immediate recall.

### 2. Semantic Memory
Vector-based similarity search for relevant past interactions.

### 3. Thread Memory
Conversation history tracking for continuity.

```typescript
// Memory configuration
const memoryConfig = {
  storage: postgresStore,
  retrieval: {
    working: { maxItems: 10 },
    semantic: { threshold: 0.8 },
    thread: { maxHistory: 50 },
  },
}
```

## Integration Patterns

### Workflow-Agent Integration

```typescript
// Workflow calling an agent
const advancedWorkflow = createWorkflow({
  id: "advanced-content"
})
  .then("analyze", async ({ input }) => {
    // Agent analyzes requirements
    const analysis = await seoAgent.run({
      messages: [{ 
        role: "user", 
        content: `Analyze this topic: ${input.topic}` 
      }],
    })
    return { analysis }
  })
  .then("create", createContentStep)
  .commit()

// Agent using a workflow as a tool
const advancedAgent = new Agent({
  name: "advanced-agent",
  tools: {
    runWorkflow: new Tool({
      id: "run-workflow",
      execute: async ({ input }) => {
        return contentWorkflow.run(input)
      },
    }),
  },
})
```

### API Integration

```typescript
// Chat endpoint
app.post("/api/ai/chat", async (req, res) => {
  const { message, userId } = req.body
  
  const response = await cmsNetwork.run({
    messages: [{ role: "user", content: message }],
    userId,
  })
  
  res.json(response)
})

// Workflow execution endpoint
app.post("/api/ai/workflows/:id", async (req, res) => {
  const workflow = workflows[req.params.id]
  const result = await workflow.run(req.body)
  res.json(result)
})
```

## Production Considerations

### 1. Observability
- All workflows have built-in OpenTelemetry tracing
- Agent decisions are logged
- Tool executions are tracked

### 2. Error Handling
- Workflows support retries and error boundaries
- Agents gracefully handle tool failures
- Network provides fallback responses

### 3. Scalability
- Workflows can be distributed
- Agents can be rate-limited
- Tools can implement caching

### 4. Security
- Tool inputs are validated with Zod schemas
- Agent instructions enforce security boundaries
- Memory is scoped per user

## Implementation Roadmap

### Phase 1: Foundation (Week 1)
1. Set up PostgreSQL with pgvector
2. Create basic tools (Payload CRUD)
3. Implement simple content agent
4. Basic chat API

### Phase 2: Core Features (Week 2-3)
1. Build content creation workflow
2. Add SEO agent and tools
3. Implement semantic search
4. Add memory persistence

### Phase 3: Advanced Features (Week 4-5)
1. WordPress migration workflow
2. Social media agents
3. Analytics integration
4. Multi-agent coordination

### Phase 4: Production (Week 6)
1. Observability setup
2. Error handling refinement
3. Performance optimization
4. Security hardening

## Visual Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   Smart Site AI Backend                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  API Layer                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │/api/ai/chat │ │/api/ai/jobs │ │/api/ai/     │      │
│  │             │ │             │ │workflows    │      │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘      │
│         │               │               │               │
│  ┌──────┴───────────────┴───────────────┴──────┐       │
│  │          NewAgentNetwork (Router)           │       │
│  │         Only for chat interface             │       │
│  └──────┬───────────────┬───────────────┬──────┘       │
│         │               │               │               │
│  ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐      │
│  │   Agents    │ │  Workflows  │ │    Tools    │      │
│  │             │ │             │ │             │      │
│  │ • Content   │ │ • Creation  │ │ • Query     │      │
│  │ • SEO       │ │ • Migration │ │ • Create    │      │
│  │ • Analytics │ │ • SEO       │ │ • Search    │      │
│  │ • Social    │ │ • Social    │ │ • Generate  │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
│                                                         │
│  Storage Layer                                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐      │
│  │ PostgreSQL  │ │  pgvector   │ │   Memory    │      │
│  │  (Payload)  │ │ (Embeddings)│ │  (Mastra)   │      │
│  └─────────────┘ └─────────────┘ └─────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Key Takeaways

1. **Start with workflows** for deterministic processes
2. **Use agents** for autonomous, intelligent tasks
3. **Keep NewAgentNetwork minimal** - just for routing
4. **Tools are simple functions**, not complex services
5. **Leverage bidirectional integration** between workflows and agents
6. **Memory is distributed**, not centralized
7. **Follow Mastra patterns** for consistency and maintainability

This architecture provides a solid foundation for building a sophisticated AI-powered CMS backend that scales with your needs while maintaining clarity and modularity.