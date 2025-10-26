import { ref } from 'vue'
import type { NotificationOptions } from '@/types'

interface Notification extends NotificationOptions {
  id: string
  visible: boolean
}

// Global state - shared across all components
const notifications = ref<Notification[]>([])

export function useNotification() {
  const showNotification = (options: NotificationOptions) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const notification: Notification = {
      id,
      message: options.message,
      type: options.type || 'info',
      duration: options.duration || 3000,
      visible: true,
    }

    notifications.value.push(notification)

    // Auto-dismiss after duration
    setTimeout(() => {
      hideNotification(id)
    }, notification.duration)
  }

  const hideNotification = (id: string) => {
    const notification = notifications.value.find((n) => n.id === id)
    if (notification) {
      notification.visible = false
      // Remove from array after animation completes
      setTimeout(() => {
        notifications.value = notifications.value.filter((n) => n.id !== id)
      }, 300)
    }
  }

  const success = (message: string, duration?: number) => {
    showNotification({ message, type: 'success', duration })
  }

  const error = (message: string, duration?: number) => {
    showNotification({ message, type: 'error', duration })
  }

  const warning = (message: string, duration?: number) => {
    showNotification({ message, type: 'warning', duration })
  }

  const info = (message: string, duration?: number) => {
    showNotification({ message, type: 'info', duration })
  }

  return {
    notifications,
    showNotification,
    hideNotification,
    success,
    error,
    warning,
    info,
  }
}
