<template>
  <div class="q-toast" :class="`q-toast--${kind}`" role="status">
    <span class="q-toast__mark" aria-hidden="true" />
    <span class="q-toast__msg"><slot /></span>
    <button class="q-toast__x" type="button" aria-label="Dismiss" @click="emit('dismiss')"><QIcon name="x" :size="15" /></button>
  </div>
</template>

<script setup lang="ts">
import QIcon from './QIcon.vue'

interface Props {
  kind?: 'success' | 'error' | 'warning' | 'info'
}

withDefaults(defineProps<Props>(), { kind: 'info' })

const emit = defineEmits<{ (e: 'dismiss'): void }>()
</script>

<style scoped>
.q-toast {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  min-width: 240px;
  max-width: 360px;
  padding: 0.7rem 0.9rem;
  background: var(--paper-raised);
  border: 1px solid var(--rule);
  border-left: 3px solid var(--ink-faint);
  border-radius: var(--radius);
  box-shadow: var(--shadow);
}
.q-toast__mark {
  flex: none;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--ink-faint);
}
.q-toast--success {
  border-left-color: var(--positive);
}
.q-toast--success .q-toast__mark {
  background: var(--positive);
}
.q-toast--error {
  border-left-color: var(--critical);
}
.q-toast--error .q-toast__mark {
  background: var(--critical);
}
.q-toast--warning {
  border-left-color: var(--warning);
}
.q-toast--warning .q-toast__mark {
  background: var(--warning);
}
.q-toast--info {
  border-left-color: var(--info);
}
.q-toast--info .q-toast__mark {
  background: var(--info);
}
.q-toast__msg {
  flex: 1;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
}
.q-toast__x {
  border: 0;
  background: none;
  color: var(--ink-muted);
  cursor: pointer;
  font-size: 1.2rem;
  line-height: 1;
  padding: 0 0.2rem;
}
.q-toast__x:hover {
  color: var(--accent);
}
</style>
