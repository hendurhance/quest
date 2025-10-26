<template>
  <div class="empty-state">
    <div class="empty-state-icon">
      <slot name="icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M6 2C4.9 2 4 2.9 4 4V20L12 17L20 20V4C20 2.9 19.1 2 18 2H6Z" stroke="currentColor" stroke-width="2"/>
        </svg>
      </slot>
    </div>
    <h3 class="empty-state-title">{{ title }}</h3>
    <p v-if="description" class="empty-state-description">{{ description }}</p>
    <div v-if="$slots.action" class="empty-state-action">
      <slot name="action" />
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title: string
  description?: string
}

withDefaults(defineProps<Props>(), {
  description: '',
})
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1.5rem;
  text-align: center;
  min-height: 300px;
}

.empty-state-icon {
  margin-bottom: 1rem;
  color: var(--text-tertiary, #d1d5db);
}

.empty-state-icon svg {
  width: 64px;
  height: 64px;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 0.5rem;
}

.empty-state-description {
  font-size: 0.9375rem;
  color: var(--text-secondary, #6b7280);
  margin: 0 0 1.5rem;
  max-width: 400px;
}

.empty-state-action {
  margin-top: 0.5rem;
}

/* Dark mode */
[data-theme="dark"] .empty-state-icon {
  color: var(--text-tertiary, #4b5563);
}

[data-theme="dark"] .empty-state-title {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .empty-state-description {
  color: var(--text-secondary, #9ca3af);
}
</style>
