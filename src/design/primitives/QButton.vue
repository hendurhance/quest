<template>
  <button
    :class="['q-btn', `q-btn--${variant}`, `q-btn--${size}`, { 'q-btn--block': block, 'is-loading': loading }]"
    :type="type"
    :disabled="disabled || loading"
    @click="onClick"
  >
    <span v-if="loading" class="q-btn__spin" aria-hidden="true" />
    <slot v-else name="icon" />
    <span v-if="$slots.default" class="q-btn__label"><slot /></span>
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'quiet'
  size?: 'sm' | 'md' | 'lg'
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  disabled: false,
  loading: false,
  block: false,
})

const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

function onClick(ev: MouseEvent): void {
  if (!props.disabled && !props.loading) emit('click', ev)
}
</script>

<style scoped>
.q-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-serif);
  font-weight: var(--weight-medium);
  line-height: 1;
  border: 1px solid transparent;
  border-radius: var(--radius);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}
.q-btn:active:not(:disabled) {
  transform: translateY(1px);
}
.q-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.q-btn--block {
  width: 100%;
}

.q-btn--sm {
  padding: 0.35rem 0.6rem;
  font-size: var(--text-sm);
}
.q-btn--md {
  padding: 0.5rem 0.9rem;
  font-size: var(--text-base);
}
.q-btn--lg {
  padding: 0.7rem 1.2rem;
  font-size: var(--text-md);
}

.q-btn--primary {
  background: var(--accent);
  color: var(--accent-ink);
}
.q-btn--primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.q-btn--secondary {
  background: var(--paper-raised);
  color: var(--ink);
  border-color: var(--rule-strong);
}
.q-btn--secondary:hover:not(:disabled) {
  border-color: var(--ink-faint);
  background: var(--paper);
}

.q-btn--ghost {
  background: transparent;
  color: var(--ink);
}
.q-btn--ghost:hover:not(:disabled) {
  background: var(--accent-tint);
  color: var(--accent);
}

.q-btn--danger {
  background: transparent;
  color: var(--critical);
  border-color: color-mix(in srgb, var(--critical) 40%, transparent);
}
.q-btn--danger:hover:not(:disabled) {
  background: var(--critical);
  color: #fff;
  border-color: var(--critical);
}

.q-btn--quiet {
  background: transparent;
  color: var(--accent);
  padding-inline: 0;
}
.q-btn--quiet:hover:not(:disabled) {
  color: var(--accent-hover);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.q-btn__spin {
  width: 0.85em;
  height: 0.85em;
  border-radius: 50%;
  border: 2px solid currentColor;
  border-top-color: transparent;
  animation: q-btn-spin 0.7s linear infinite;
}
@keyframes q-btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
