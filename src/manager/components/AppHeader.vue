<template>
  <header class="app-header">
    <button class="icon-btn menu-btn" title="Contents" aria-label="Open contents" @click="emit('menu')">
      <QIcon name="menu" />
    </button>
    <div class="brand">
      <QIcon name="bookmark" :size="20" class="brand__mark" />
      <span class="brand__name">Quest</span>
    </div>

    <div class="search">
      <QIcon name="search" :size="16" class="search__icon" />
      <input
        ref="searchInput"
        v-model="library.search"
        class="search__input"
        placeholder="Search the shelf…"
        aria-label="Search the shelf"
        @keydown.esc="library.search = ''"
      />
      <button v-if="library.search" class="search__clear" title="Clear search" aria-label="Clear search" @click="library.search = ''">
        <QIcon name="x" :size="14" />
      </button>
      <button class="search__kbd" title="Command palette" @click="ui.openCommandPalette()">
        <QKbd>⌘</QKbd><QKbd>K</QKbd>
      </button>
    </div>

    <div class="actions">
      <button class="icon-btn" title="Add by URL" @click="emit('add')"><QIcon name="plus" /></button>
      <button class="icon-btn" title="AI usage" @click="emit('usage')"><QIcon name="chart" /></button>
      <button class="icon-btn" :title="theme === 'dark' ? 'Light mode' : 'Ink mode'" @click="toggleTheme">
        <QIcon :name="theme === 'dark' ? 'sun' : 'moon'" />
      </button>
      <button class="icon-btn" title="Settings" @click="emit('settings')"><QIcon name="settings" /></button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useLibraryStore } from '@/stores/library'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { QKbd, QIcon } from '@/design/primitives'

const library = useLibraryStore()
const ui = useUiStore()
const { theme, toggleTheme } = useTheme()

const emit = defineEmits<{ (e: 'add'): void; (e: 'settings'): void; (e: 'usage'): void; (e: 'menu'): void }>()

const searchInput = ref<HTMLInputElement | null>(null)

function onKeydown(e: KeyboardEvent): void {
  const target = e.target as HTMLElement | null
  const typing = !!target?.closest('input, textarea, select, [contenteditable="true"]')
  if (e.key === '/' && !typing && !e.metaKey && !e.ctrlKey) {
    e.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
.app-header {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  padding: var(--space-3) var(--space-5);
  border-bottom: 1px solid var(--rule);
  background: var(--paper);
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex: none;
}
.brand__mark {
  color: var(--accent);
}
.brand__name {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: 1.35rem;
  letter-spacing: var(--tracking-tight);
}
.search {
  flex: 1;
  max-width: 540px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 0.55rem;
  background: var(--paper-raised);
  border: 1px solid var(--rule);
  border-radius: var(--radius-full);
  padding: 0.45rem 0.85rem;
  color: var(--ink-faint);
  transition: border-color var(--dur-fast) var(--ease-out);
}
.search:focus-within {
  border-color: var(--rule-strong);
}
.search__icon {
  color: var(--ink-faint);
}
.search__input {
  flex: 1;
  border: 0;
  outline: none;
  background: transparent;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
}
.search__input::placeholder {
  color: var(--ink-faint);
}
.search__clear {
  display: inline-flex;
  border: 0;
  background: none;
  padding: 0.1rem;
  color: var(--ink-faint);
  cursor: pointer;
}
.search__clear:hover {
  color: var(--accent);
}
.search__kbd {
  display: flex;
  gap: 0.2rem;
  border: 0;
  background: none;
  cursor: pointer;
  padding: 0;
}
.actions {
  display: flex;
  gap: 0.25rem;
  flex: none;
}
.icon-btn {
  width: 36px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 0;
  background: none;
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--ink-muted);
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.icon-btn:hover {
  background: var(--accent-tint);
  color: var(--accent);
}
.menu-btn {
  display: none;
}

@media (max-width: 900px) {
  .menu-btn {
    display: inline-flex;
  }
  .app-header {
    gap: var(--space-3);
  }
}
@media (max-width: 640px) {
  .app-header {
    padding: var(--space-2) var(--space-3);
    gap: var(--space-2);
  }
  .brand__name,
  .search__kbd {
    display: none;
  }
  .actions {
    gap: 0;
  }
  .icon-btn {
    width: 32px;
    height: 32px;
  }
}
</style>
