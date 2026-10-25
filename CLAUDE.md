# SmartSite agent router

Read [docs/index.md](docs/index.md), then the smallest workflow for the task. This repository is a complete standalone application; no parent workspace or personal skills are required.

Use the shipped skills in `.agents/skills/` (Codex) or `.claude/skills/` (Claude). Both teach the same workflow. Startup, building, sections, content, data, repair and launch each have a focused skill. No fixed model or subagent is required.

Stored copy, navigation, pages and other CMS data use the content MCP workflow. Schema/rendering/layout changes use the section/data workflow. Use normal file tools for code. Read the existing brief and design decisions before redesigning.

Follow [guardrails](docs/rules/agent-guardrails.md). Preserve existing data and unrelated work. Verify visible changes in the actual app using an external browser. Do not claim a client connection from config-file presence or visual success from a compiler check.
