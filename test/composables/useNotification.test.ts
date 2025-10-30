import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useNotification } from '@/composables/useNotification'

describe('useNotification', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Clear notifications between tests
    const { notifications } = useNotification()
    notifications.value = []
  })

  it('should show notification', () => {
    const { notifications, showNotification } = useNotification()

    showNotification({ message: 'Test message', type: 'success' })

    expect(notifications.value).toHaveLength(1)
    expect(notifications.value[0].message).toBe('Test message')
    expect(notifications.value[0].type).toBe('success')
    expect(notifications.value[0].visible).toBe(true)
  })

  it('should generate unique IDs for notifications', () => {
    const { notifications, showNotification } = useNotification()

    showNotification({ message: 'Message 1', type: 'info' })
    showNotification({ message: 'Message 2', type: 'info' })

    expect(notifications.value[0].id).not.toBe(notifications.value[1].id)
  })

  it('should support different notification types', () => {
    const { notifications, success, error, warning, info } = useNotification()

    success('Success message')
    error('Error message')
    warning('Warning message')
    info('Info message')

    expect(notifications.value).toHaveLength(4)
    expect(notifications.value[0].type).toBe('success')
    expect(notifications.value[1].type).toBe('error')
    expect(notifications.value[2].type).toBe('warning')
    expect(notifications.value[3].type).toBe('info')
  })

  it('should hide notification', () => {
    vi.useFakeTimers()
    const { notifications, showNotification, hideNotification } = useNotification()

    showNotification({ message: 'Test message', type: 'info' })
    const id = notifications.value[0].id

    hideNotification(id)

    expect(notifications.value[0].visible).toBe(false)
    
    // After animation delay, notification should be removed
    vi.advanceTimersByTime(300)
    expect(notifications.value).toHaveLength(0)

    vi.useRealTimers()
  })

  it('should handle hiding non-existent notifications', () => {
    const { notifications, hideNotification } = useNotification()

    hideNotification('non-existent-id')

    expect(notifications.value).toHaveLength(0)
  })

  it('should auto-dismiss notifications after duration', () => {
    vi.useFakeTimers()
    const { notifications, showNotification } = useNotification()

    showNotification({ message: 'Test message', type: 'info', duration: 3000 })

    expect(notifications.value).toHaveLength(1)

    // After duration, notification should be hidden
    vi.advanceTimersByTime(3000)
    expect(notifications.value[0].visible).toBe(false)
    
    // After animation delay, should be removed
    vi.advanceTimersByTime(300)
    expect(notifications.value).toHaveLength(0)

    vi.useRealTimers()
  })

  it('should use default duration if not provided', () => {
    vi.useFakeTimers()
    const { notifications, showNotification } = useNotification()

    showNotification({ message: 'Test message', type: 'info' })

    expect(notifications.value[0].duration).toBe(3000)

    vi.useRealTimers()
  })

  it('should use default type if not provided', () => {
    const { notifications, showNotification } = useNotification()

    showNotification({ message: 'Test message' })

    expect(notifications.value[0].type).toBe('info')
  })
})
