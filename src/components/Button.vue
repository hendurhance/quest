<template>
  <button 
    :class="['btn', variantClass, sizeClass, { 'btn-loading': loading, 'btn-icon-only': iconOnly }]"
    :disabled="disabled || loading"
    :type="type"
    @click="handleClick"
  >
    <span v-if="loading" class="btn-spinner">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
        <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
      </svg>
    </span>
    <span v-if="$slots.icon && !loading" class="btn-icon">
      <slot name="icon" />
    </span>
    <span v-if="!iconOnly" class="btn-text">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'success' | 'ghost'
  size?: 'small' | 'medium' | 'large'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  iconOnly?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'medium',
  type: 'button',
  disabled: false,
  loading: false,
  iconOnly: false,
})

const emit = defineEmits<{
  (e: 'click', event: MouseEvent): void
}>()

const variantClass = computed(() => `btn-${props.variant}`)
const sizeClass = computed(() => `btn-${props.size}`)

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}
</script>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 500;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
  line-height: 1;
  white-space: nowrap;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-loading {
  cursor: wait;
}

/* Sizes */
.btn-small {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

.btn-medium {
  padding: 0.625rem 1rem;
  font-size: 0.9375rem;
}

.btn-large {
  padding: 0.75rem 1.25rem;
  font-size: 1rem;
}

.btn-icon-only {
  padding: 0.625rem;
}

.btn-icon-only.btn-small {
  padding: 0.5rem;
}

.btn-icon-only.btn-large {
  padding: 0.75rem;
}

/* Variants */
.btn-primary {
  background-color: var(--primary-color, #4285f4);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--primary-hover, #3b78e7);
}

.btn-primary:active:not(:disabled) {
  background-color: var(--primary-active, #3367d6);
}

.btn-secondary {
  background-color: var(--secondary-bg, #f3f4f6);
  color: var(--text-primary, #111827);
  border: 1px solid var(--border-color, #e5e7eb);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--hover-bg, #e5e7eb);
}

.btn-secondary:active:not(:disabled) {
  background-color: var(--border-color, #d1d5db);
}

.btn-danger {
  background-color: var(--danger-color, #ef4444);
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: var(--danger-hover, #dc2626);
}

.btn-danger:active:not(:disabled) {
  background-color: var(--danger-active, #b91c1c);
}

.btn-success {
  background-color: var(--success-color, #10b981);
  color: white;
}

.btn-success:hover:not(:disabled) {
  background-color: var(--success-hover, #059669);
}

.btn-success:active:not(:disabled) {
  background-color: var(--success-active, #047857);
}

.btn-ghost {
  background-color: transparent;
  color: var(--text-primary, #111827);
}

.btn-ghost:hover:not(:disabled) {
  background-color: var(--hover-bg, #f3f4f6);
}

.btn-ghost:active:not(:disabled) {
  background-color: var(--border-color, #e5e7eb);
}

/* Spinner */
.btn-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-spinner svg {
  animation: spin 1s linear infinite;
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
[data-theme="dark"] .btn-secondary {
  background-color: var(--secondary-bg, #374151);
  color: var(--text-primary, #f9fafb);
  border-color: var(--border-color, #4b5563);
}

[data-theme="dark"] .btn-secondary:hover:not(:disabled) {
  background-color: var(--hover-bg, #4b5563);
}

[data-theme="dark"] .btn-ghost {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .btn-ghost:hover:not(:disabled) {
  background-color: var(--hover-bg, #374151);
}
</style>
