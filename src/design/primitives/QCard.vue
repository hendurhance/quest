<template>
  <component :is="as" class="q-card" :class="{ 'q-card--interactive': interactive }">
    <slot />
  </component>
</template>

<script setup lang="ts">
interface Props {
  as?: string
  interactive?: boolean
}

withDefaults(defineProps<Props>(), {
  as: 'div',
  interactive: false,
})
</script>

<style scoped>
.q-card {
  background: var(--paper-raised);
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
}
.q-card--interactive {
  cursor: pointer;
  transition: border-color var(--dur) var(--ease-out),
    box-shadow var(--dur) var(--ease-out),
    transform var(--dur) var(--ease-out);
}
.q-card--interactive:hover {
  border-color: var(--rule-strong);
  box-shadow: var(--shadow);
  transform: translateY(-2px);
}
</style>
