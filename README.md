# Botato 🥔

An autonomous, collaborative multi-agent AI workspace with persistent sandboxes, long-term memory, Model Context Protocol (MCP) tools, and real-time streaming chat.

---

## Overview

**Botato** enables teams and individuals to create, manage, and collaborate with specialized AI agents in individual 1:1 sessions or shared group workspaces. Each agent maintains its own persona, persistent memory notes, isolated code execution sandbox, and external tool integrations.

---

## Features

- **Multi-Agent Orchestration & Consultation**
  - Group chats with multiple specialized bots collaborating on complex tasks.
  - Autonomous inter-bot delegation using the `@BotName` mention system.
  - Multi-bubble streaming UI rendering distinct, synchronized responses per persona.

- **Persistent Memory & Context Recall**
  - Long-term memory notes saved per bot across all individual and group chats.
  - Proactive note-taking that retains workspace layouts, database IDs, and user preferences.

- **Isolated Code Sandboxes**
  - Dedicated virtual file system and compute environment for every bot.
  - File management (read, write, list) and shell execution within secure boundaries.
  - In-browser sandbox desktop preview and artifact viewing.

- **Model Context Protocol (MCP) Tool Gateway**
  - Seamless connection to external tools and APIs (such as Notion, GitHub, and custom services).
  - Dynamic JSON Schema sanitization and resilient tool calling.
  - Automatic database discovery and payload condensation to avoid context window limits.

- **Cloud-Native Background Execution**
  - Powered by **Trigger.dev v3** for resilient background agent runs.
  - Scalable LLM inference with Groq models (`openai/gpt-oss-120b`, `openai/gpt-oss-20b`, `qwen/qwen3.8-27b`).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router), React 19, TypeScript |
| **Styling & UI** | Tailwind CSS, Base UI, shadcn/ui, Lucide Icons, Rive |
| **Avatars** | DiceBear 10 (`@dicebear/core`, `@dicebear/styles`) |
| **Authentication** | Clerk (`@clerk/nextjs`) |
| **Database** | Neon Serverless Postgres, Drizzle ORM |
| **Agent Orchestration** | Vercel AI SDK (`ai`), Groq Provider (`@ai-sdk/groq`) |
| **Background Runner** | Trigger.dev v3 SDK |
| **Markdown & Formatting** | Streamdown (Code, Math, Mermaid diagrams) |

---

## Project Structure

```
├── actions/             # Next.js Server Actions (bots, chat, group chats, mcp)
├── app/                 # Next.js App Router (pages, layouts, API routes)
├── components/          # React UI components (chat, sandboxes, bots, dialogs)
│   ├── ai-elements/     # Specialized streaming chat UI primitives
│   └── ui/              # shadcn / Base UI components
├── db/                  # Drizzle ORM schema definitions and database client
├── lib/
│   ├── db/              # Neon database client and schema definitions
│   └── mcp/             # MCP client, schema sanitization, and security filters
├── services/
│   ├── sandbox/         # Standalone sandbox execution service
│   └── mcp-gateway/     # Local/cloud MCP tool gateway service
├── src/
│   └── trigger/         # Trigger.dev background task handlers (chat execution)
└── tests/               # Unit and integration test suites
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm or pnpm
- A Neon Postgres database URL
- Clerk account for authentication
- Groq API key for LLM inference
- Trigger.dev account for background agent execution

### 1. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/VANSH3104/Botato.git
cd Botato
npm install
```

### 2. Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Database (Neon Postgres)
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/neondb?sslmode=require"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Groq LLM API
GROQ_API_KEY="gsk_..."

# Trigger.dev
TRIGGER_SECRET_KEY="tr_dev_..."
NEXT_PUBLIC_TRIGGER_PROJECT_ID="proj_..."

# Sandbox Service (Optional / Local Dev)
SANDBOX_API_KEY="your-sandbox-secret"
NEXT_PUBLIC_SANDBOX_URL="http://localhost:4000"
```

### 3. Database Setup

Push the Drizzle schema to your live database:

```bash
npm run db:push
```

### 4. Running Locally

Run the Next.js development server:

```bash
npm run dev
```

Optionally run supporting services for local sandboxing and MCP:

```bash
# Sandbox runner
npm run sandbox:dev

# MCP gateway runner
npm run mcp-gateway:dev
```

### 5. Running & Deploying Background Agents (Trigger.dev)

Start the Trigger.dev development listener:

```bash
npx trigger.dev@latest dev
```

Deploy background tasks to production:

```bash
npx trigger.dev@latest deploy
```

---

## Development Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the Next.js development server |
| `npm run build` | Build the Next.js application for production |
| `npm run start` | Start the production server |
| `npm run typecheck` | Run TypeScript type checks (`tsc --noEmit`) |
| `npm run lint` | Run ESLint across the codebase |
| `npm run db:push` | Push schema changes directly to Neon Postgres |
| `npm run db:studio` | Open Drizzle Studio to inspect database records |
| `npm test` | Run sandbox security and path traversal tests |

---

## License

This project is licensed under the [MIT License](LICENSE).
