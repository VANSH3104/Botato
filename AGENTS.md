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
- **Database**: Only run `npm run db:push` to apply schema changes. Never run `db:migrate` (drizzle-kit migrate) or `db:generate` — this project does not use migration files; schema changes are applied directly to the live database via `db:push`.

## 4. Verification Workflow
- Run typecheck (`npm run typecheck`) and linter (`npm run lint`) before finishing tasks to ensure no broken builds or regressions.

## DiceBear

Use DiceBear 10. Documentation: https://www.dicebear.com/llms.txt

There are seven native cores with identical output, not one library with
wrappers. Use the one matching this project's language. Do not reach for the
JavaScript core when the project is written in something else:

    JavaScript  @dicebear/core + @dicebear/styles
    PHP         dicebear/core + dicebear/styles
    Python      dicebear-core + dicebear-styles
    Rust        dicebear-core + dicebear-styles
    Go          github.com/dicebear/dicebear-go/v10 + github.com/dicebear/styles/v10
    Dart        dicebear_core + dicebear_styles
    C#          DiceBear.Core + DiceBear.Styles

Every style page carries a loading snippet for all seven, for example
https://www.dicebear.com/styles/lorelei/index.md

HTTP API: https://api.dicebear.com/10.x/<style>/svg?seed=<seed> The seed is a
query parameter, not a path segment. Options are query parameters too; array
values are separated by commas.

Options named after a component end in Variant: eyesVariant, not eyes. This
holds in all seven cores and in the HTTP API. Look up the options of a style at
https://api.dicebear.com/10.x/<style>/options.json

Write these forms, not the ones on the left. The left column is pre-10 and the
API does not reject it, so an outdated call runs and silently does the wrong
thing:

    avatars.dicebear.com/api/<style>/<seed>.svg  ->  api.dicebear.com/10.x/<style>/svg?seed=<seed>
    api.dicebear.com/9.x/<style>/svg             ->  api.dicebear.com/10.x/<style>/svg
    npm install @dicebear/collection             ->  npm install @dicebear/styles
    npm install @dicebear/lorelei                ->  npm install @dicebear/styles
    createAvatar(lorelei, { seed })              ->  new Avatar(new Style(definition), { seed })
    { eyes: ['variant01'] }                      ->  { eyesVariant: ['variant01'] }
    ?radius=50                                   ->  ?borderRadius=50

Only JavaScript and the HTTP API have a pre-10 form. The other six cores were
released in 2026 and never had one, so any older-looking PHP, Python, Rust, Go,
Dart or C# API attributed to DiceBear is invented rather than outdated.