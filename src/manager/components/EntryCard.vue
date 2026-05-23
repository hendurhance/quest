<template>
  <article
    class="entry"
    :class="[`entry--${view}`, { 'entry--selected': selected, 'entry--selectable': selectMode }]"
    @click="onCardClick"
  >
    <label v-if="selectMode" class="entry__check" @click.stop>
      <input type="checkbox" :checked="selected" @change="emit('select')" />
      <span class="entry__checkbox" aria-hidden="true" />
    </label>

    <div v-if="view === 'grid'" class="entry__cover">
      <img v-if="article.coverImage" :src="article.coverImage" alt="" />
      <span v-else class="entry__cover-glyph">{{ initial }}</span>
    </div>

    <div class="entry__body">
      <h3 class="entry__title">{{ article.title }}</h3>

      <p class="entry__meta">
        <img v-if="article.favicon && view === 'list'" class="entry__favicon" :src="article.favicon" alt="" />
        <span>{{ article.url.domain }}</span>
        <span class="dot">·</span>
        <span>{{ article.readingTimeMin }} min</span>
        <span class="dot">·</span>
        <span class="status" :class="`status--${article.status}`">{{ statusLabel }}</span>
        <QIcon v-if="hasSummary" name="sparkles" :size="13" class="ind" />
        <QIcon v-if="hasPodcast" name="headphones" :size="13" class="ind" />
      </p>

      <p v-if="view === 'grid' && article.excerpt" class="entry__excerpt">{{ article.excerpt }}</p>

      <div v-if="article.tags.length" class="entry__tags">
        <QTag v-for="t in article.tags.slice(0, 4)" :key="t">{{ t }}</QTag>
      </div>
    </div>

    <div v-if="!selectMode" class="entry__actions" @click.stop>
      <button class="act" :class="{ 'act--on': article.isPinned }" :title="article.isPinned ? 'Unpin' : 'Pin'" @click="emit('action', 'pin')">
        <QIcon :name="article.isPinned ? 'star-fill' : 'star'" :size="16" />
      </button>
      <button class="act" :title="article.status === 'archived' ? 'Unarchive' : 'Archive'" @click="emit('action', 'archive')">
        <QIcon name="archive" :size="16" />
      </button>
      <button class="act act--danger" title="Delete" @click="emit('action', 'delete')">
        <QIcon name="trash" :size="16" />
      </button>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Article } from '@/core/db'
import { QTag, QIcon } from '@/design/primitives'

type EntryAction = 'open' | 'pin' | 'archive' | 'delete'

const props = defineProps<{
  article: Article
  view: 'list' | 'grid'
  selected: boolean
  selectMode: boolean
}>()

const emit = defineEmits<{ (e: 'action', type: EntryAction): void; (e: 'select'): void }>()

function onCardClick(): void {
  // In select mode the whole card toggles selection; otherwise it opens the reader.
  if (props.selectMode) emit('select')
  else emit('action', 'open')
}

const hasSummary = computed(() => props.article.summaryIds.length > 0)
const hasPodcast = computed(() => !!props.article.audioId)
const initial = computed(() => (props.article.url.domain || props.article.title || '?').charAt(0).toUpperCase())
const statusLabel = computed(() => {
  switch (props.article.status) {
    case 'reading':
      return `${Math.round(props.article.readingProgress * 100)}%`
    case 'read':
      return 'read'
    case 'archived':
      return 'archived'
    default:
      return 'unread'
  }
})
</script>

<style scoped>
.entry {
  position: relative;
  display: flex;
  gap: var(--space-3);
  cursor: pointer;
}
.entry--list {
  align-items: flex-start;
  padding: var(--space-4) var(--space-3);
  border-radius: var(--radius);
  border-bottom: 1px solid var(--rule);
}
.entry--list:hover {
  background: var(--paper-raised);
}
.entry--grid {
  flex-direction: column;
  gap: var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  background: var(--paper-raised);
  transition: border-color var(--dur) var(--ease-out), box-shadow var(--dur) var(--ease-out), transform var(--dur) var(--ease-out);
}
.entry--grid:hover {
  border-color: var(--rule-strong);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}
.entry--selectable {
  border-radius: var(--radius);
}
.entry--selected {
  background: var(--accent-tint);
}
.entry--list.entry--selected {
  box-shadow: inset 3px 0 0 var(--accent);
}
.entry--grid.entry--selected {
  border-color: var(--accent);
}

.entry__check {
  flex: none;
  cursor: pointer;
  padding-top: 3px;
}
.entry__check input {
  position: absolute;
  opacity: 0;
}
.entry__checkbox {
  display: block;
  width: 18px;
  height: 18px;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-sm);
  background: var(--paper-raised);
}
.entry__check input:checked + .entry__checkbox {
  background: var(--accent);
  border-color: var(--accent);
  position: relative;
}
.entry__check input:checked + .entry__checkbox::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 1px;
  width: 5px;
  height: 10px;
  border: solid var(--accent-ink);
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.entry__cover {
  aspect-ratio: 16 / 9;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--paper-sunken);
  display: flex;
  align-items: center;
  justify-content: center;
}
.entry__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.entry__cover-glyph {
  font-family: var(--font-display);
  font-size: 2.5rem;
  color: var(--ink-faint);
}

.entry__body {
  flex: 1;
  min-width: 0;
}
.entry__title {
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: 1.2rem;
  line-height: var(--leading-snug);
  letter-spacing: var(--tracking-tight);
  color: var(--ink);
}
.entry--grid .entry__title {
  font-size: 1.1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.entry:hover .entry__title {
  color: var(--accent);
}
.entry__meta {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
  margin-top: 0.35rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
}
.entry__favicon {
  width: 14px;
  height: 14px;
  border-radius: 2px;
}
.ind {
  color: var(--accent);
}
.status--unread {
  color: var(--accent);
}
.status--reading {
  color: var(--info);
}
.entry__excerpt {
  margin-top: 0.5rem;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  line-height: var(--leading-normal);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.entry__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3rem;
  margin-top: 0.6rem;
}

.entry__actions {
  display: flex;
  gap: 0.1rem;
  flex: none;
  align-self: flex-start;
  opacity: 0;
  transition: opacity var(--dur-fast) var(--ease-out);
}
.entry--grid .entry__actions {
  align-self: stretch;
  justify-content: flex-end;
}
.entry:hover .entry__actions,
.entry--selected .entry__actions {
  opacity: 1;
}
.act {
  width: 30px;
  height: 30px;
  border: 0;
  background: none;
  border-radius: var(--radius);
  cursor: pointer;
  color: var(--ink-faint);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: background var(--dur-fast) var(--ease-out), color var(--dur-fast) var(--ease-out);
}
.act:hover {
  background: var(--accent-tint);
  color: var(--accent);
}
.act--on {
  color: var(--accent);
}
.act--danger:hover {
  background: color-mix(in srgb, var(--critical) 14%, transparent);
  color: var(--critical);
}
.dot {
  color: var(--ink-faint);
}
</style>
