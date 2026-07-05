# FirstPR

**Find a real, beginner-friendly GitHub issue. Get an AI mentor that teaches you through it instead of solving it for you.**

[![License: MIT](https://img.shields.io/badge/License-MIT-8B7FFF.svg)](./LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-4FD68C.svg)](./CONTRIBUTING.md)
[![Node](https://img.shields.io/badge/node-%3E%3D18.17-333.svg)](https://nodejs.org)

> Renaming note: "FirstPR" is just a starting name so the code has something consistent to call itself. Rename it freely — `package.json` (root, `client/`, `server/`) and the title in `index.html` are the only places the name actually appears.

---

## What this actually is

A self-hosted web app for people who want to make their **first open-source contribution** and don't know where to start. It has three parts:

1. **An issue finder** — searches all of public GitHub for `good first issue`, `help wanted`, `bug`, `documentation`, and `security` labels, with a difficulty-free filter for issues nobody's already assigned to.
2. **A workspace** — open the folder you cloned right in the browser (real read/write access to your local disk, no upload step), edit in a full Monaco editor (the same engine VS Code uses), and save straight back to disk.
3. **An AI mentor** — a chat sidebar that can see the file you have open, knows exactly what the issue is asking for, and is instructed — deliberately and specifically — **never to just hand you the fix**.

You bring your own AI API key (or run something local and free via Ollama). The repo owner running this app never sees or pays for your usage.

## The problem this is trying to solve

"Good first issue" boards solve *discovery*. They don't solve the much bigger problem: once you've found an issue, you're alone with an unfamiliar codebase, and the two tools available to you are Stack Overflow (slow) and a general-purpose AI chatbot (which will just write the fix for you if you ask it to, teaching you nothing and often producing a PR the maintainer has to rewrite anyway). This tries to close that gap without falling into the second trap.

## How it works

```
1. Find an issue         Search across GitHub, or paste a URL you already have
2. Fork, clone, branch    One click to fork; the exact git commands to run locally
3. Open the workspace     Point the app at the folder you cloned
4. Code with your mentor  The AI sees your file, asks questions, never writes the fix
5. Wrap up                Commands to commit/push, plus an AI-drafted PR description
```

## Teach, don't tell — how the AI is actually kept in check

This is the part that makes the tool worth building, so it's worth explaining honestly instead of just asserting it.

**1. Every session starts by turning the issue into a scope brief.** The raw GitHub issue text gets sent to the AI once, asking it to extract a structured goal, acceptance criteria, likely files, and — critically — an explicit **out-of-scope** list. That brief is shown to you as a card, and it's re-sent as context on every single message for the rest of the session.

**2. The system prompt is instructed, explicitly and repeatedly, not to solve the issue.** It's told to ask what you've tried before explaining anything, to describe concepts instead of writing corrected code, to redirect you if you ask for unrelated features or refactors, and to never invent files or functions it hasn't actually been shown. You can read the entire prompt yourself — nothing about it is hidden — in [`server/src/services/systemPrompt.ts`](./server/src/services/systemPrompt.ts).

**3. It only sees code you've actually opened.** The active file's real content (and your current selection, if any) is sent with every message. Other files in your project are shown to it *by name only*, so it can ask "can you show me `utils.ts`?" instead of confidently making up what's probably in it.

**Where this is honest about its limits:** this is prompt engineering, not a sandbox. A determined person can always get *any* AI to break character, or just open a different tab and ask a general-purpose chatbot for the answer instead. This tool doesn't stop that — it just makes the default path, the *easy* path, the one where you actually learn something. If you find a prompt injection or a scope-escape that's easy to hit by accident, that's a genuinely great first issue for this repo.

## What's actually in the box

| | |
|---|---|
| **Issue search** | GitHub's real search API, live — label, language, org/repo, sort, "unassigned only" |
| **Local file access** | Real read/write to your cloned folder via the File System Access API |
| **Code editor** | Monaco (VS Code's editor), multi-file tabs, save with `Ctrl/Cmd+S` |
| **AI mentor chat** | Streaming responses, sees your active file + selection, stays scoped to the issue |
| **Scope brief** | AI-generated goal / acceptance criteria / out-of-scope, from the raw issue |
| **PR helper** | Copy-paste git commands + an AI-drafted PR description in your own words |
| **4 AI providers** | Anthropic, OpenAI, Gemini, or fully local/free via Ollama — your key, your choice |

## Tech stack

- **Client:** React 19 + TypeScript + Vite + Tailwind CSS v4 + Monaco Editor + React Router
- **Server:** Node.js + Express + TypeScript — a thin, provider-agnostic proxy (no database, no accounts)
- **State:** React Context + `localStorage`/`sessionStorage` — no Redux, nothing to learn beyond React itself
- **AI:** direct server-side calls to Anthropic / OpenAI / Gemini / Ollama, normalized behind one interface

No database. No user accounts. No telemetry. It's two local processes and your own API key.

---

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org) **18.17 or newer** (20+ recommended) — check with `node --version`
- **Chrome, Edge, or another Chromium-based browser** for full read/write access to your local files (see [Browser requirements](#browser-requirements) below)
- An API key from at least one AI provider — or [Ollama](https://ollama.com) installed locally for a fully free option

### Install and run

```bash
git clone https://github.com/YOUR-USERNAME/firstpr.git
cd firstpr
npm install
npm run dev
```

That's it — `npm install` at the root installs both the client and server (they're set up as npm workspaces), and `npm run dev` starts both together:

- Client: **http://localhost:5173**
- Server: **http://localhost:3001**

Open `http://localhost:5173`, go to **Settings**, and add an API key for whichever provider you want to use. Everything else works without any further setup.

### Optional: raise your GitHub rate limit

Unauthenticated GitHub search is limited to about 10 requests/minute, which you can hit quickly while browsing issues. In **Settings → GitHub preferences**, add a [personal access token](https://github.com/settings/tokens?type=beta) — it needs **no scopes at all**, it's only used to raise the read rate limit. Alternatively, set `GITHUB_TOKEN` in `server/.env` (copy `server/.env.example` first) to apply it server-wide for everyone using your instance.

### Optional: single-process / "production" mode

If you'd rather run one process instead of two (for example, deploying this for a small team or community):

```bash
npm run build
npm run start:server
```

The Express server will detect the built client and serve it directly on **http://localhost:3001** — API and frontend on the same port, no proxy needed.

---

## Choosing an AI provider

Pick whichever fits your budget and privacy preferences — the mentor prompt and scope-locking behave identically across all four. Model landscape moves fast; these were current as of **July 2026** ([`client/src/context/SettingsContext.tsx`](./client/src/context/SettingsContext.tsx) is the one place to update the defaults later).

| Provider | Suggested model | Why |
|---|---|---|
| **Anthropic (Claude)** | `claude-sonnet-5` | Explains *reasoning*, not just answers — a strong fit for a teaching tool. [Get a key →](https://console.anthropic.com/settings/keys) |
| **OpenAI (GPT)** | `gpt-5.5` | Strong general coding ability, huge community of examples if you get stuck. [Get a key →](https://platform.openai.com/api-keys) |
| **Google (Gemini)** | `gemini-3.5-flash` | The most generous free tier of the three hosted options. [Get a key →](https://aistudio.google.com/apikey) |
| **Ollama (local)** | `qwen2.5-coder:7b` | Completely free, fully private — your code never leaves your machine. [Install →](https://ollama.com/download) |

**Going local with Ollama:**

```bash
ollama pull qwen2.5-coder:7b   # ~5GB, runs on most modern laptops
ollama serve                   # starts the local API FirstPR talks to
```

If you have a strong GPU (24GB+) or an Apple Silicon Mac with 32GB+ unified memory, `qwen3-coder:30b` is a meaningfully stronger coding model and still completely free. `gpt-oss:20b` is a good middle ground on ~16GB of RAM.

Pricing changes often enough that we won't quote numbers here — check each provider's pricing page before committing to heavy use, and note that OpenAI/Anthropic/Google all offer smaller, cheaper model tiers (shown in the model dropdown in Settings) if you want to keep costs minimal while you're mentoring/learning.

---

## Browser requirements

The workspace's "open a local folder with real save support" feature uses the [File System Access API](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API), which is currently **Chrome, Edge, and other Chromium browsers only** — Firefox and Safari haven't implemented it and Mozilla has indicated they don't intend to.

On Firefox/Safari, FirstPR automatically falls back to a **read-only mode**: you can still browse your files and chat with the AI mentor, but you'll need to copy changes back into your own editor manually instead of saving from inside the app. A banner in the workspace tells you which mode you're in.

---

## Project structure

```
firstpr/
├── client/                  React + Vite frontend
│   └── src/
│       ├── pages/           Home, IssueExplorer, IssueDetail, Workspace, Settings
│       ├── components/      FileTree, CodeEditor, AIChatSidebar, ScopeBriefCard, …
│       ├── context/         SettingsContext (AI provider config), WorkspaceContext
│       └── lib/             github.ts, ai.ts, fsAccess.ts — all the non-UI logic
├── server/                  Express + TypeScript backend
│   └── src/
│       ├── routes/          issues.ts (GitHub proxy), ai.ts (provider-agnostic AI)
│       ├── services/
│       │   ├── aiProviders/ One file per provider behind a shared interface
│       │   ├── systemPrompt.ts   ← the actual "teach, don't tell" prompt
│       │   └── scopeBrief.ts     Issue → structured JSON brief
│       └── utils/           AppError, SSE/NDJSON stream parsers
└── docs/                    Architecture notes, roadmap
```

See [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) for how a chat message actually flows end to end.

## Roadmap

See [`docs/ROADMAP.md`](./docs/ROADMAP.md) — and consider picking one up as your own first PR to this repo.

## Contributing

Contributions are very welcome, including (especially) from people making their first one. See [`CONTRIBUTING.md`](./CONTRIBUTING.md). Please also read the [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

## License

[MIT](./LICENSE) — do basically whatever you want with this, including running your own branded version for your own community.
