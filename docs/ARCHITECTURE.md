# Architecture

## The shape of it

Two processes, no database:

```
┌──────────────────┐        ┌──────────────────┐        ┌───────────────────┐
│   Client (5173)  │──/api─▶│  Server (3001)  │──────▶│  api.github.com    │
│  React + Vite    │◀───────│ Express + TS    │        │  (issue search)    │
│  Monaco editor   │        │                  │──────▶│  Anthropic/OpenAI/ │
│  localStorage:   │        │ no persistence — │       │  Gemini/Ollama      │
│ AI key, settings │        │ everything comes │       │  (your key, your    │
└──────────────────┘        │ from the request │       │  choice)            │
        │                   └──────────────────┘       └─────────────────────┘
        │
        ▼
  File System Access API
  (your locally cloned repo — never touches the server at all)
```

The server never sees your local files. Reading, editing, and saving the repo you cloned all
happen directly between the browser and your disk — the server's only job is to (a) proxy
GitHub's search API so the browser doesn't have to deal with CORS, and (b) forward your chat
messages, plus a carefully constructed system prompt, to whichever AI provider you picked.

## Why a server exists at all

The workspace itself could theoretically be a static site. Two things need a server:

1. **CORS.** GitHub's API allows browser calls, but Anthropic's, OpenAI's, and Gemini's mostly
   don't (by design — a key visible in browser network tab / dev tools is a leaked key). Calls to
   all three happen from the Node server instead, where the key exists only for the lifetime of
   that one request.
2. **A single, un-editable system prompt.** The scope-locking behavior in
   [`systemPrompt.ts`](../server/src/services/systemPrompt.ts) is assembled server-side from the
   issue + scope brief + code context sent in the request. A client-only version of this app
   would need to trust the browser to send an honest system prompt on every call, which defeats
   the purpose the moment someone opens dev tools.

Nothing here is stored beyond the lifetime of a request. There's no `users` table because there
are no user accounts — your AI key and GitHub token live in `localStorage` in your own browser
and are attached to each request; the server forwards them and forgets them.

## How one chat message actually flows

1. You type a message in `AIChatSidebar` and hit send.
2. The client (`lib/ai.ts` → `streamChat`) posts to `/api/ai/chat` with: the issue, the scope
   brief (if one's been generated), your current open file's path/content/selection, the names of
   other files in the project, your full message history, and your provider config (name, model,
   API key).
3. `routes/ai.ts` validates the payload, then calls `buildTutorSystemPrompt()` in
   `systemPrompt.ts`, which assembles one big system prompt: the issue text, the scope brief with
   its explicit out-of-scope list, ten numbered teaching rules, and the code you currently have
   open.
4. `getProvider(config.name)` picks the right implementation
   (`services/aiProviders/{anthropic,openai,gemini,ollama}.ts`) — each one implements the same
   `streamChat` / `complete` interface, so the route code never needs to know which provider it's
   talking to.
5. The provider makes the real HTTP call to Anthropic/OpenAI/Gemini/Ollama with `stream: true`,
   and pipes tokens back to the Express response as plain text chunks as they arrive (see
   `utils/sseParser.ts` for the three SSE-based providers, `utils/ndjsonParser.ts` for Ollama's
   newline-delimited JSON format).
6. The client reads the response body as a stream (`res.body.getReader()`) and appends each chunk
   to the last chat message in React state, which is what gives the "typing" effect.

If the API key is wrong or the provider is unreachable, the error is caught, converted to a plain
English message (`utils/AppError.ts`), and sent back either as a normal JSON error (if nothing had
streamed yet) or appended inline to the partial response (if the stream had already started).

## Adding a fifth AI provider

Implement the `AIProvider` interface in a new file under `server/src/services/aiProviders/`
(`streamChat` + `complete`), register it in that folder's `index.ts`, and add its default model +
description to `client/src/context/SettingsContext.tsx`. Nothing else needs to change — every
route, every component, and the whole scope-locking system is provider-agnostic by design.

## Why no database

Every piece of state either belongs to GitHub (issues), belongs to the AI provider (nothing is
retained — each request is stateless), or belongs to you (your key, your settings, your files).
There was never a piece of state that actually needed to live on this app's own server, so it
doesn't have anywhere to put one. This keeps setup to `npm install && npm run dev` with nothing
else to configure, which matters a lot for a project whose whole point is being easy for a
first-time contributor to run.
