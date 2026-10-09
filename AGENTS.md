<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Agent Guidelines & Rules

## 1. Git & Version Control
- Do not create commits, create branches, stash, or push to remote repositories without explicit user permission.
- Never run destructive git commands (e.g., `git reset --hard`, `git clean -fd`, `git checkout .`) without explicit confirmation.

## 2. Code Quality & Standards
- **TypeScript**: Maintain strict types; avoid `any`. Ensure type-safety across all components and utilities.
- **Next.js & React 19**:
  - Follow Next.js App Router conventions.
  - Keep components Server Components by default; only add `'use client'` when using hooks, state, or browser APIs.
- **Styling & UI**: Use Tailwind CSS and maintain consistency with existing UI components (shadcn / Base UI).
- **Code Integrity**: Preserve existing comments, formatting, and unrelated code. Use focused edits rather than blanket rewrites.

## 3. Package & Environment Safety
- Use `npm` for package management. Do not install new packages without user confirmation unless requested.
- Do not delete, overwrite, or expose secrets in environment files (`.env*`).

## 4. Verification Workflow
- Run typecheck (`npm run typecheck`) and linter (`npm run lint`) before finishing tasks to ensure no broken builds or regressions.
