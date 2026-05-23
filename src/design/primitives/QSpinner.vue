<template>
  <span class="q-spinner" :class="`q-spinner--${size}`" role="status" aria-label="Loading" />
</template>

<script setup lang="ts">
interface Props {
  size?: 'sm' | 'md' | 'lg'
}

withDefaults(defineProps<Props>(), { size: 'md' })
</script>

<style scoped>
.q-spinner {
  display: inline-block;
  border-radius: 50%;
  border: 2px solid var(--rule-strong);
  border-top-color: var(--accent);
  animation: q-spinner-spin 0.7s linear infinite;
}
.q-spinner--sm {
  width: 14px;
  height: 14px;
}
.q-spinner--md {
  width: 20px;
  height: 20px;
}
.q-spinner--lg {
  width: 32px;
  height: 32px;
  border-width: 3px;
}
@keyframes q-spinner-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
