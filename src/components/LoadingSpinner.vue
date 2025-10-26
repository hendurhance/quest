<template>
  <div :class="['spinner-container', sizeClass]">
    <div class="spinner">
      <svg viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
    </div>
    <p v-if="text" class="spinner-text">{{ text }}</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'small' | 'medium' | 'large'
  text?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'medium',
  text: '',
})

const sizeClass = computed(() => `spinner-${props.size}`)
</script>

<style scoped>
.spinner-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.spinner {
  animation: spin 1s linear infinite;
  color: var(--primary-color, #4285f4);
}

.spinner-small {
  width: 1rem;
  height: 1rem;
}

.spinner-medium {
  width: 2rem;
  height: 2rem;
}

.spinner-large {
  width: 3rem;
  height: 3rem;
}

.spinner svg {
  width: 100%;
  height: 100%;
}

.spinner-text {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
  margin: 0;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Dark mode */
[data-theme="dark"] .spinner-text {
  color: var(--text-secondary, #9ca3af);
}
</style>
