<template>
  <div class="catalog">
    <input
      v-if="state.status === 'error'"
      class="catalog__input"
      :value="modelValue"
      placeholder="Enter an ID"
      spellcheck="false"
      @change="emit('update:modelValue', ($event.target as HTMLInputElement).value.trim())"
    />
    <div v-else class="catalog__select">
      <select :value="modelValue" :disabled="state.status !== 'ready'" @change="onSelect">
        <option value="" disabled>{{ emptyLabel }}</option>
        <option v-if="modelValue && !selected" :value="modelValue">
          {{ stale ? `${modelValue} (unavailable)` : modelValue }}
        </option>
        <option v-for="item in state.items" :key="item.id" :value="item.id">{{ item.name }}</option>
      </select>
    </div>

    <p v-if="state.status === 'error'" class="note note--warn">
      Couldn’t load the list ({{ state.error }}). Type an ID, or
      <button type="button" class="note__link" @click="emit('retry')">retry</button>.
    </p>
    <p v-else-if="stale" class="note note--warn">
      <QIcon name="alert" :size="12" /> No longer offered. Choose another.
    </p>
    <p v-else-if="selected && selected.id !== selected.name" class="note">
      <span class="note__id">{{ selected.id }}</span>
      <span v-if="selected.detail"> · {{ selected.detail }}</span>
    </p>
    <p v-else-if="selected?.detail" class="note">{{ selected.detail }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Catalog } from '@/core/ai/catalog'
import { QIcon } from '@/design/primitives'

export interface CatalogState extends Catalog {
  status: 'idle' | 'loading' | 'ready' | 'error'
  error?: string
}

const props = defineProps<{ modelValue: string; state: CatalogState; placeholder: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: string): void; (e: 'retry'): void }>()

const selected = computed(() => props.state.items.find((i) => i.id === props.modelValue))
const stale = computed(
  () => props.state.status === 'ready' && !!props.modelValue && !props.state.available.includes(props.modelValue),
)
const emptyLabel = computed(() => {
  if (props.state.status === 'loading') return 'Loading…'
  if (props.state.status === 'idle') return 'Add an API key first'
  return props.placeholder
})

function onSelect(event: Event): void {
  emit('update:modelValue', (event.target as HTMLSelectElement).value)
}
</script>

<style scoped>
.catalog {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}
.catalog__select {
  position: relative;
}
.catalog__select::after {
  content: '▾';
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-faint);
  pointer-events: none;
}
select,
.catalog__input {
  width: 100%;
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.45rem 0.65rem;
}
select {
  appearance: none;
  padding-right: 1.9rem;
  cursor: pointer;
  text-overflow: ellipsis;
}
select:disabled {
  color: var(--ink-faint);
  cursor: default;
}
.catalog__input {
  font-family: var(--font-mono);
  outline: none;
}
.catalog__input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}
.note {
  font-size: var(--text-2xs);
  line-height: var(--leading-snug);
  color: var(--ink-faint);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.note--warn {
  color: var(--warning);
  display: block;
}
.note__id {
  font-family: var(--font-mono);
}
.note__link {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  color: var(--accent);
  text-decoration: underline;
  cursor: pointer;
}
</style>
