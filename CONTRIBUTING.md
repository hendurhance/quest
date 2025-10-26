# Contributing to Quest

Thanks for your interest in contributing! We welcome contributions of all kinds: bug fixes, features, documentation, tests, and design improvements.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [Architecture](#architecture)
- [Code Style Guidelines](#code-style-guidelines)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Building & Releases](#building--releases)
- [Troubleshooting](#troubleshooting)

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **yarn**
- **Google Chrome** browser

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

4. Start development server:

```bash
npm run dev
```

5. Load extension in Chrome:
   - Open `chrome://extensions/`
   - Enable **Developer mode** (toggle in top right)
   - Click **Load unpacked**
   - Select the `dist/` folder from your project directory

---

## Development Workflow

### Available Commands

```bash
# Start dev server with HMR (Hot Module Replacement)
npm run dev

# Type checking (no build)
npm run type-check

# Production build
npm run build

# Preview production build
npm run preview
```

### Development Process

1. Create a feature branch from `main`:

```bash
git checkout -b feature/my-awesome-feature
```

2. Make your changes
   - Hot Module Replacement updates the extension instantly
   - No manual reload required in most cases
   - For manifest changes, reload extension in `chrome://extensions/`

3. Test your changes thoroughly
   - Verify in both light and dark mode
   - Test all affected features
   - Check console for errors

4. Run type checking:

```bash
npm run type-check
```

5. Commit your changes with a descriptive message:

```bash
git commit -m "feat(ai): add Gemini TTS provider selection"
```

6. Push to your fork and open a Pull Request

---

## Project Structure

```
quest/
├── src/
│   ├── popup/                    # Extension popup (360px width)
│   │   ├── App.vue               # Main popup component
│   │   ├── components/           # Popup-specific components
│   │   ├── index.html
│   │   └── main.ts
│   │
│   ├── manager/                  # Article manager dashboard
│   │   ├── App.vue               # Main manager component
│   │   ├── components/           # Manager components
│   │   │   ├── ArticleCard.vue
│   │   │   ├── Toolbar.vue
│   │   │   └── ...
│   │   ├── modals/               # Modal components
│   │   │   ├── SettingsModal.vue
│   │   │   ├── SummaryModal.vue
│   │   │   └── ...
│   │   ├── index.html
│   │   └── main.ts
│   │
│   ├── ai-dashboard/             # AI analytics dashboard
│   │   ├── App.vue
│   │   ├── components/
│   │   │   ├── UsageStats.vue
│   │   │   ├── AuditLogs.vue
│   │   │   └── ...
│   │   ├── index.html
│   │   └── main.ts
│   │
│   ├── background/               # Background service worker
│   │   └── index.ts              # Event handlers, alarms, auto-archive
│   │
│   ├── content/                  # Content scripts
│   │   └── index.ts              # Article extraction, word count
│   │
│   ├── components/               # Shared components
│   │   ├── Modal.vue
│   │   ├── Button.vue
│   │   ├── CategoryModal.vue
│   │   └── ...
│   │
│   ├── composables/              # Vue composables
│   │   ├── useStorage.ts         # IndexedDB operations
│   │   ├── useTheme.ts           # Theme management
│   │   └── useNotification.ts    # Toast notifications
│   │
│   ├── utils/                    # Utility functions
│   │   ├── storage.ts            # IndexedDB wrapper
│   │   ├── ai-manager.ts         # AI integration logic
│   │   ├── secure-api-keys.ts    # Encrypted API key storage
│   │   ├── model-config.ts       # AI model configurations
│   │   ├── voice-config.ts       # TTS voice configurations
│   │   └── formatters.ts         # Date/time formatters
│   │
│   ├── types/                    # TypeScript definitions
│   │   ├── index.ts              # Main types
│   │   └── ai-providers.ts       # AI provider enums
│   │
│   └── styles/                   # Global styles
│       └── variables.css         # CSS variables (theme, colors)
│
├── public/
│   ├── icons/                    # Extension icons (16, 32, 48, 128)
│   └── audio-processor.worker.js # Web Worker for audio processing
│
├── .github/
│   └── workflows/
│       └── release.yml           # Automated releases with builds
│
├── manifest.config.ts            # Extension manifest configuration
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
└── package.json
```

---

## Architecture

### Data Flow

```
┌─────────────────┐
│  Content Script │ (Extract article content)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Popup/Manager  │ (User interaction)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Background     │ (Service Worker)
│  - Auto-archive │
│  - Reminders    │
│  - Notifications│
└────────┬────────┘
         │
         ├──────────────┬──────────────┐
         ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────────┐
│  IndexedDB   │ │ Chrome   │ │ AI APIs      │
│  (Articles)  │ │ Storage  │ │ (Summaries,  │
│              │ │ (Settings│ │  Podcasts)   │
└──────────────┘ └──────────┘ └──────────────┘
```

### Key Components

**Storage System** (`src/utils/storage.ts`)
- Articles: Full article content with metadata
- Summaries: AI-generated summaries with token usage
- Audio Files: Podcast audio as Blobs
- Categories: User-defined categories with colors
- Tags: Tag usage tracking
- Audit Logs: AI operation history

**AI Manager** (`src/utils/ai-manager.ts`)
- Handles all AI API calls
- Manages model selection
- Tracks token usage and costs
- Stores API keys securely using Web Crypto API (AES-256-GCM)

**Background Service Worker** (`src/background/index.ts`)
- Auto-archive scheduler (runs daily via Chrome Alarms)
- Reading reminders (alarm-based)
- Article import/export
- Context menu handlers
- Notification management

---

## Code Style Guidelines

### TypeScript

- Use **TypeScript** for all new code
- Avoid `any` types — use proper typing
- Use **enums** for constants instead of string literals
- Add **JSDoc comments** for exported functions

Example:

```typescript
/**
 * Generate an AI summary for an article
 * @param articleId - The ID of the article
 * @param type - The type of summary (concise or extended)
 * @returns Promise resolving to the generated summary
 */
export async function generateSummary(
  articleId: string,
  type: SummaryType
): Promise<Summary> {
  // Implementation
}
```

### Vue Components

- Use **Composition API** with `<script setup>` syntax
- Use **composables** for reusable logic (e.g., `useStorage`, `useTheme`)
- Keep components focused and single-purpose
- Extract complex logic into separate utility functions

Example:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useStorage } from '@/composables/useStorage'

const { articles, loadArticles } = useStorage()
const isLoading = ref(false)

onMounted(async () => {
  isLoading.value = true
  await loadArticles()
  isLoading.value = false
})
</script>
```

### CSS

- Use **CSS variables** for theming (defined in `src/styles/variables.css`)
- Prefer scoped styles in components
- Follow existing color scheme for consistency

Example:

```css
.button {
  background: var(--primary-color);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}
```

### General Guidelines

- Keep commits small and focused
- Write descriptive commit messages
- No console statements in production code
- Handle errors gracefully (use try/catch)
- Test in both light and dark mode

---

## Pull Request Guidelines

### Before Submitting

1. Ensure type checks pass: `npm run type-check`
2. Test your changes thoroughly
3. Update documentation if behavior changes
4. Add comments for complex logic

### PR Requirements

- **Target branch**: `main`
- **Clear title and description**: Explain what and why
- **Link related issues**: Use "Fixes #123" or "Closes #456"
- **Keep PRs focused**: Large changes should be split into multiple PRs
- **No breaking changes** without discussion

### Commit Message Format

Use conventional commits format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, semicolons, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Build process, dependencies, tooling

**Examples:**

```
feat(ai): add Gemini TTS provider with voice selection

- Add voice configuration for Gemini TTS
- Update settings modal with voice dropdown
- Add voice preview functionality

Closes #42
```

```
fix(storage): prevent duplicate articles when saving

Check for existing URL before creating new article entry.

Fixes #38
```

---

## Building & Releases

### Manual Build

```bash
npm run build
```

Output in `dist/` directory includes:
- Manifest JSON
- Compiled JavaScript bundles
- HTML pages
- Assets and icons

### Automated Releases

The project uses GitHub Actions for automated releases:

1. Triggers on version tag push (e.g., `v1.0.0`)
2. Builds the extension
3. Creates a GitHub Release
4. Uploads the `dist/` folder as a build artifact
5. Generates release notes from commits

**To create a release:**

```bash
# Update version in package.json (patch, minor, or major)
npm version patch

# Push the tag
git push --follow-tags
```

The GitHub Action will automatically build and create a release!

### Versioning

We use [Semantic Versioning](https://semver.org/):

- **Major** (1.0.0): Breaking changes
- **Minor** (0.1.0): New features, backward compatible
- **Patch** (0.0.1): Bug fixes, backward compatible

---

## Troubleshooting

### Extension won't load

- Ensure `dist/` folder exists (run `npm run dev` or `npm run build`)
- Check for errors in `chrome://extensions/` (Developer mode enabled)
- Look for console errors in the extension popup/pages

### Hot Module Replacement not working

- Ensure dev server is running (`npm run dev`)
- Check terminal for Vite errors
- Try reloading the extension manually in `chrome://extensions/`

### Type check errors

- Run `npm run type-check` to see all errors
- Check for missing imports or incorrect types
- Ensure all enums are properly imported

### AI features not working in development

- Verify API keys are set in Settings
- Check browser console for API errors
- Ensure you have credits/quota with the AI provider
- Check network tab for failed requests

### Articles not saving

- Check IndexedDB in DevTools → Application → IndexedDB
- Verify content script is injecting properly
- Look for errors in background service worker console (`chrome://extensions/` → Service Worker)

### Build fails

- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- Delete `dist` folder and rebuild: `rm -rf dist && npm run build`
- Check for TypeScript errors: `npm run type-check`

---

## Testing Checklist

Before submitting a PR, test:

- [ ] Extension loads without errors
- [ ] Popup opens and displays correctly
- [ ] Manager dashboard loads all articles
- [ ] Saving articles works (all methods: popup, context menu)
- [ ] Categories and tags work correctly
- [ ] Search and filtering work
- [ ] Dark mode works correctly
- [ ] Settings save and persist
- [ ] AI features work (if applicable)
- [ ] No console errors or warnings

---

## Getting Help

- **Questions**: [Open a discussion](../../discussions)
- **Bug reports**: [Open an issue](../../issues)
- **Feature requests**: [Open a discussion](../../discussions) first

---

## Code of Conduct

Be respectful and inclusive. We expect all contributors to:

- Use welcoming and inclusive language
- Be respectful of differing viewpoints
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards other contributors

---

## Security

If you discover a security vulnerability, please **do not open a public issue**. Instead:

1. Email the maintainers directly (check repository for contact info)
2. Or create a [private security report](../../security/advisories/new)

We take security seriously and will respond promptly.

---

**Thank you for contributing to Quest!** 🎉
