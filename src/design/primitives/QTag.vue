<template>
  <span
    class="q-tag"
    :class="{ 'q-tag--accent': accent, 'q-tag--button': removable || clickable }"
    @click="onClick"
  >
    <slot />
    <button
      v-if="removable"
      class="q-tag__x"
      type="button"
      aria-label="Remove"
      @click.stop="emit('remove')"
    >
      <QIcon name="x" :size="12" />
    </button>
  </span>
</template>

<script setup lang="ts">
import QIcon from './QIcon.vue'

interface Props {
  accent?: boolean
  removable?: boolean
  clickable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  accent: false,
  removable: false,
  clickable: false,
})

const emit = defineEmits<{ (e: 'remove'): void; (e: 'click'): void }>()

function onClick(): void {
  if (props.clickable) emit('click')
}
</script>

<style scoped>
.q-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-wide);
  text-transform: uppercase;
  color: var(--ink-muted);
  background: var(--paper-sunken);
  border: 1px solid var(--rule);
  border-radius: var(--radius-full);
  padding: 0.2rem 0.55rem;
}
.q-tag--accent {
  color: var(--accent);
  background: var(--accent-tint);
  border-color: transparent;
}
.q-tag--button {
  cursor: pointer;
}
.q-tag--button:hover {
  border-color: var(--rule-strong);
}
.q-tag__x {
  border: 0;
  background: none;
  color: inherit;
  cursor: pointer;
  font-size: 1em;
  line-height: 1;
  padding: 0;
}
</style>
