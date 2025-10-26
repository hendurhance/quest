<template>
  <span :class="['badge', variantClass, sizeClass, { 'badge-removable': removable }]" :style="customStyle">
    <slot />
    <button v-if="removable" class="badge-remove" @click.stop="$emit('remove')" aria-label="Remove">
      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none">
        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
      </svg>
    </button>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'custom'
  size?: 'small' | 'medium'
  color?: string
  removable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'medium',
  color: '',
  removable: false,
})

defineEmits<{
  (e: 'remove'): void
}>()

const variantClass = computed(() => `badge-${props.variant}`)
const sizeClass = computed(() => `badge-${props.size}`)

const customStyle = computed(() => {
  if (props.variant === 'custom' && props.color) {
    return {
      backgroundColor: props.color + '20',
      color: props.color,
      borderColor: props.color + '40',
    }
  }
  return {}
})
</script>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-weight: 500;
  border-radius: 6px;
  border: 1px solid transparent;
  white-space: nowrap;
  line-height: 1;
  font-family: inherit;
}

/* Sizes */
.badge-small {
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
}

.badge-medium {
  padding: 0.375rem 0.625rem;
  font-size: 0.8125rem;
}

/* Variants */
.badge-default {
  background-color: var(--secondary-bg, #f3f4f6);
  color: var(--text-secondary, #6b7280);
  border-color: var(--border-color, #e5e7eb);
}

.badge-primary {
  background-color: #dbeafe;
  color: #1e40af;
  border-color: #bfdbfe;
}

.badge-success {
  background-color: #d1fae5;
  color: #065f46;
  border-color: #a7f3d0;
}

.badge-warning {
  background-color: #fef3c7;
  color: #C75A38;
  border-color: #fde68a;
}

.badge-danger {
  background-color: #fee2e2;
  color: #991b1b;
  border-color: #fecaca;
}

.badge-removable {
  padding-right: 0.25rem;
}

.badge-remove {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.125rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: currentColor;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.badge-remove:hover {
  opacity: 1;
}

/* Dark mode */
[data-theme="dark"] .badge-default {
  background-color: var(--secondary-bg, #374151);
  color: var(--text-secondary, #9ca3af);
  border-color: var(--border-color, #4b5563);
}

[data-theme="dark"] .badge-primary {
  background-color: #1e3a8a;
  color: #bfdbfe;
  border-color: #1e40af;
}

[data-theme="dark"] .badge-success {
  background-color: #064e3b;
  color: #a7f3d0;
  border-color: #065f46;
}

[data-theme="dark"] .badge-warning {
  background-color: #78350f;
  color: #fde68a;
  border-color: #C75A38;
}

[data-theme="dark"] .badge-danger {
  background-color: #7f1d1d;
  color: #fecaca;
  border-color: #991b1b;
}
</style>
