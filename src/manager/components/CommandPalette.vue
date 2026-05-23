<template>
  <Teleport to="body">
    <Transition name="palette">
      <div v-if="ui.commandPaletteOpen" class="palette" @click.self="ui.closeCommandPalette()">
        <div class="palette__panel" role="dialog" aria-modal="true">
          <div class="palette__search">
            <QIcon name="search" :size="18" class="palette__icon" />
            <input
              ref="input"
              v-model="query"
              class="palette__input"
              placeholder="Search articles or run a command…"
              @keydown.down.prevent="move(1)"
              @keydown.up.prevent="move(-1)"
              @keydown.enter.prevent="run(active)"
              @keydown.esc.prevent="ui.closeCommandPalette()"
            />
            <QKbd>esc</QKbd>
          </div>

          <ul class="palette__list">
            <li
              v-for="(item, i) in items"
              :key="item.key"
              class="palette__item"
              :class="{ 'is-active': i === activeIndex }"
              @mousemove="activeIndex = i"
              @click="run(item)"
            >
              <QIcon
                :name="item.kind === 'article' ? 'bookmark' : 'chevron-right'"
                :size="14"
                class="palette__kind"
                :class="`palette__kind--${item.kind}`"
              />
              <span class="palette__label">{{ item.label }}</span>
              <span v-if="item.hint" class="palette__hint">{{ item.hint }}</span>
            </li>
            <li v-if="!items.length" class="palette__empty">No matches</li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { QKbd, QIcon } from '@/design/primitives'
import type { LibraryView } from '@/stores/library'

const library = useLibraryStore()
const ui = useUiStore()
const { toggleTheme } = useTheme()

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'settings'): void
  (e: 'usage'): void
  (e: 'open', id: string): void
}>()

interface PaletteItem {
  key: string
  label: string
  hint?: string
  kind: 'command' | 'article'
  run: () => void
}

const input = ref<HTMLInputElement | null>(null)
const query = ref('')
const activeIndex = ref(0)

function goView(view: LibraryView, label: string): PaletteItem {
  return { key: `view-${view}`, label, hint: 'View', kind: 'command', run: () => library.setView(view) }
}

const commands = computed<PaletteItem[]>(() => [
  { key: 'new', label: 'Add article by URL', hint: 'Command', kind: 'command', run: () => emit('add') },
  { key: 'settings', label: 'Open settings', hint: 'Command', kind: 'command', run: () => emit('settings') },
  { key: 'usage', label: 'AI usage', hint: 'Command', kind: 'command', run: () => emit('usage') },
  { key: 'theme', label: 'Toggle ink mode', hint: 'Command', kind: 'command', run: () => toggleTheme() },
  goView('all', 'Go to All'),
  goView('unread', 'Go to Unread'),
  goView('reading', 'Go to Reading'),
  goView('favorites', 'Go to Favorites'),
  goView('archived', 'Go to Archive'),
])

const items = computed<PaletteItem[]>(() => {
  const q = query.value.trim().toLowerCase()
  const cmd = q ? commands.value.filter((c) => c.label.toLowerCase().includes(q)) : commands.value
  const articles: PaletteItem[] = q
    ? library.articles
        .filter((a) => a.title.toLowerCase().includes(q) || a.url.domain.toLowerCase().includes(q))
        .slice(0, 6)
        .map((a) => ({
          key: `art-${a.id}`,
          label: a.title,
          hint: a.url.domain,
          kind: 'article' as const,
          run: () => emit('open', a.id),
        }))
    : []
  return [...articles, ...cmd]
})

const active = computed(() => items.value[activeIndex.value])

function move(delta: number): void {
  if (!items.value.length) return
  activeIndex.value = (activeIndex.value + delta + items.value.length) % items.value.length
}

function run(item?: PaletteItem): void {
  if (!item) return
  item.run()
  ui.closeCommandPalette()
}

watch(
  () => ui.commandPaletteOpen,
  async (open) => {
    if (open) {
      query.value = ''
      activeIndex.value = 0
      await nextTick()
      input.value?.focus()
    }
  },
)

watch(query, () => {
  activeIndex.value = 0
})
</script>

<style scoped>
.palette {
  position: fixed;
  inset: 0;
  z-index: var(--z-palette);
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 14vh;
  background: var(--paper-overlay);
  backdrop-filter: blur(2px);
}
.palette__panel {
  width: min(560px, 92vw);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pop);
  overflow: hidden;
}
.palette__search {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--rule);
}
.palette__icon {
  color: var(--ink-faint);
  font-size: 1.1rem;
}
.palette__input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  font-family: var(--font-serif);
  font-size: var(--text-md);
  color: var(--ink);
}
.palette__list {
  list-style: none;
  max-height: 50vh;
  overflow-y: auto;
  padding: 0.4rem;
}
.palette__item {
  display: flex;
  align-items: baseline;
  gap: 0.7rem;
  padding: 0.55rem 0.7rem;
  border-radius: var(--radius);
  cursor: pointer;
}
.palette__item.is-active {
  background: var(--accent-tint);
}
.palette__kind {
  color: var(--ink-faint);
  font-family: var(--font-display);
  width: 1rem;
  flex: none;
}
.palette__kind--article {
  color: var(--accent);
}
.palette__label {
  flex: 1;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.palette__item.is-active .palette__label {
  color: var(--accent);
}
.palette__hint {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
  flex: none;
}
.palette__empty {
  padding: 1.2rem;
  text-align: center;
  color: var(--ink-faint);
  font-style: italic;
}
.palette-enter-active,
.palette-leave-active {
  transition: opacity var(--dur) var(--ease-out);
}
.palette-enter-active .palette__panel,
.palette-leave-active .palette__panel {
  transition: transform var(--dur) var(--ease-out);
}
.palette-enter-from,
.palette-leave-to {
  opacity: 0;
}
.palette-enter-from .palette__panel,
.palette-leave-to .palette__panel {
  transform: translateY(-10px) scale(0.98);
}
</style>
