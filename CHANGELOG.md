# Changelog

All notable changes to this project will be documented in this file.

The format is based on "Keep a Changelog" and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

- Improvements
  - Continued UI polish and dark mode fixes
  - AI provider configuration improvements
  - Auto-archive scheduler and background processing

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
