<template>
  <div class="reader" v-if="article">
    <div class="reader__progress" :style="{ width: `${Math.round(reader.progress * 100)}%` }" />

    <header class="reader__bar">
      <button class="back" @click="close"><QIcon name="chevron-left" :size="16" /> Library</button>
      <span class="reader__status">{{ statusLabel }}</span>
      <a class="orig" :href="article.url.actual" target="_blank" rel="noopener">
        Original <QIcon name="external-link" :size="13" />
      </a>
    </header>

    <div class="reader__cols">
      <article ref="bodyEl" class="reader__article" @scroll="onScroll" @mouseup="onMouseUp">
        <div class="measure">
          <h1 class="title">{{ article.title }}</h1>
          <p class="byline">
            <span v-if="article.author">{{ article.author }}</span>
            <span v-if="article.author" class="dot">·</span>
            <span>{{ article.url.domain }}</span>
            <span class="dot">·</span>
            <span>{{ article.readingTimeMin }} min read</span>
          </p>

          <div v-if="blocks.length" class="prose">
            <p v-for="(block, i) in blocks" :key="i" :data-block="i" :class="{ 'prose__lead': i === 0 }">
              <template v-for="(seg, j) in segmentsFor(i, block)" :key="j">
                <mark v-if="seg.highlightId" class="hl">{{ seg.text }}</mark>
                <template v-else>{{ seg.text }}</template>
              </template>
            </p>
          </div>
          <p v-else class="empty">
            No saved text for this article. <a :href="article.url.actual" target="_blank" rel="noopener">Open the original ↗</a>
          </p>
        </div>
      </article>

      <aside class="rail">
        <p class="rail__label">Distill</p>

        <section class="card" :class="{ 'card--collapsed': !summaryOpen }">
          <div class="card__head" @click="summaryOpen = !summaryOpen">
            <span class="card__title">
              <QIcon name="chevron-right" :size="13" class="card__chev" :class="{ 'card__chev--open': summaryOpen }" />
              <h3><QIcon name="sparkles" :size="15" /> Summary</h3>
            </span>
            <QButton variant="quiet" size="sm" :loading="summaryBusy" @click.stop="genSummary">
              {{ primarySummary ? 'Regenerate' : 'Generate' }}
            </QButton>
          </div>
          <div v-show="summaryOpen" class="card__body">
            <template v-if="primarySummary">
              <div class="card__meta">
                <QTag accent>{{ primarySummary.provider }}</QTag>
                <span class="muted">{{ primarySummary.model }}</span>
              </div>
              <div class="summary-text" v-html="renderedSummary" />
            </template>
            <p v-else-if="!summaryBusy" class="card__empty">No summary yet.</p>
          </div>
        </section>

        <section class="card" :class="{ 'card--collapsed': !podcastOpen }">
          <div class="card__head" @click="podcastOpen = !podcastOpen">
            <span class="card__title">
              <QIcon name="chevron-right" :size="13" class="card__chev" :class="{ 'card__chev--open': podcastOpen }" />
              <h3><QIcon name="headphones" :size="15" /> Podcast</h3>
            </span>
            <QButton variant="quiet" size="sm" :loading="podcastBusy" @click.stop="genPodcast">
              {{ reader.audioFile ? 'Regenerate' : 'Generate' }}
            </QButton>
          </div>
          <div v-show="podcastOpen" class="card__body">
            <template v-if="reader.audioUrl && reader.audioFile">
              <div class="card__meta">
                <QTag accent>{{ reader.audioFile.provider }}</QTag>
                <span class="muted">{{ reader.audioFile.voiceId }}</span>
                <span class="muted">{{ formatTime(reader.audioFile.duration) }}</span>
              </div>
              <QAudioPlayer :src="reader.audioUrl" />
            </template>
            <p v-else-if="!podcastBusy" class="card__empty">No podcast yet.</p>
          </div>
        </section>

        <section class="card" :class="{ 'card--collapsed': !highlightsOpen }">
          <div class="card__head" @click="highlightsOpen = !highlightsOpen">
            <span class="card__title">
              <QIcon name="chevron-right" :size="13" class="card__chev" :class="{ 'card__chev--open': highlightsOpen }" />
              <h3>Highlights</h3>
            </span>
            <span class="count">{{ reader.highlights.length }}</span>
          </div>
          <div v-show="highlightsOpen" class="card__body">
            <p v-if="!reader.highlights.length" class="card__empty">Select text in the article to highlight it.</p>
            <div v-for="h in reader.highlights" :key="h.id" class="hl-item">
              <blockquote>{{ h.text }}</blockquote>
              <textarea
                class="hl-note"
                :value="h.note ?? ''"
                placeholder="Add a note…"
                rows="2"
                @change="onNote(h.id, $event)"
              />
              <button class="hl-del" @click="reader.removeHighlight(h.id)">Remove</button>
            </div>
          </div>
        </section>
      </aside>
    </div>

    <div v-if="selection" class="sel" :style="{ left: `${selection.x}px`, top: `${selection.y}px` }">
      <button @mousedown.prevent="createHighlight"><QIcon name="highlighter" :size="14" /> Highlight</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useReaderStore } from '@/stores/reader'
import { useUiStore } from '@/stores/ui'
import { summarizeArticle, generatePodcast } from '@/core/ai'
import { applyHighlights } from '@/core/reader/highlight-render'
import { markdownToHtml } from '@/core/markdown'
import { formatTime } from '@/core/format'
import { QButton, QTag, QIcon, QAudioPlayer } from '@/design/primitives'

const reader = useReaderStore()
const ui = useUiStore()
const emit = defineEmits<{ (e: 'close'): void }>()

const bodyEl = ref<HTMLElement | null>(null)
const summaryBusy = ref(false)
const podcastBusy = ref(false)
const summaryOpen = ref(true)
const podcastOpen = ref(true)
const highlightsOpen = ref(true)
const selection = ref<{ x: number; y: number } | null>(null)
let pending: { blockIndex: number; start: number; end: number; text: string } | null = null
let lastPersist = 0

// Reader is only mounted while an article is open (guarded by the parent),
// so this is non-null in practice; the `v-if` still gates rendering at runtime.
const article = computed(() => reader.article!)

const blocks = computed<string[]>(() => {
  const text = reader.article?.content.text?.trim() ?? ''
  return text ? text.split(/\n{2,}/).map((s) => s.trim()).filter(Boolean) : []
})

const primarySummary = computed(
  () => reader.summaries.find((s) => s.kind === 'concise') ?? reader.summaries[reader.summaries.length - 1] ?? null,
)
const renderedSummary = computed(() => markdownToHtml(primarySummary.value?.content ?? ''))

const statusLabel = computed(() => {
  const s = reader.article?.status
  if (s === 'read') return 'Read'
  if (s === 'reading') return `Reading · ${Math.round(reader.progress * 100)}%`
  return 'Unread'
})

function segmentsFor(index: number, text: string) {
  return applyHighlights(index, text, reader.highlights)
}

function onScroll(): void {
  const el = bodyEl.value
  if (!el) return
  const max = el.scrollHeight - el.clientHeight
  const progress = max > 0 ? el.scrollTop / max : 0
  selection.value = null
  const now = Date.now()
  if (now - lastPersist > 800) {
    lastPersist = now
    reader.setProgress(progress)
  }
}

function onMouseUp(): void {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || !bodyEl.value) {
    selection.value = null
    return
  }
  const text = sel.toString().trim()
  if (!text) {
    selection.value = null
    return
  }
  const range = sel.getRangeAt(0)
  const startEl = nodeElement(range.startContainer)?.closest('[data-block]') as HTMLElement | null
  const endEl = nodeElement(range.endContainer)?.closest('[data-block]') as HTMLElement | null
  if (!startEl || startEl !== endEl) {
    selection.value = null // only single-block highlights
    return
  }
  const pre = document.createRange()
  pre.selectNodeContents(startEl)
  pre.setEnd(range.startContainer, range.startOffset)
  const start = pre.toString().length
  pending = { blockIndex: Number(startEl.dataset.block), start, end: start + text.length, text }

  const rect = range.getBoundingClientRect()
  selection.value = { x: rect.left + rect.width / 2, y: rect.top - 8 }
}

function nodeElement(node: Node): Element | null {
  return node.nodeType === Node.TEXT_NODE ? node.parentElement : (node as Element)
}

async function createHighlight(): Promise<void> {
  if (!pending || !reader.article) return
  await reader.addHighlight({
    articleId: reader.article.id,
    text: pending.text,
    anchor: { blockIndex: pending.blockIndex, start: pending.start, end: pending.end },
  })
  selection.value = null
  pending = null
  window.getSelection()?.removeAllRanges()
}

function onNote(id: string, event: Event): void {
  reader.updateHighlightNote(id, (event.target as HTMLTextAreaElement).value)
}

function errMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Something went wrong'
}

async function genSummary(): Promise<void> {
  if (!reader.article) return
  summaryBusy.value = true
  try {
    await summarizeArticle(reader.article.id)
    await reader.open(reader.article.id)
    ui.success('Summary ready')
  } catch (error) {
    ui.error(errMessage(error))
  } finally {
    summaryBusy.value = false
  }
}

async function genPodcast(): Promise<void> {
  if (!reader.article) return
  podcastBusy.value = true
  try {
    ui.info('Generating podcast — this can take a moment…')
    await generatePodcast(reader.article.id)
    await reader.open(reader.article.id)
    ui.success('Podcast ready')
  } catch (error) {
    ui.error(errMessage(error))
  } finally {
    podcastBusy.value = false
  }
}

async function close(): Promise<void> {
  const el = bodyEl.value
  if (el) {
    const max = el.scrollHeight - el.clientHeight
    await reader.setProgress(max > 0 ? el.scrollTop / max : 1)
  }
  emit('close')
}
</script>

<style scoped>
.reader {
  position: fixed;
  inset: 0;
  z-index: var(--z-overlay);
  background: var(--paper);
  display: flex;
  flex-direction: column;
}
.reader__progress {
  position: absolute;
  top: 0;
  left: 0;
  height: 3px;
  background: var(--accent);
  transition: width 0.2s var(--ease-out);
  z-index: 2;
}
.reader__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--rule);
}
.back {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  border: 0;
  background: none;
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink-muted);
}
.back:hover {
  color: var(--accent);
}
.reader__status {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-faint);
}
.orig {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
}
.reader__cols {
  flex: 1;
  display: flex;
  min-height: 0;
}
.reader__article {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-8) var(--space-7) var(--space-12);
}
.measure {
  max-width: var(--measure);
  margin: 0 auto;
  animation: q-rise var(--dur-slow) var(--ease-out) backwards;
}
.title {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: var(--text-3xl);
  line-height: var(--leading-tight);
  letter-spacing: var(--tracking-tight);
  font-variation-settings: 'SOFT' 0, 'WONK' 1;
}
.byline {
  margin-top: var(--space-3);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.prose {
  margin-top: var(--space-6);
  font-family: var(--font-serif);
  font-size: var(--text-reading);
  line-height: var(--leading-relaxed);
  color: var(--ink);
}
.prose p {
  margin-bottom: 1.4rem;
}
.prose__lead::first-letter {
  initial-letter: 3;
  -webkit-initial-letter: 3;
  font-family: var(--font-display);
  font-weight: var(--weight-bold);
  color: var(--accent);
  margin-right: 0.6rem;
}
.hl {
  background: var(--highlight-tint);
  color: inherit;
  border-radius: 2px;
  padding: 0 1px;
}
.empty {
  margin-top: var(--space-6);
  color: var(--ink-muted);
  font-style: italic;
}
.rail {
  width: 340px;
  flex: none;
  border-left: 1px solid var(--rule);
  overflow-y: auto;
  padding: var(--space-6) var(--space-5);
  display: flex;
  flex-direction: column;
  gap: var(--space-5);
  animation: q-rise var(--dur-slow) var(--ease-out) 80ms backwards;
}
.rail__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
}
.card {
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  padding: var(--space-4);
}
.card__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  cursor: pointer;
  user-select: none;
}
.card--collapsed .card__head {
  margin-bottom: 0;
}
.card__title {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}
.card__chev {
  flex: none;
  color: var(--ink-faint);
  transition: transform var(--dur-fast) var(--ease-out);
}
.card__chev--open {
  transform: rotate(90deg);
}
.card__head h3 {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-family: var(--font-display);
  font-size: 1rem;
  font-weight: var(--weight-semibold);
}
.card__head h3 .q-icon {
  color: var(--accent);
}
.count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
.card__meta {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.muted {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
.card__empty {
  font-size: var(--text-sm);
  color: var(--ink-faint);
  font-style: italic;
}
.summary-text {
  font-size: var(--text-sm);
  line-height: var(--leading-normal);
  color: var(--ink);
}
.summary-text :deep(p) {
  margin-bottom: 0.7rem;
}
.summary-text :deep(strong) {
  font-weight: var(--weight-semibold);
}
.summary-text :deep(em) {
  font-style: italic;
}
.summary-text :deep(code) {
  font-family: var(--font-mono);
  font-size: 0.92em;
  background: var(--paper-sunken);
  padding: 0.05em 0.3em;
  border-radius: var(--radius-sm);
}
.summary-text :deep(ul),
.summary-text :deep(ol) {
  margin: 0 0 0.7rem 1.15rem;
}
.summary-text :deep(li) {
  margin-bottom: 0.3rem;
}
.summary-text :deep(h2),
.summary-text :deep(h3),
.summary-text :deep(h4) {
  font-family: var(--font-display);
  font-size: var(--text-md);
  margin: 0.5rem 0 0.3rem;
}
.summary-text :deep(a) {
  color: var(--accent);
}
.player {
  width: 100%;
}
.hl-item {
  border-top: 1px solid var(--rule);
  padding-top: 0.7rem;
  margin-top: 0.7rem;
}
.hl-item blockquote {
  border-left: 2px solid var(--highlight);
  padding-left: 0.6rem;
  font-size: var(--text-sm);
  color: var(--ink);
  font-style: italic;
}
.hl-note {
  width: 100%;
  margin-top: 0.4rem;
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--paper-sunken);
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 0.4rem 0.5rem;
  resize: vertical;
}
.hl-del {
  border: 0;
  background: none;
  color: var(--ink-faint);
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  cursor: pointer;
  margin-top: 0.3rem;
}
.hl-del:hover {
  color: var(--critical);
}
.sel {
  position: fixed;
  transform: translate(-50%, -100%);
  z-index: var(--z-palette);
}
.sel button {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  background: var(--ink);
  color: var(--paper);
  border: 0;
  border-radius: var(--radius);
  padding: 0.4rem 0.7rem;
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  cursor: pointer;
  box-shadow: var(--shadow);
}
.sel button:hover {
  background: var(--accent);
  color: var(--accent-ink);
}
.dot {
  color: var(--ink-faint);
}
</style>
