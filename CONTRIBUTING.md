# Contributing to FirstPR

First: if this is your first-ever open-source contribution, welcome. Genuinely — you picked a
fitting repo for it. This document is the "boring but useful" version of what the app itself
tries to teach interactively.

## Setup

```bash
git clone https://github.com/YOUR-USERNAME/firstpr.git
cd firstpr
npm install
npm run dev
```

That starts the client (`http://localhost:5173`) and server (`http://localhost:3001`) together.
See the main [README](./README.md) for the full setup walkthrough, including AI provider setup.

## Before you open a PR

- **Keep it small and focused.** One issue, one PR. If you notice something else worth fixing
  while you're in there, open a separate issue for it instead of bundling it in — this is
  literally the behavior the AI mentor is instructed to teach, so we try to hold ourselves to it
  too.
- **Run the checks:**
  ```bash
  npm run typecheck   # both client and server
  npm run build        # catches anything typecheck alone won't
  ```
- **Match the existing style.** No linter is enforced in CI today (see
  [`docs/ROADMAP.md`](./docs/ROADMAP.md) if you'd like to add one as a first PR), so just follow
  the formatting already in the file you're touching.
- **Test AI-provider changes against a real key if you can.** The four providers in
  `server/src/services/aiProviders/` each hit a real external API with slightly different
  streaming formats (SSE for Anthropic/OpenAI/Gemini, newline-delimited JSON for Ollama) — a
  change that type-checks can still be wrong about the actual wire format. If you don't have a key
  for the provider you're changing, say so in the PR description and someone can help verify.

## Where things live

See the **Project structure** section of the [README](./README.md#project-structure) for the
full map, and [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for how a chat message flows
through the system end to end.

A few pointers for common changes:

| I want to... | Start here |
|---|---|
| Change how the AI is instructed to behave | `server/src/services/systemPrompt.ts` |
| Add or fix an AI provider | `server/src/services/aiProviders/` |
| Change the issue search filters | `client/src/components/IssueFilters.tsx` + `server/src/services/githubService.ts` |
| Change the workspace layout | `client/src/pages/Workspace.tsx` |
| Change colors, fonts, spacing | `client/src/index.css` (the `@theme` block) |

## Reporting bugs / suggesting features

Open an issue. If you can, use the same shape the app itself encourages: what's the goal, what
would "done" look like, and what's explicitly out of scope for a first pass at it. It makes the
issue easier for someone else to pick up as their own first PR, too.

## Code of Conduct

This project follows the [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before
participating.
