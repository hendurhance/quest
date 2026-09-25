<template>
  <div class="capture">
    <header class="masthead">
      <div class="wordmark">
        <QIcon name="bookmark" :size="18" class="wordmark__mark" />
        <span class="wordmark__name">Quest</span>
      </div>
      <div class="masthead__actions">
        <button class="icon-btn" :title="theme === 'dark' ? 'Light mode' : 'Ink mode'" @click="toggleTheme">
          <QIcon :name="theme === 'dark' ? 'sun' : 'moon'" :size="16" />
        </button>
        <button class="icon-btn" title="Open library" @click="openQuest()">
          <QIcon name="book-open" :size="16" />
        </button>
      </div>
    </header>

    <section class="page-card">
      <img v-if="page.favicon" class="page-card__favicon" :src="page.favicon" alt="" />
      <div class="page-card__head">
        <h1 class="page-card__title" :title="page.title">{{ page.title }}</h1>
        <p class="page-card__meta">
          <span class="page-card__domain">{{ page.domain || '—' }}</span>
          <template v-if="canSave">
            <span class="dot">·</span>
            <span>{{ page.readingTime }}</span>
          </template>
        </p>
      </div>
    </section>

    <p v-if="page.url && !canSave" class="notice">Quest can only save web pages. Browser and extension pages can’t be saved.</p>

    <section v-else-if="savedId" class="saved">
      <QIcon name="check" :size="26" class="saved__mark" />
      <p class="saved__text">{{ justSaved ? 'Saved to your library.' : 'Already in your library.' }}</p>
      <QButton variant="secondary" size="md" @click="openQuest(`article=${savedId}`)">Open in Quest</QButton>
    </section>

    <template v-else>
      <section class="form">
        <div class="field">
          <span class="field__label">Tags</span>
          <div class="tags-input" :class="{ 'is-focused': tagFocused }" @click="tagField?.focus()">
            <div
              v-if="tags.length"
              ref="tagTrack"
              class="x-scroll"
              :class="{ 'fade-l': tagEdges.left, 'fade-r': tagEdges.right }"
              @wheel="wheelToX"
              @scroll="updateTagEdges"
            >
              <QTag v-for="t in tags" :key="t" removable @remove="removeTag(t)">{{ t }}</QTag>
            </div>
            <input
              ref="tagField"
              v-model="tagInput"
              class="tags-input__field"
              :placeholder="tags.length ? 'Add another…' : 'Add tags, comma-separated'"
              @keydown="onTagKey"
              @paste="onTagPaste"
              @focus="tagFocused = true"
              @blur="tagFocused = false"
            />
          </div>
          <div v-if="suggestions.length" class="x-scroll suggestions" @wheel="wheelToX">
            <button v-for="s in suggestions" :key="s" class="suggestion" type="button" @mousedown.prevent="addTags(s)">
              + {{ s }}
            </button>
          </div>
        </div>

        <label class="field">
          <span class="field__label">Shelf</span>
          <span class="select">
            <select v-model="categoryId">
              <option value="">Uncategorized</option>
              <option v-for="c in library.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </span>
        </label>

        <div class="toggles">
          <!-- Explicit `for`: the label also contains the "Set up" button. -->
          <label class="toggle" :class="{ 'is-off': !ai.summary }" for="toggle-summary">
            <span class="toggle__text">AI summary on save</span>
            <button v-if="!ai.summary" class="toggle__setup" type="button" @click.prevent="openQuest('settings=1')">Set up</button>
            <QSwitch id="toggle-summary" v-model="generateSummary" :disabled="!ai.summary" />
          </label>
          <label class="toggle" :class="{ 'is-off': !ai.podcast }" for="toggle-podcast">
            <span class="toggle__text">Generate podcast</span>
            <button v-if="!ai.podcast" class="toggle__setup" type="button" @click.prevent="openQuest('settings=1')">Set up</button>
            <QSwitch id="toggle-podcast" v-model="generatePodcast" :disabled="!ai.podcast" />
          </label>
          <label class="toggle">
            <span class="toggle__text">Close tab after saving</span>
            <QSwitch v-model="closeTabAfterSave" />
          </label>
        </div>
      </section>

      <div class="save-bar">
        <QButton variant="primary" size="lg" block :loading="isSaving" :disabled="!page.url" @click="save">
          {{ isSaving ? 'Saving…' : 'Save to Quest' }}
        </QButton>
        <p class="save-bar__hint"><QKbd>{{ modKey }}</QKbd><QKbd>↵</QKbd> to save</p>
      </div>
    </template>

    <footer class="footer">
      <p class="footer__stats">
        <strong>{{ library.stats.total }}</strong> saved
        <span class="dot">·</span>
        <strong>{{ library.stats.unread }}</strong> unread
      </p>
      <ul v-if="recent.length" class="recent">
        <li v-for="a in recent" :key="a.id">
          <button class="recent__item" type="button" @click="openArticle(a.url.actual)">
            <span class="recent__title">{{ a.title }}</span>
            <span class="recent__when">{{ formatRelativeTime(a.createdAt) }}</span>
          </button>
        </li>
      </ul>
    </footer>

    <QToastHost />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { sendMessage } from '@/core/messaging/bus'
import { normalizeUrl, formatRelativeTime } from '@/core/format'
import { aiReadiness } from '@/core/ai/config'
import { db } from '@/core/db'
import { AIProvider, SummaryType } from '@/types'
import type { NewArticle } from '@/core/db'
import { QButton, QTag, QToastHost, QIcon, QSwitch, QKbd } from '@/design/primitives'

const library = useLibraryStore()
const settings = useSettingsStore()
const ui = useUiStore()
const { theme, toggleTheme } = useTheme()

const page = ref({ title: 'Loading…', url: '', domain: '', favicon: '', readingTime: 'Estimating…', wordCount: 0 })
const tags = ref<string[]>([])
const tagInput = ref('')
const tagFocused = ref(false)
const tagField = ref<HTMLInputElement | null>(null)
const tagTrack = ref<HTMLElement | null>(null)
const tagEdges = reactive({ left: false, right: false })
const categoryId = ref('')
const generateSummary = ref(false)
const generatePodcast = ref(false)
const closeTabAfterSave = ref(true)
const ai = reactive({ summary: false, podcast: false })
const isSaving = ref(false)
const savedId = ref<string | null>(null)
const justSaved = ref(false)
let activeTabId: number | undefined

const modKey = navigator.platform.toLowerCase().includes('mac') ? '⌘' : 'Ctrl'
const canSave = computed(() => /^https?:/.test(page.value.url))

const recent = computed(() =>
  library.articles
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3),
)

const suggestions = computed(() => {
  const q = tagInput.value.trim().toLowerCase()
  return library.popularTags
    .map((t) => t.name)
    .filter((name) => !tags.value.includes(name) && (!q || name.toLowerCase().includes(q)))
    .slice(0, 8)
})

function safeDomain(url?: string): string {
  try {
    return new URL(url ?? '').hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

function wheelToX(e: WheelEvent): void {
  const el = e.currentTarget as HTMLElement
  if (el.scrollWidth <= el.clientWidth || Math.abs(e.deltaX) > Math.abs(e.deltaY)) return
  e.preventDefault()
  el.scrollLeft += e.deltaY
}

function updateTagEdges(): void {
  const el = tagTrack.value
  tagEdges.left = !!el && el.scrollLeft > 1
  tagEdges.right = !!el && el.scrollLeft + el.clientWidth < el.scrollWidth - 1
}

watch(tags, async (next, prev) => {
  await nextTick()
  if (tagTrack.value && next.length > (prev?.length ?? 0)) tagTrack.value.scrollLeft = tagTrack.value.scrollWidth
  updateTagEdges()
})

function addTags(value: string): void {
  const incoming = value
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter((t) => t && !tags.value.includes(t))
  if (incoming.length) tags.value = [...tags.value, ...new Set(incoming)]
  tagInput.value = ''
}

function onTagKey(e: KeyboardEvent): void {
  if ((e.key === 'Enter' || e.key === ',') && !(e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    addTags(tagInput.value)
  } else if (e.key === 'Backspace' && !tagInput.value && tags.value.length) {
    tags.value = tags.value.slice(0, -1)
  }
}

function onTagPaste(e: ClipboardEvent): void {
  const text = e.clipboardData?.getData('text') ?? ''
  if (!text.includes(',')) return
  e.preventDefault()
  addTags(tagInput.value + text)
}

function removeTag(tag: string): void {
  tags.value = tags.value.filter((t) => t !== tag)
}

function estimateReadingTime(tabId: number): void {
  const timeout = setTimeout(() => {
    page.value.readingTime = '~ 5 min read'
  }, 2000)
  chrome.tabs.sendMessage(tabId, { action: 'getWordCount' }, (response) => {
    clearTimeout(timeout)
    if (chrome.runtime.lastError || !response?.wordCount) {
      page.value.readingTime = '~ 5 min read'
      return
    }
    page.value.wordCount = response.wordCount
    page.value.readingTime = `~ ${Math.max(1, Math.ceil(response.wordCount / 200))} min read`
  })
}

async function extractContent(tabId: number): Promise<string> {
  let csText = ''
  // 1) Ask the content script (best extraction — JSON-LD, semantic HTML, …).
  try {
    const response = await chrome.tabs.sendMessage(tabId, { action: 'extractContent' })
    const c = response?.content
    csText = (c && typeof c === 'object' ? c.content : typeof c === 'string' ? c : '') || ''
  } catch {
    // content script not present on this tab — fall through to injection
  }
  if (csText.trim().length >= 200) return csText

  // 2) Inject a one-off extractor and keep whichever yields more text. Works
  //    even when the content script never loaded, and rescues pages where the
  //    content script only found a short snippet.
  try {
    const [injected] = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const root = document.querySelector('article') || document.querySelector('main') || document.body
        if (!root) return ''
        const blocks = Array.from(root.querySelectorAll('p, h1, h2, h3, h4, li, blockquote, pre'))
          .map((node) => (node.textContent || '').trim())
          .filter((t) => t.length > 0)
        return blocks.length ? blocks.join('\n\n') : (root as HTMLElement).innerText || ''
      },
    })
    const injText = (injected?.result as string) || ''
    return injText.length > csText.length ? injText : csText
  } catch {
    return csText
  }
}

async function save(): Promise<void> {
  if (isSaving.value || savedId.value || !canSave.value) return
  addTags(tagInput.value) // keep a tag that was typed but not yet committed
  isSaving.value = true
  try {
    const text = activeTabId ? await extractContent(activeTabId) : ''
    const input: NewArticle = {
      url: { actual: page.value.url, clean: normalizeUrl(page.value.url) },
      title: page.value.title,
      favicon: page.value.favicon || undefined,
      content: { text, format: 'text', wordCount: page.value.wordCount },
      categoryId: categoryId.value || undefined,
      tags: tags.value,
    }

    const article = await library.addArticle(input)
    savedId.value = article.id
    justSaved.value = true

    if (generateSummary.value) {
      sendMessage({
        action: 'generateSummary',
        articleId: article.id,
        type: SummaryType.CONCISE,
        provider: settings.settings?.summaryProvider ?? AIProvider.GEMINI,
      }).catch(() => {})
    }
    if (generatePodcast.value) {
      sendMessage({ action: 'generatePodcast', articleId: article.id }).catch(() => {})
    }
    if (settings.settings?.autoGroup && ai.summary) {
      sendMessage({ action: 'groupArticle', articleId: article.id }).catch(() => {})
    }
    sendMessage({ action: 'articleSaved', article }).catch(() => {})

    if (closeTabAfterSave.value && activeTabId !== undefined) {
      setTimeout(() => activeTabId !== undefined && chrome.tabs.remove(activeTabId), 350)
    }
  } catch (err) {
    ui.error(err instanceof Error ? err.message : 'Failed to save')
  } finally {
    isSaving.value = false
  }
}

function openArticle(url: string): void {
  chrome.tabs.create({ url })
}

function openQuest(query?: string): void {
  const url = chrome.runtime.getURL('src/manager/index.html')
  chrome.tabs.create({ url: query ? `${url}?${query}` : url })
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault()
    void save()
  }
}

watch(closeTabAfterSave, (value) => {
  if (settings.loaded && value !== settings.settings?.closeTabAfterSave) void settings.update({ closeTabAfterSave: value })
})

async function loadTab(): Promise<void> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tab) return
  activeTabId = tab.id
  page.value = {
    title: tab.title || 'Untitled',
    url: tab.url || '',
    domain: safeDomain(tab.url),
    favicon: tab.favIconUrl || '',
    readingTime: 'Estimating…',
    wordCount: 0,
  }
  if (!canSave.value) return
  if (tab.id !== undefined) estimateReadingTime(tab.id)
  await db.init()
  savedId.value = (await db.articles.getByCleanUrl(normalizeUrl(page.value.url)))?.id ?? null
  if (!savedId.value) {
    await nextTick()
    tagField.value?.focus()
  }
}

async function loadPreferences(): Promise<void> {
  await settings.load()
  const ready = await aiReadiness()
  Object.assign(ai, ready)
  generateSummary.value = ready.summary && (settings.settings?.autoSummary ?? false)
  generatePodcast.value = ready.podcast && (settings.settings?.autoPodcast ?? false)
  closeTabAfterSave.value = settings.settings?.closeTabAfterSave ?? true
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
  void Promise.all([loadTab(), loadPreferences(), library.load()])
})

onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.capture {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4) var(--space-5) 0;
}

.masthead {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.wordmark {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}
.wordmark__mark {
  color: var(--accent);
}
.wordmark__name {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: 1.4rem;
  letter-spacing: var(--tracking-tight);
}
.masthead__actions {
  display: flex;
  gap: 0.25rem;
}
.icon-btn {
  width: 32px;
  height: 32px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--rule);
  background: var(--paper-raised);
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--ink-muted);
  transition: border-color var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.icon-btn:hover {
  border-color: var(--rule-strong);
  color: var(--accent);
}

.page-card {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  padding: var(--space-3) var(--space-4);
}
.page-card__favicon {
  width: 20px;
  height: 20px;
  border-radius: var(--radius-sm);
  flex: none;
  margin-top: 2px;
}
.page-card__head {
  min-width: 0;
}
.page-card__title {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: 1.05rem;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.page-card__meta {
  margin-top: 0.3rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
  display: flex;
  gap: 0.4rem;
  align-items: center;
  white-space: nowrap;
}
.page-card__domain {
  overflow: hidden;
  text-overflow: ellipsis;
}

.notice {
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-style: italic;
  line-height: var(--leading-normal);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-width: 0;
}
.field__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-muted);
}

.tags-input {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  background: var(--paper-raised);
  padding: 0.4rem 0.5rem;
  cursor: text;
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.tags-input.is-focused {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}
.tags-input__field {
  flex: 1 0 96px;
  min-width: 96px;
  border: 0;
  outline: none;
  background: transparent;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
  padding: 0.1rem 0;
}
.tags-input__field::placeholder {
  color: var(--ink-faint);
}

/* One-line chip rows: scroll sideways instead of wrapping and growing the popup. */
.x-scroll {
  display: flex;
  gap: 0.3rem;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
}
.x-scroll::-webkit-scrollbar {
  display: none;
}
.x-scroll > * {
  flex: none;
}
.fade-l {
  mask-image: linear-gradient(to right, transparent, #000 18px);
}
.fade-r {
  mask-image: linear-gradient(to left, transparent, #000 18px);
}
.fade-l.fade-r {
  mask-image: linear-gradient(to right, transparent, #000 18px, #000 calc(100% - 18px), transparent);
}

.suggestion {
  border: 1px dashed var(--rule-strong);
  background: none;
  border-radius: var(--radius-full);
  padding: 0.15rem 0.5rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
  cursor: pointer;
  white-space: nowrap;
}
.suggestion:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.select {
  position: relative;
  display: block;
}
.select select {
  width: 100%;
  appearance: none;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.5rem 2rem 0.5rem 0.7rem;
  cursor: pointer;
}
.select::after {
  content: '▾';
  position: absolute;
  right: 0.7rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-faint);
  pointer-events: none;
}

.toggles {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
}
.toggle__text {
  flex: 1;
  font-size: var(--text-base);
  color: var(--ink);
}
.toggle.is-off {
  cursor: default;
}
.toggle.is-off .toggle__text {
  color: var(--ink-faint);
}
.toggle__setup {
  border: 0;
  background: none;
  padding: 0;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--accent);
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

/* Stays in view when the form is taller than the popup (Chrome caps it at 600px). */
.save-bar {
  position: sticky;
  bottom: 0;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: calc(var(--space-2) * -1) calc(var(--space-5) * -1) 0;
  padding: var(--space-3) var(--space-5);
  background-color: var(--paper);
  background-image: var(--grain);
  border-top: 1px solid transparent;
}
.save-bar__hint {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.2rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}

.saved {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
  padding: var(--space-3) 0;
  text-align: center;
}
.saved__mark {
  color: var(--accent);
}
.saved__text {
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--ink);
}

.footer {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: var(--space-3) 0 var(--space-4);
  border-top: 1px solid var(--rule);
}
.footer__stats {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
}
.footer__stats strong {
  color: var(--ink);
}
.recent {
  list-style: none;
  display: flex;
  flex-direction: column;
}
.recent__item {
  width: 100%;
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
  align-items: baseline;
  padding: 0.4rem 0;
  border: 0;
  border-top: 1px solid var(--rule);
  background: none;
  text-align: left;
  cursor: pointer;
}
.recent__item:hover .recent__title {
  color: var(--accent);
}
.recent__title {
  font-size: var(--text-sm);
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.recent__when {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
  flex: none;
}
.dot {
  color: var(--ink-faint);
}
</style>

<style>
body {
  width: 380px;
}
</style>
