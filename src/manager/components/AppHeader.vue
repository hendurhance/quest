<template>
  <header class="app-header">
    <div class="brand">
      <QIcon name="bookmark" :size="20" class="brand__mark" />
      <span class="brand__name">Quest</span>
    </div>

    <div class="search">
      <QIcon name="search" :size="16" class="search__icon" />
      <input v-model="library.search" class="search__input" placeholder="Search the shelf…" />
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
import { useLibraryStore } from '@/stores/library'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { QKbd, QIcon } from '@/design/primitives'

const library = useLibraryStore()
const ui = useUiStore()
const { theme, toggleTheme } = useTheme()

const emit = defineEmits<{ (e: 'add'): void; (e: 'settings'): void; (e: 'usage'): void }>()
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
</style>
