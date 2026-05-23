<template>
  <Teleport to="body">
    <Transition name="q-modal">
      <div v-if="open" class="q-modal" @click.self="close">
        <div class="q-modal__scrim" />
        <div
          ref="dialog"
          class="q-modal__dialog"
          :class="`q-modal__dialog--${size}`"
          role="dialog"
          aria-modal="true"
          tabindex="-1"
        >
          <header v-if="title || $slots.header" class="q-modal__head">
            <slot name="header">
              <h2 class="q-modal__title">{{ title }}</h2>
            </slot>
            <button class="q-modal__close" type="button" aria-label="Close" @click="close"><QIcon name="x" :size="18" /></button>
          </header>
          <div class="q-modal__body"><slot /></div>
          <footer v-if="$slots.footer" class="q-modal__foot"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onBeforeUnmount } from 'vue'
import QIcon from './QIcon.vue'

interface Props {
  open?: boolean
  title?: string
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  title: '',
  size: 'md',
})

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'close'): void
}>()

const dialog = ref<HTMLElement | null>(null)

function close(): void {
  emit('update:open', false)
  emit('close')
}

function onKey(e: KeyboardEvent): void {
  if (e.key === 'Escape' && props.open) close()
}

watch(
  () => props.open,
  async (isOpen) => {
    if (isOpen) {
      window.addEventListener('keydown', onKey)
      await nextTick()
      dialog.value?.focus()
    } else {
      window.removeEventListener('keydown', onKey)
    }
  },
)

onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
.q-modal {
  position: fixed;
  inset: 0;
  z-index: var(--z-modal);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-5);
}
.q-modal__scrim {
  position: absolute;
  inset: 0;
  background: var(--paper-overlay);
  backdrop-filter: blur(2px);
}
.q-modal__dialog {
  position: relative;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  background: var(--paper-raised);
  border: 1px solid var(--rule);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-pop);
  outline: none;
}
.q-modal__dialog--sm {
  max-width: 380px;
}
.q-modal__dialog--md {
  max-width: 560px;
}
.q-modal__dialog--lg {
  max-width: 820px;
}
.q-modal__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: var(--space-5) var(--space-5) var(--space-3);
  border-bottom: 1px solid var(--rule);
}
.q-modal__title {
  margin: 0;
  font-family: var(--font-display);
  font-weight: var(--weight-semibold);
  font-size: var(--text-xl);
  line-height: var(--leading-snug);
  color: var(--ink);
}
.q-modal__close {
  border: 0;
  background: none;
  color: var(--ink-muted);
  font-size: 1.5rem;
  line-height: 1;
  cursor: pointer;
  padding: 0 0.2rem;
}
.q-modal__close:hover {
  color: var(--accent);
}
.q-modal__body {
  padding: var(--space-5);
  overflow-y: auto;
}
.q-modal__foot {
  display: flex;
  gap: 0.6rem;
  justify-content: flex-end;
  padding: var(--space-3) var(--space-5) var(--space-5);
  border-top: 1px solid var(--rule);
}

.q-modal-enter-active,
.q-modal-leave-active {
  transition: opacity var(--dur) var(--ease-out);
}
.q-modal-enter-active .q-modal__dialog,
.q-modal-leave-active .q-modal__dialog {
  transition: transform var(--dur) var(--ease-out);
}
.q-modal-enter-from,
.q-modal-leave-to {
  opacity: 0;
}
.q-modal-enter-from .q-modal__dialog,
.q-modal-leave-to .q-modal__dialog {
  transform: translateY(8px) scale(0.98);
}
</style>
