<template>
  <div class="app" :class="{ 'q-reveal': revealing }">
    <!-- Reader takes over the surface when an article is open -->
    <Reader v-if="reader.article" @close="closeReader" />

    <template v-else>
      <AppHeader class="reveal-block" :style="{ '--i': 0 }" @add="showAdd = true" @settings="showSettings = true" @usage="openUsage" />

      <div class="app__main">
        <ContentsRail
          class="reveal-block"
          :style="{ '--i': 1 }"
          @new-category="openNewCategory"
          @edit-category="openEditCategory"
          @delete-category="handleDeleteCategory"
        />

        <main class="content reveal-block" :style="{ '--i': 2 }">
          <div class="page-head">
            <h2 class="page-head__title">{{ viewTitle }}</h2>
            <span class="page-head__count">{{ library.visible.length }} {{ library.visible.length === 1 ? 'entry' : 'entries' }}</span>
          </div>

          <div class="toolbar">
            <div class="toolbar__group">
              <div class="select select--sm">
                <select v-model="library.sort">
                  <option value="date-desc">Newest first</option>
                  <option value="date-asc">Oldest first</option>
                  <option value="title-asc">Title A–Z</option>
                  <option value="title-desc">Title Z–A</option>
                  <option value="domain-asc">Source</option>
                </select>
              </div>
              <div class="view-toggle">
                <button :class="{ on: viewMode === 'list' }" title="List" @click="viewMode = 'list'"><QIcon name="list" :size="16" /></button>
                <button :class="{ on: viewMode === 'grid' }" title="Grid" @click="viewMode = 'grid'"><QIcon name="grid" :size="16" /></button>
              </div>
              <QButton :variant="selectMode ? 'secondary' : 'ghost'" size="sm" @click="toggleSelect">
                {{ selectMode ? 'Cancel' : 'Select' }}
              </QButton>
            </div>
          </div>

          <div v-if="library.isLoading" class="state"><QSpinner size="lg" /></div>

          <div v-else-if="!library.visible.length" class="state state--empty">
            <QIcon name="book-open" :size="34" class="state__mark" />
            <p class="state__text">{{ emptyMessage }}</p>
          </div>

          <div v-else :class="viewMode === 'grid' ? 'grid' : 'list'">
            <EntryCard
              v-for="(article, index) in library.paged"
              :key="article.id"
              class="reveal-item"
              :style="{ '--i': index < 14 ? index : 14 }"
              :article="article"
              :view="viewMode"
              :selected="library.selection.has(article.id)"
              :select-mode="selectMode"
              @select="library.toggleSelect(article.id)"
              @action="(type) => handleAction(article, type)"
            />
          </div>

          <div v-if="library.pageCount > 1" class="pager">
            <QButton variant="ghost" size="sm" :disabled="library.page === 1" @click="library.goToPage(library.page - 1)">‹ Prev</QButton>
            <span class="pager__label">{{ library.page }} / {{ library.pageCount }}</span>
            <QButton variant="ghost" size="sm" :disabled="library.page === library.pageCount" @click="library.goToPage(library.page + 1)">Next ›</QButton>
          </div>
        </main>
      </div>

      <Transition name="bulkbar">
        <div v-if="selectMode" class="bulkbar">
          <span class="bulkbar__count">{{ library.selection.size }} selected</span>
          <span class="bulkbar__rule" />
          <button class="bulkbar__act" :disabled="!library.selection.size" @click="bulk('read')"><QIcon name="check" :size="15" /> Read</button>
          <button class="bulkbar__act" :disabled="!library.selection.size" @click="bulk('pin')"><QIcon name="star" :size="15" /> Pin</button>
          <button class="bulkbar__act" :disabled="!library.selection.size" @click="bulk('archive')"><QIcon name="archive" :size="15" /> Archive</button>
          <button class="bulkbar__act" :disabled="!library.selection.size" @click="bulk('group')"><QIcon name="sparkles" :size="15" /> Group</button>
          <button class="bulkbar__act bulkbar__act--danger" :disabled="!library.selection.size" @click="bulk('delete')"><QIcon name="trash" :size="15" /> Delete</button>
          <span class="bulkbar__rule" />
          <button class="bulkbar__done" @click="exitSelect">Done</button>
        </div>
      </Transition>
    </template>

    <CommandPalette @add="showAdd = true" @settings="showSettings = true" @usage="openUsage" @open="openArticleById" />
    <SettingsModal v-model:open="showSettings" />
    <CategoryEditor v-model:open="showCategory" :editing="editingCategory" @save="saveCategory" />

    <QModal v-model:open="showAdd" title="Add by URL" size="sm">
      <div class="add-form">
        <QField v-model="addUrl" label="URL" placeholder="https://…" type="url" />
        <QField v-model="addTitle" label="Title (optional)" placeholder="Article title" />
      </div>
      <template #footer>
        <QButton variant="ghost" @click="showAdd = false">Cancel</QButton>
        <QButton variant="primary" :disabled="!addUrl.trim()" @click="addByUrl">Add</QButton>
      </template>
    </QModal>

    <QModal v-model:open="showUsage" title="AI Usage" size="md">
      <div class="usage">
        <div class="usage__row"><span>Summaries</span><strong>{{ usage.totals.summaries }}</strong></div>
        <div class="usage__row"><span>Podcasts</span><strong>{{ usage.totals.podcasts }}</strong></div>
        <div class="usage__row"><span>Requests</span><strong>{{ usage.totals.requests }}</strong></div>
        <div class="usage__row"><span>Estimated cost</span><strong>${{ usage.totals.cost.toFixed(4) }}</strong></div>
      </div>
      <div v-if="usage.logs.length" class="activity">
        <p class="activity__title">Recent activity</p>
        <div v-for="log in usage.logs.slice(0, 10)" :key="log.id" class="activity__row">
          <span class="activity__what">{{ log.action === 'generate_podcast' ? 'Podcast' : 'Summary' }}</span>
          <span class="activity__prov">{{ log.provider }}</span>
          <span class="activity__when">{{ formatDateTime(log.timestamp) }}</span>
          <QIcon :name="log.success ? 'check' : 'x'" :size="13" class="activity__status" :class="{ 'activity__status--ok': log.success }" />
        </div>
      </div>
      <template #footer>
        <QButton variant="primary" @click="showUsage = false">Done</QButton>
      </template>
    </QModal>

    <QModal v-model:open="showConfirm" title="Delete article" size="sm">
      <p class="confirm">This article and its summaries, podcast and highlights will be permanently removed.</p>
      <template #footer>
        <QButton variant="ghost" @click="showConfirm = false">Cancel</QButton>
        <QButton variant="danger" @click="confirmDeleteArticle">Delete</QButton>
      </template>
    </QModal>

    <QModal v-model:open="showConfirmCat" title="Delete shelf" size="sm">
      <p class="confirm">Delete the shelf “{{ confirmCategory?.name }}”? Articles are not deleted.</p>
      <template #footer>
        <QButton variant="ghost" @click="showConfirmCat = false">Cancel</QButton>
        <QButton variant="danger" @click="confirmDeleteCategory">Delete</QButton>
      </template>
    </QModal>

    <QToastHost />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { useUiStore } from '@/stores/ui'
import { useAiUsageStore } from '@/stores/ai-usage'
import { useReaderStore } from '@/stores/reader'
import { useTheme } from '@/composables/useTheme'
import type { Article, Category } from '@/core/db'
import { normalizeUrl, formatDateTime } from '@/core/format'
import { groupArticle } from '@/core/ai'
import AppHeader from './components/AppHeader.vue'
import ContentsRail from './components/ContentsRail.vue'
import EntryCard from './components/EntryCard.vue'
import CommandPalette from './components/CommandPalette.vue'
import CategoryEditor from './components/CategoryEditor.vue'
import SettingsModal from './components/SettingsModal.vue'
import Reader from './components/Reader.vue'
import { QButton, QModal, QField, QSpinner, QToastHost, QIcon } from '@/design/primitives'

type EntryAction = 'open' | 'pin' | 'archive' | 'delete'

const library = useLibraryStore()
const ui = useUiStore()
const usage = useAiUsageStore()
const reader = useReaderStore()
useTheme()

const viewMode = ref<'list' | 'grid'>('list')
const selectMode = ref(false)
const revealing = ref(true) // one-shot load-in; cleared so filtering stays instant

const showSettings = ref(false)
const showCategory = ref(false)
const showAdd = ref(false)
const showUsage = ref(false)
const showConfirm = ref(false)
const showConfirmCat = ref(false)

const editingCategory = ref<Category | null>(null)
const confirmCategory = ref<Category | null>(null)
const confirmArticleId = ref<string | null>(null)

const addUrl = ref('')
const addTitle = ref('')

const viewTitle = computed(() => {
  switch (library.view) {
    case 'unread':
      return 'Reading List'
    case 'reading':
      return 'Currently Reading'
    case 'favorites':
      return 'Favorites'
    case 'archived':
      return 'Archive'
    case 'category':
      return library.categories.find((c) => c.id === library.activeKey)?.name ?? 'Shelf'
    case 'tag':
      return `#${library.activeKey}`
    case 'source':
      return library.activeKey
    default:
      return 'All Articles'
  }
})

const emptyMessage = computed(() => {
  if (library.search) return 'Nothing matches your search.'
  if (library.view === 'unread') return 'All caught up — no unread articles.'
  if (library.view === 'favorites') return 'Star an article to keep it close.'
  if (library.view === 'archived') return 'The archive is empty.'
  return 'Save your first article from the toolbar popup.'
})

async function openInReader(article: Article): Promise<void> {
  if (article.status === 'unread') await library.setStatus(article.id, 'reading')
  await reader.open(article.id)
}
async function openArticleById(id: string): Promise<void> {
  const article = library.articles.find((a) => a.id === id)
  if (article) await openInReader(article)
}
async function closeReader(): Promise<void> {
  reader.close()
  await library.load()
}

function enterSelect(): void {
  selectMode.value = true
  library.clearSelection()
}
function exitSelect(): void {
  selectMode.value = false
  library.clearSelection()
}
function toggleSelect(): void {
  if (selectMode.value) exitSelect()
  else enterSelect()
}
async function bulk(action: 'read' | 'pin' | 'archive' | 'delete' | 'group'): Promise<void> {
  const ids = Array.from(library.selection)
  if (!ids.length) return

  if (action === 'group') {
    ui.info('Grouping with AI…')
    let grouped = 0
    for (const id of ids) {
      try {
        await groupArticle(id)
        grouped++
      } catch (err) {
        ui.error(err instanceof Error ? err.message : 'Grouping failed')
        break
      }
    }
    await library.load()
    if (grouped) ui.success(`Grouped ${grouped} ${grouped === 1 ? 'entry' : 'entries'}`)
    exitSelect()
    return
  }

  for (const id of ids) {
    if (action === 'read') await library.setStatus(id, 'read')
    else if (action === 'pin') await library.togglePin(id)
    else if (action === 'archive') await library.patchArticle(id, { status: 'archived' })
    else if (action === 'delete') await library.remove(id)
  }
  ui.success(`${action} applied to ${ids.length} ${ids.length === 1 ? 'entry' : 'entries'}`)
  exitSelect()
}

async function handleAction(article: Article, type: EntryAction): Promise<void> {
  switch (type) {
    case 'open':
      return openInReader(article)
    case 'pin':
      await library.togglePin(article.id)
      return
    case 'archive':
      await library.patchArticle(article.id, { status: article.status === 'archived' ? 'unread' : 'archived' })
      return
    case 'delete':
      confirmArticleId.value = article.id
      showConfirm.value = true
      return
  }
}

async function addByUrl(): Promise<void> {
  const url = addUrl.value.trim()
  if (!url) return
  try {
    await library.addArticle({
      url: { actual: url, clean: normalizeUrl(url) },
      title: addTitle.value.trim() || url,
      content: { text: '', format: 'text' },
    })
    ui.success('Added to library')
    addUrl.value = ''
    addTitle.value = ''
    showAdd.value = false
  } catch (err) {
    ui.error(err instanceof Error ? err.message : 'Failed to add')
  }
}

function openNewCategory(): void {
  editingCategory.value = null
  showCategory.value = true
}
function openEditCategory(category: Category): void {
  editingCategory.value = category
  showCategory.value = true
}
async function saveCategory(payload: { id?: string; name: string; color: string }): Promise<void> {
  try {
    if (payload.id) await library.updateCategory({ id: payload.id, name: payload.name, color: payload.color })
    else await library.createCategory(payload.name, payload.color)
    ui.success('Shelf saved')
  } catch {
    ui.error('Could not save shelf')
  }
}
function handleDeleteCategory(category: Category): void {
  if (library.categoryCount(category.id) > 0) {
    ui.error('Move or remove its articles first')
    return
  }
  confirmCategory.value = category
  showConfirmCat.value = true
}
async function confirmDeleteCategory(): Promise<void> {
  if (!confirmCategory.value) return
  await library.deleteCategory(confirmCategory.value.id)
  ui.success('Shelf deleted')
  showConfirmCat.value = false
  confirmCategory.value = null
}

async function confirmDeleteArticle(): Promise<void> {
  if (!confirmArticleId.value) return
  await library.remove(confirmArticleId.value)
  ui.success('Article deleted')
  showConfirm.value = false
  confirmArticleId.value = null
}

async function openUsage(): Promise<void> {
  await usage.load()
  showUsage.value = true
}

async function seedDefaultCategories(): Promise<void> {
  if (library.categories.length) return
  const defaults: [string, string][] = [
    ['Essays', '#b23a2e'],
    ['Development', '#3c6478'],
    ['Research', '#7c5a9e'],
    ['News', '#b9802a'],
  ]
  for (const [name, color] of defaults) await library.createCategory(name, color)
}

function onKeydown(e: KeyboardEvent): void {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault()
    ui.toggleCommandPalette()
  }
}

onMounted(async () => {
  await library.load()
  await seedDefaultCategories()
  window.addEventListener('keydown', onKeydown)
  window.setTimeout(() => (revealing.value = false), 1500)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<style>
html,
body {
  height: 100%;
}
#app {
  height: 100vh;
}
</style>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app__main {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* One-shot orchestrated load-in (see base.css @keyframes q-rise). */
.q-reveal .reveal-block {
  animation: q-rise var(--dur-slow) var(--ease-out) backwards;
  animation-delay: calc(var(--i, 0) * 70ms);
}
.q-reveal .reveal-item {
  animation: q-rise var(--dur) var(--ease-out) backwards;
  animation-delay: calc(120ms + var(--stagger) * var(--i, 0));
}
.content {
  flex: 1;
  overflow-y: auto;
  padding: var(--space-5) var(--space-7);
  max-width: 1100px;
  width: 100%;
  margin: 0 auto;
}
.page-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: var(--space-3);
}
.page-head__title {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: var(--text-2xl);
  letter-spacing: var(--tracking-tight);
}
.page-head__count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-faint);
}
.toolbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: var(--space-2) 0 var(--space-4);
  border-bottom: 1px solid var(--rule);
  margin-bottom: var(--space-4);
}
.toolbar__group {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.toolbar__bulk {
  width: 100%;
  justify-content: space-between;
}
.bulk__count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  text-transform: uppercase;
  letter-spacing: var(--tracking-wide);
  color: var(--ink-muted);
}
.select {
  position: relative;
}
.select select {
  appearance: none;
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.35rem 1.8rem 0.35rem 0.6rem;
  cursor: pointer;
}
.select::after {
  content: '▾';
  position: absolute;
  right: 0.6rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-faint);
  pointer-events: none;
}
.view-toggle {
  display: flex;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  overflow: hidden;
}
.view-toggle button {
  border: 0;
  background: var(--paper-raised);
  color: var(--ink-muted);
  padding: 0.3rem 0.55rem;
  cursor: pointer;
}
.view-toggle button.on {
  background: var(--accent-tint);
  color: var(--accent);
}

/* Floating bulk-action bar */
.bulkbar {
  position: fixed;
  left: 50%;
  bottom: var(--space-5);
  transform: translateX(-50%);
  z-index: var(--z-nav);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.5rem 0.4rem 0.9rem;
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-full);
  box-shadow: var(--shadow-lg);
}
.bulkbar__count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-muted);
  white-space: nowrap;
}
.bulkbar__rule {
  width: 1px;
  height: 20px;
  background: var(--rule);
}
.bulkbar__act {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: 0;
  background: none;
  color: var(--ink);
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  padding: 0.35rem 0.65rem;
  border-radius: var(--radius);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.bulkbar__act:hover:not(:disabled) {
  background: var(--accent-tint);
  color: var(--accent);
}
.bulkbar__act:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.bulkbar__act--danger:hover:not(:disabled) {
  background: color-mix(in srgb, var(--critical) 14%, transparent);
  color: var(--critical);
}
.bulkbar__done {
  border: 0;
  background: var(--accent);
  color: var(--accent-ink);
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-full);
  cursor: pointer;
}
.bulkbar-enter-active,
.bulkbar-leave-active {
  transition: opacity var(--dur) var(--ease-out), transform var(--dur) var(--ease-out);
}
.bulkbar-enter-from,
.bulkbar-leave-to {
  opacity: 0;
  transform: translate(-50%, 12px);
}
.list {
  display: flex;
  flex-direction: column;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: var(--space-4);
}
.state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
  padding: var(--space-12) 0;
}
.state__mark {
  color: var(--accent);
}
.state__text {
  color: var(--ink-muted);
  font-style: italic;
}
.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: var(--space-5) 0;
}
.pager__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
}
.add-form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.usage {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.usage__row {
  display: flex;
  justify-content: space-between;
  padding: 0.4rem 0;
  border-bottom: 1px solid var(--rule);
  font-size: var(--text-base);
}
.usage__row span {
  color: var(--ink-muted);
}
.usage__row strong {
  font-family: var(--font-mono);
}
.activity {
  margin-top: var(--space-5);
}
.activity__title {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 0.5rem;
}
.activity__row {
  display: grid;
  grid-template-columns: 1fr auto auto 1.2rem;
  gap: 0.6rem;
  align-items: baseline;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--rule);
  font-size: var(--text-sm);
}
.activity__prov,
.activity__when {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
.activity__status {
  color: var(--critical);
  text-align: center;
}
.activity__status--ok {
  color: var(--positive);
}
.confirm {
  color: var(--ink-muted);
  line-height: var(--leading-normal);
}
</style>
