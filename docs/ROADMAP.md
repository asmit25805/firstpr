# Roadmap

Roughly in order of how much they'd help a first-time contributor. None of these are promises —
they're intentionally written as issue-sized, so feel free to open one of these as an actual
GitHub issue (with a proper scope brief!) and pick it up.

## Would help the most

- **Multi-label search.** GitHub's `label:` qualifier ANDs rather than ORs, so today the issue
  filter only supports one label at a time on purpose (see `IssueFilters.tsx`). Searching several
  labels at once means firing parallel queries and merging/deduping results client- or
  server-side.
- **Syntax highlighting in chat code blocks.** `ChatMessage.tsx` renders markdown via
  `react-markdown` but doesn't syntax-highlight fenced code blocks yet — `rehype-highlight` or
  `shiki` would be a clean addition.
- **A real terminal panel.** Right now the "Wrap up" drawer gives you copy-paste git commands.
  Running them for you (and showing test output) would need something like an embedded terminal —
  worth scoping carefully, since running arbitrary shell commands from a browser app is a real
  trust boundary to get right.
- **Session persistence for chat history.** Chat state currently lives in React state and clears
  on refresh. Persisting to `localStorage` per-issue would make it survive accidental reloads.

## Nice to have

- **Saved searches** for repos/orgs you check regularly, once multi-label search (above) exists.
- **A lightweight test runner integration** — detect `package.json`'s `test` script (or
  `pytest`/`go test`/etc.) and surface a "run tests" button with output shown inline.
- **A light theme.** Everything is dark-mode-only today by design — adding a light theme means a
  second token pass in `index.css`, not just a simple invert, since several colors (the diff
  green/amber especially) were picked to work specifically on a dark background.
- **i18n.** All UI copy is hardcoded English strings today.
- **A CLI companion** (`npx firstpr`) that does the fork/clone/branch steps for you instead of
  just showing the commands.

## Bigger swings

- **VS Code extension** using the same scope-locked system prompt, for people who'd rather stay in
  their existing editor than use the in-browser one.
- **Maintainer-side scope hints.** Let a repo maintainer add a small YAML front-matter block to an
  issue (or a label convention) that feeds directly into the scope brief instead of relying on the
  AI to infer it from prose alone — would make the brief more reliable on terser issues.
- **Provider #5, #6, ...** — the `AIProvider` interface (see `docs/ARCHITECTURE.md`) is
  intentionally small; adding Mistral, Groq, or a next-gen provider is a contained, well-scoped PR.

## Explicitly not planned

- **Accounts, a hosted multi-tenant version, analytics/telemetry.** This is meant to stay
  something you run yourself, on your own machine, with your own key. Anyone is welcome to fork
  this into a hosted product, but it's a deliberately different project from what lives here.
