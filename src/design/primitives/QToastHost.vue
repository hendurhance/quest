<template>
  <Teleport to="body">
    <div class="q-toast-host">
      <TransitionGroup name="q-toast">
        <QToast
          v-for="t in ui.toasts"
          :key="t.id"
          :kind="t.kind"
          @dismiss="ui.dismiss(t.id)"
        >
          {{ t.message }}
        </QToast>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useUiStore } from '@/stores/ui'
import QToast from './QToast.vue'

const ui = useUiStore()
</script>

<style scoped>
.q-toast-host {
  position: fixed;
  bottom: var(--space-5);
  right: var(--space-5);
  z-index: var(--z-toast);
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.q-toast-enter-active,
.q-toast-leave-active {
  transition: opacity var(--dur) var(--ease-out), transform var(--dur) var(--ease-out);
}
.q-toast-enter-from,
.q-toast-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
</style>
