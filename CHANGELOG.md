# Changelog

All notable changes to this project will be documented in this file.

The format is based on "Keep a Changelog" and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-05-23

A ground-up rebuild of the interface and the data and AI layers, themed as an
editorial reading library. Existing v1 data is imported automatically the first
time the updated extension runs.

### Added

- **Built-in Reader** — a full-screen, distraction-free reading view inside the
  library with a typographic layout, a top reading-progress bar, and a quick
  link back to the original page.
- **Highlights & notes** — select text in the Reader to highlight it and attach
  a note; highlights are stored per article.
- **Live-page annotations** — revisiting a saved page shows a floating pill that
  surfaces the article's summary and re-renders your highlights on the original
  page.
- **Command palette** (`⌘K` / `Ctrl+K`) — search your articles and run commands
  (open settings, AI usage, switch view, toggle theme).
- **AI grouping** — optionally let AI pick a shelf and tags, on save and as a
  bulk action over selected articles.
- **AI usage panel** — summaries, podcasts, request count, estimated cost, and a
  recent-activity log, opened from the library header.
- **Audio player** — a custom podcast player with scrubbing and a playback-speed
  control (1× / 1.25× / 1.5× / 2×).
- **Markdown rendering** for AI summaries (bold, italics, lists, code, links) in
  the Reader and on the live-page pill.
- Self-hosted typeface stack (Fraunces, Newsreader, IBM Plex Mono) and two
  themes — "Paper" (light) and "Ink" (dark).

### Changed

- **Complete UI rebuild**: new header with global search, a left rail of views
  (All / Unread / Reading / Favorites / Archive) plus shelves and tags, list and
  grid entry cards, and a floating bulk-action bar (Read / Pin / Archive / Group
  / Delete).
- **New data layer**: a dedicated `quest` IndexedDB accessed through typed
  repositories. Data from the previous version is migrated automatically on
  first run.
- **AI layer rebuilt** around a provider abstraction — OpenAI and Google Gemini
  for summaries, ElevenLabs and Gemini TTS for podcasts — with stateless
  generation functions in place of the former manager singleton.
- **Idempotent generation**: regenerating a summary replaces the existing one of
  that kind, and regenerating a podcast replaces the prior audio, instead of
  accumulating duplicates.
- Settings now surface only the API-key fields for the providers you've selected.
- Categories are presented as **Shelves**.
- Podcast prompts are tuned for a natural, spoken, human delivery; podcast length
  scales with the source article.

### Removed

- The standalone AI Dashboard page — usage now lives in a panel within the
  library.

### Fixed

- Dark-mode contrast and the neutral palette, which previously read brown rather
  than the intended green.
- URL matching for duplicate detection and live-page annotations: normalized
  URLs now drop the fragment, so client-side hash changes no longer break the
  match.

## [1.0.0] - 2025-10-25

Initial public release.

### Added

- Core features:
  - One-click article saving (popup, context menu, selection)
  - Article management dashboard with filtering, sorting, and bulk actions
  - IndexedDB-backed storage and Chrome Sync for settings

- AI features:
  - Summary generation (OpenAI, Google Gemini)
  - Text-to-speech podcast generation (ElevenLabs, Gemini TTS)
  - Model selection and API key management

- Background and automation:
  - Auto-archive read articles after configurable number of days
  - Alarm-based reminder system

### Changed

- Project scaffolded with Vue 3 + TypeScript and built with Vite

### Fixed

- Dark mode contrast issues in settings modal
- Various bug fixes and type-safety improvements

---

For details on pull requests and commits, check the Git history.
