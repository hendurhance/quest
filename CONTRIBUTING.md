# Contributing to Quest

Thanks for your interest in contributing! We welcome contributions of all kinds: bug fixes, features, documentation, tests, and design improvements.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing](#testing)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Building & Releases](#building--releases)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** (or yarn)
- **Google Chrome** or **Microsoft Edge**

### Setup

1. Fork the repository
2. Clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/quest.git
cd quest
```

3. Install dependencies:

```bash
npm install
```

4. Start the dev server:

```bash
npm run dev
```

5. Load the extension:
   - Chrome: open `chrome://extensions/` — Edge: open `edge://extensions/`
   - Enable **Developer mode**
   - Click **Load unpacked** and select the `dist/` folder

---

## Development Workflow

### Available Commands

```bash
npm run dev          # Dev server with HMR
npm run build        # Type-check + production build → dist/ (and release/release.zip)
npm run preview      # Preview the production build
npm run type-check   # vue-tsc, no emit
npm test             # Vitest (watch)
npm run test:run     # Vitest (single run)
npm run test:coverage # Vitest with coverage
```

### Development Process

1. Create a feature branch from `main`:

```bash
git checkout -b feature/my-awesome-feature
```

2. Make your changes. HMR updates the popup and library pages quickly.

   > **Content-script note:** every build replaces the content-script files. If
   > you've loaded `dist/`, reload the extension at `chrome://extensions/` and
   > reload any open page after a build — otherwise the page keeps the old
   > content script (this is the usual reason live-page annotations seem to
   > "disappear" during development).

3. Test in both **Paper** (light) and **Ink** (dark) themes, and check the
   service-worker console (`chrome://extensions/` → *Service worker*).

4. Run the checks:

```bash
npm run type-check
npm run test:run
```

5. Commit with a descriptive message and open a Pull Request.

---

## Project Structure

```
quest/
├── src/
│   ├── popup/                 # Toolbar popup (capture)
│   │   ├── App.vue
│   │   ├── index.html
│   │   └── main.ts
│   │
│   ├── manager/               # Library (opens in a tab)
│   │   ├── App.vue            # Orchestrator: views, bulk bar, modals
│   │   ├── components/
│   │   │   ├── AppHeader.vue
│   │   │   ├── ContentsRail.vue    # Views + shelves + tags
│   │   │   ├── EntryCard.vue
│   │   │   ├── CommandPalette.vue
│   │   │   ├── CategoryEditor.vue
│   │   │   ├── SettingsModal.vue
│   │   │   └── Reader.vue          # Built-in reading view + Distill rail
│   │   ├── index.html
│   │   └── main.ts
│   │
│   ├── background/            # MV3 service worker
│   │   └── index.ts           # Message router, context menus, alarms, badge
│   │
│   ├── content/               # Content script
│   │   └── index.ts           # Extraction, word count, live-page annotations
│   │
│   ├── core/                  # Framework-free domain logic
│   │   ├── db/                # IndexedDB ('quest')
│   │   │   ├── schema.ts          # Stores + indexes
│   │   │   ├── connection.ts      # open/promisify/txStore helpers
│   │   │   ├── migrate.ts         # One-time legacy (v1) → v2 import
│   │   │   ├── types.ts
│   │   │   ├── repos/             # articles, summaries, audio, highlights,
│   │   │   │                      #   taxonomy (categories/tags), activity
│   │   │   └── index.ts           # QuestDB facade (createArticle, addSummary, …)
│   │   ├── ai/                # Provider abstraction + orchestration
│   │   │   ├── providers/         # openai, gemini, elevenlabs, gemini-tts
│   │   │   ├── summarize.ts       # summarizeArticle()
│   │   │   ├── podcast.ts         # generatePodcast()
│   │   │   ├── group.ts           # groupArticle() / categorizeArticle()
│   │   │   ├── test-key.ts        # Lightweight API-key auth check
│   │   │   ├── catalog.ts         # Live model/voice lists from each provider's API
│   │   │   ├── pricing.ts         # Known per-model prices for cost estimates
│   │   │   ├── prompts.ts, config.ts, voices.ts, audio.ts, audit.ts
│   │   │   └── index.ts
│   │   ├── keys.ts            # Encrypted API-key storage (Web Crypto)
│   │   ├── messaging/         # Typed message map + router (messages.ts, bus.ts)
│   │   ├── extraction/        # HTML sanitize / excerpt helpers
│   │   ├── reader/            # Highlight re-anchoring
│   │   ├── markdown.ts, format.ts, settings.ts
│   │
│   ├── stores/                # Pinia stores
│   │   ├── library.ts         # Articles, views, filters, sort, selection
│   │   ├── reader.ts          # Open article, summaries, audio, highlights
│   │   ├── settings.ts, aiUsage.ts, ui.ts, index.ts
│   │
│   ├── design/                # Design system
│   │   ├── tokens.css, base.css, fonts.css
│   │   └── primitives/        # QButton, QModal, QField, QIcon, QAudioPlayer, …
│   │
│   ├── composables/useTheme.ts
│   └── types/                 # Shared + AI-provider types
│
├── public/
│   ├── icons/                 # 16 / 32 / 48 / 128
│   └── fonts/                 # Self-hosted woff2 (Fraunces, Newsreader, IBM Plex Mono)
│
├── manifest.config.ts         # MV3 manifest (CRXJS)
├── vite.config.ts             # Vite + CRXJS + zip-pack
└── package.json
```

---

## Architecture

### Surfaces and data flow

```
┌──────────────┐        ┌──────────────────┐
│   Popup      │        │  Library / Reader │   (Vue 3 + Pinia)
│  (capture)   │        │   (manager)       │
└──────┬───────┘        └─────────┬─────────┘
       │  typed messages          │  direct calls
       │  (core/messaging)        │
       ▼                          ▼
┌─────────────────┐        ┌──────────────────┐
│  Background SW   │        │   core/db (facade)│
│  - router        │───────▶│   IndexedDB       │
│  - context menus │        └──────────────────┘
│  - alarms/badge  │
└──────┬───────────┘
       │
       ▼
┌──────────────┐   ┌──────────────────┐
│  core/ai     │──▶│ Provider APIs     │
│  (providers) │   │ (OpenAI/Gemini/   │
└──────────────┘   │  ElevenLabs)      │
                   └──────────────────┘

  Content script ◀── getPageAnnotations ──▶ renders summary pill + highlights
```

- **`core/`** is framework-free TypeScript. The UI (Vue) and the service worker
  both depend on it; it depends on neither.
- **`core/db`** owns IndexedDB. The `QuestDB` facade exposes higher-level
  operations (`createArticle` deduped by clean URL, `addSummary`/`addAudio` which
  are idempotent, `deleteArticle` which cascades to summaries/audio/highlights).
- **`core/ai`** resolves provider config + key, calls the selected provider, and
  writes results back through `core/db`, logging each operation to the audit log.
- **`core/messaging`** is a typed `MessageMap`: add an action there and both
  `sendMessage` and `createMessageRouter` become aware of it.
- **`background`** is mostly thin handlers + browser-event plumbing (context
  menus, the auto-archive alarm, the unread badge, marking a page read on visit).

---

## Code Style Guidelines

### TypeScript

- TypeScript everywhere; avoid `any`.
- Keep `core/` free of Vue/Chrome-UI concerns so it stays testable in isolation.
- Prefer small, pure functions; the AI/DB layers are stateless functions over a
  shared facade, not singletons holding state.

### Vue

- Composition API with `<script setup lang="ts">`.
- Shared logic lives in Pinia stores (`src/stores`) and composables.
- Build UI from the `src/design/primitives` components rather than re-styling
  ad-hoc; reach for tokens in `src/design/tokens.css` for color/spacing/type.

### CSS

- Use the design tokens (`var(--paper)`, `var(--ink)`, `var(--accent)`,
  `var(--space-*)`, `var(--font-*)`, …). Don't hard-code colors.
- Prefer scoped styles; use `:deep()` for sanitized v-html content.
- Both themes must work — verify Paper and Ink.

### Comments

- Comment **why**, not what. Leave a note when a decision is non-obvious (a
  workaround, an invariant, a security or ordering constraint).
- Don't add comments that restate self-explanatory code, top-of-file banner
  blocks, or decorative dividers.

---

## Testing

Tests run on [Vitest](https://vitest.dev/) with `fake-indexeddb` and a DOM
environment (`happy-dom` / `jsdom`).

```bash
npm test            # watch
npm run test:run    # CI-style single run
npm run test:coverage
```

- Co-locate or mirror tests with the code they cover; `core/` logic (DB
  migration, formatting, highlight re-anchoring, markdown) is the easiest and
  most valuable to test because it has no UI dependencies.
- DB tests should close and delete the database between cases so blocked
  transactions don't leak across tests.

---

## Pull Request Guidelines

### Before Submitting

1. `npm run type-check` passes
2. `npm run test:run` passes
3. Tested in both themes; no errors in the page or service-worker console
4. Docs updated if behavior changed

### PR Requirements

- **Target branch**: `main`
- **Clear title and description**: explain what and why
- **Link related issues**: "Fixes #123" / "Closes #456"
- **Keep PRs focused**; split large changes

### Commit Message Format

Conventional commits:

```
<type>(<scope>): <subject>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`

**Examples:**

```
feat(reader): persist scroll position as reading progress

fix(content): re-anchor highlights on slow SPA pages

Fixes #38
```

---

## Building & Releases

### Manual Build

```bash
npm run build
```

Outputs:
- `dist/` — the unpacked extension (load this in the browser)
- `release/release.zip` — a zipped build for store submission

### Automated Releases

GitHub Actions builds and publishes a release on version-tag push:

```bash
npm version patch   # or minor / major — updates package.json (manifest reads from it)
git push --follow-tags
```

### Versioning

[Semantic Versioning](https://semver.org/): **Major** (breaking), **Minor**
(features), **Patch** (fixes). The manifest version is read from `package.json`.

---

## Troubleshooting

### Extension won't load

- Ensure `dist/` exists (`npm run dev` or `npm run build`)
- Check `chrome://extensions/` for errors (Developer mode on)

### Live-page annotations / pill not showing after a build

- Reload the extension at `chrome://extensions/`, then reload the page. Each
  build replaces the content-script files, so a previously loaded page still
  references the old script.

### HMR not working

- Confirm the dev server is running and check the terminal for Vite errors
- Reload the extension manually

### Type-check errors

- `npm run type-check` to list them; check imports and types

### AI features not working

- Verify the API key in Settings and use **Test**
- Check the provider dashboard for quota/credits
- Watch the service-worker console for API errors

### Articles not saving

- Inspect IndexedDB in DevTools → Application → IndexedDB (`quest`)
- Check the service-worker console

---

## Code of Conduct

Be respectful and inclusive. Use welcoming language, accept constructive
criticism gracefully, and focus on what's best for the community.

---

## Security

If you discover a security vulnerability, please **do not open a public issue**.
Instead, create a [private security report](../../security/advisories/new) or
contact the maintainers directly.

---

**Thank you for contributing to Quest!** 🎉
