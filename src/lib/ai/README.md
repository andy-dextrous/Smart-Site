# Smart Site AI Setup

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# AI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# AI Features (optional - for future use)
AI_CONTENT_GENERATION_ENABLED=true
AI_SEO_OPTIMIZATION_ENABLED=true
AI_ANALYTICS_ENABLED=true

# AI Limits & Performance (optional - for future use)
AI_MAX_TOKENS_PER_REQUEST=4000
AI_MAX_REQUESTS_PER_MINUTE=60
```

## Directory Structure

```
src/lib/ai/
├── index.ts          # Main Mastra configuration
├── agents/           # AI agents (future use)
├── workflows/        # AI workflows (future use)
├── tools/           # AI tools and utilities (future use)
└── README.md        # This file
```

## Getting Started

1. Install dependencies: `pnpm install`
2. Add your OpenAI API key to `.env.local`
3. Run the development server: `pnpm dev`
4. The AI server will be available at `http://localhost:4112`

## Local Storage

This setup uses LibSQL for local file storage:

- `ai-storage.db` - Main AI data storage
- `ai-memory.db` - AI memory and context storage

These files will be created automatically when you first run the AI server.
