import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastKind = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: number
  message: string
  kind: ToastKind
  duration: number
}

export const useUiStore = defineStore('ui', () => {
  const toasts = ref<Toast[]>([])
  const commandPaletteOpen = ref(false)
  let seq = 0

  function dismiss(id: number): void {
    toasts.value = toasts.value.filter((t) => t.id !== id)
  }

  function notify(message: string, kind: ToastKind = 'info', duration = 3200): number {
    const id = ++seq
    toasts.value.push({ id, message, kind, duration })
    if (duration > 0) setTimeout(() => dismiss(id), duration)
    return id
  }

  const success = (message: string, duration?: number) => notify(message, 'success', duration)
  const error = (message: string, duration = 5000) => notify(message, 'error', duration)
  const warning = (message: string, duration?: number) => notify(message, 'warning', duration)
  const info = (message: string, duration?: number) => notify(message, 'info', duration)

  function openCommandPalette(): void {
    commandPaletteOpen.value = true
  }
  function closeCommandPalette(): void {
    commandPaletteOpen.value = false
  }
  function toggleCommandPalette(): void {
    commandPaletteOpen.value = !commandPaletteOpen.value
  }

  return {
    toasts,
    commandPaletteOpen,
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    openCommandPalette,
    closeCommandPalette,
    toggleCommandPalette,
  }
})
