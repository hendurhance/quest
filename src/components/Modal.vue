<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="show" class="modal-overlay" @click.self="handleOverlayClick">
        <div :class="['modal-container', sizeClass]" role="dialog" aria-modal="true">
          <!-- Header -->
          <div class="modal-header">
            <slot name="header">
              <h2 class="modal-title">{{ title }}</h2>
            </slot>
            <button 
              v-if="showClose" 
              class="modal-close" 
              @click="handleClose"
              aria-label="Close modal"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="modal-body">
            <slot />
          </div>

          <!-- Footer -->
          <div v-if="$slots.footer" class="modal-footer">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { watch } from 'vue'

interface Props {
  show: boolean
  title?: string
  size?: 'small' | 'medium' | 'large'
  showClose?: boolean
  closeOnOverlay?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: 'medium',
  showClose: true,
  closeOnOverlay: true,
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:show', value: boolean): void
}>()

const sizeClass = computed(() => `modal-${props.size}`)

const handleClose = () => {
  emit('close')
  emit('update:show', false)
}

const handleOverlayClick = () => {
  if (props.closeOnOverlay) {
    handleClose()
  }
}

// Handle escape key
const handleEscape = (event: KeyboardEvent) => {
  if (event.key === 'Escape' && props.show) {
    handleClose()
  }
}

watch(() => props.show, (newValue) => {
  if (newValue) {
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
  } else {
    document.removeEventListener('keydown', handleEscape)
    document.body.style.overflow = ''
  }
})
</script>

<script lang="ts">
import { computed } from 'vue'
export default {
  name: 'Modal'
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-container {
  background: var(--bg-primary, white);
  border-radius: 12px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-small {
  width: 400px;
  max-width: 90vw;
}

.modal-medium {
  width: 600px;
  max-width: 90vw;
}

.modal-large {
  width: 900px;
  max-width: 90vw;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: var(--text-secondary, #6b7280);
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: var(--hover-bg, #f3f4f6);
  color: var(--text-primary, #111827);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Transition animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-active .modal-container,
.modal-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .modal-container,
.modal-leave-to .modal-container {
  transform: scale(0.95);
}

/* Dark mode support */
[data-theme="dark"] .modal-container {
  background: var(--bg-primary, #1f2937);
}

[data-theme="dark"] .modal-title {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .modal-header,
[data-theme="dark"] .modal-footer {
  border-color: var(--border-color, #374151);
}
</style>
