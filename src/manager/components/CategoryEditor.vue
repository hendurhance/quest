<template>
  <QModal :open="open" :title="editing ? 'Edit shelf' : 'New shelf'" size="sm" @update:open="$emit('update:open', $event)">
    <div class="editor">
      <QField v-model="name" label="Name" placeholder="e.g. Essays" />
      <div class="swatches">
        <span class="swatches__label">Colour</span>
        <div class="swatches__grid">
          <button
            v-for="c in palette"
            :key="c"
            class="swatch"
            :class="{ 'swatch--active': c === color }"
            :style="{ background: c }"
            type="button"
            @click="color = c"
          />
        </div>
      </div>
    </div>
    <template #footer>
      <QButton variant="ghost" @click="$emit('update:open', false)">Cancel</QButton>
      <QButton variant="primary" :disabled="!name.trim()" @click="save">{{ editing ? 'Save' : 'Create' }}</QButton>
    </template>
  </QModal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Category } from '@/core/db'
import { QModal, QField, QButton } from '@/design/primitives'

const props = defineProps<{ open: boolean; editing: Category | null }>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', value: { id?: string; name: string; color: string }): void
}>()

const palette = ['#b23a2e', '#4f7a3a', '#3c6478', '#b9802a', '#7c5a9e', '#a0512f', '#2f6f6a', '#8a8170']
const name = ref('')
const color = ref(palette[0])

watch(
  () => props.open,
  (open) => {
    if (open) {
      name.value = props.editing?.name ?? ''
      color.value = props.editing?.color ?? palette[0]
    }
  },
)

function save(): void {
  if (!name.value.trim()) return
  emit('save', { id: props.editing?.id, name: name.value.trim(), color: color.value })
  emit('update:open', false)
}
</script>

<style scoped>
.editor {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}
.swatches__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-muted);
}
.swatches__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.5rem;
}
.swatch {
  width: 30px;
  height: 30px;
  border-radius: var(--radius);
  border: 2px solid transparent;
  cursor: pointer;
}
.swatch--active {
  border-color: var(--ink);
  box-shadow: 0 0 0 2px var(--paper-raised) inset;
}
</style>
