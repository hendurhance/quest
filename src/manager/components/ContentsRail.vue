<template>
  <aside class="rail" :class="{ 'is-open': open }">
    <nav class="section">
      <p class="section__label">Contents</p>
      <button
        v-for="item in views"
        :key="item.view"
        class="row"
        :class="{ 'row--active': library.view === item.view }"
        @click="go(item.view)"
      >
        <span class="row__name">{{ item.label }}</span>
        <span class="row__count">{{ item.count }}</span>
      </button>
    </nav>

    <nav class="section">
      <div class="section__head">
        <p class="section__label">Shelves</p>
        <button class="add" title="New shelf" @click="emit('new-category')"><QIcon name="plus" :size="15" /></button>
      </div>
      <p v-if="!library.categories.length" class="empty">No shelves yet</p>
      <div
        v-for="c in library.categories"
        :key="c.id"
        class="row row--shelf"
        :class="{ 'row--active': library.view === 'category' && library.activeKey === c.id }"
        role="button"
        tabindex="0"
        @click="go('category', c.id)"
        @keydown.enter.self="go('category', c.id)"
      >
        <span class="swatch" :style="{ background: c.color }" />
        <span class="row__name">{{ c.name }}</span>
        <span class="row__count">{{ library.categoryCount(c.id) }}</span>
        <span class="row__tools">
          <button title="Edit" @click.stop="emit('edit-category', c)"><QIcon name="pencil" :size="13" /></button>
          <button title="Delete" @click.stop="emit('delete-category', c)"><QIcon name="x" :size="13" /></button>
        </span>
      </div>
    </nav>

    <nav v-if="library.popularTags.length" class="section">
      <p class="section__label">Tags</p>
      <div class="chips">
        <button
          v-for="t in library.popularTags"
          :key="t.name"
          class="chip"
          :class="{ 'chip--active': library.view === 'tag' && library.activeKey === t.name }"
          @click="go('tag', t.name)"
        >
          {{ t.name }}
        </button>
      </div>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { QIcon } from '@/design/primitives'
import type { Category } from '@/core/db'
import type { LibraryView } from '@/stores/library'

const library = useLibraryStore()

defineProps<{ open?: boolean }>()

const emit = defineEmits<{
  (e: 'navigate'): void
  (e: 'new-category'): void
  (e: 'edit-category', category: Category): void
  (e: 'delete-category', category: Category): void
}>()

function go(view: LibraryView, key = ''): void {
  library.setView(view, key)
  emit('navigate')
}

const views = computed<{ view: LibraryView; label: string; count: number }[]>(() => [
  { view: 'all', label: 'All', count: library.stats.total },
  { view: 'unread', label: 'Unread', count: library.stats.unread },
  { view: 'reading', label: 'Reading', count: library.stats.reading },
  { view: 'favorites', label: 'Favorites', count: library.stats.favorites },
  { view: 'archived', label: 'Archive', count: library.stats.archived },
])
</script>

<style scoped>
.rail {
  width: 248px;
  flex: none;
  border-right: 1px solid var(--rule);
  padding: var(--space-5) var(--space-4);
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.section__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.section__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 0.6rem;
}
.add {
  display: inline-flex;
  align-items: center;
  border: 0;
  background: none;
  color: var(--ink-faint);
  cursor: pointer;
  margin-bottom: 0.6rem;
}
.add:hover {
  color: var(--accent);
}
.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border: 0;
  background: none;
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--ink);
  text-align: left;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  transition: background var(--dur-fast) var(--ease-out);
}
.row:hover {
  background: var(--accent-tint);
}
.row--active {
  background: var(--accent-tint);
  color: var(--accent);
  font-weight: var(--weight-medium);
}
.row__name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.row__name--mono {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
}
.row__count {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
.row--shelf .row__tools {
  display: none;
  gap: 0.2rem;
}
.row--shelf:hover .row__tools,
.row--shelf:focus-within .row__tools {
  display: flex;
}
.row--shelf:hover .row__count,
.row--shelf:focus-within .row__count {
  display: none;
}
.row__tools button {
  border: 0;
  background: none;
  color: var(--ink-faint);
  cursor: pointer;
  font-size: 0.75rem;
}
.row__tools button:hover {
  color: var(--accent);
}
.swatch {
  width: 9px;
  height: 9px;
  border-radius: 2px;
  flex: none;
}
.empty {
  font-size: var(--text-sm);
  color: var(--ink-faint);
  font-style: italic;
}
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
}
.chip {
  border: 1px solid var(--rule);
  background: var(--paper-raised);
  border-radius: var(--radius-full);
  padding: 0.2rem 0.55rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
  cursor: pointer;
  text-transform: lowercase;
}
.chip:hover {
  border-color: var(--rule-strong);
}
.chip--active {
  background: var(--accent-tint);
  color: var(--accent);
  border-color: transparent;
}
.chip__n {
  color: var(--ink-faint);
}
@media (hover: none) {
  .row--shelf .row__tools {
    display: flex;
  }
  .row--shelf .row__count {
    display: none;
  }
}

/* Narrow windows: the rail becomes a drawer opened from the header. */
@media (max-width: 900px) {
  .rail {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    z-index: var(--z-overlay);
    width: min(280px, 85vw);
    background-color: var(--paper);
    background-image: var(--grain);
    box-shadow: var(--shadow-lg);
    transform: translateX(-105%);
    visibility: hidden;
    transition: transform var(--dur) var(--ease-out), visibility 0s linear var(--dur);
  }
  .rail.is-open {
    transform: none;
    visibility: visible;
    transition: transform var(--dur) var(--ease-out);
  }
}
</style>
