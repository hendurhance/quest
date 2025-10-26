<template>
  <Modal :show="show" :title="title" size="small" @close="handleCancel">
    <div class="confirm-content">
      <div v-if="type" :class="['confirm-icon', type]">
        <svg v-if="type === 'danger'" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <svg v-else-if="type === 'warning'" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </div>
      <p class="confirm-message">{{ message }}</p>
    </div>

    <template #footer>
      <Button variant="secondary" @click="handleCancel">
        {{ cancelText }}
      </Button>
      <Button 
        :variant="type === 'danger' ? 'danger' : 'primary'" 
        @click="handleConfirm"
        :loading="loading"
      >
        {{ confirmText }}
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import Modal from './Modal.vue'
import Button from './Button.vue'

interface Props {
  show: boolean
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  type?: 'info' | 'warning' | 'danger'
  loading?: boolean
}

withDefaults(defineProps<Props>(), {
  title: 'Confirm Action',
  confirmText: 'Confirm',
  cancelText: 'Cancel',
  type: 'info',
  loading: false
})

const emit = defineEmits<{
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:show', value: boolean): void
}>()

const handleConfirm = () => {
  emit('confirm')
}

const handleCancel = () => {
  emit('cancel')
  emit('update:show', false)
}
</script>

<style scoped>
.confirm-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
  padding: 1rem 0;
}

.confirm-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.confirm-icon.info {
  background: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
}

.confirm-icon.warning {
  background: rgba(245, 158, 11, 0.1);
  color: #DE6E4B;
}

.confirm-icon.danger {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.confirm-message {
  margin: 0;
  font-size: 0.9375rem;
  color: var(--text-primary, #111827);
  line-height: 1.5;
}

[data-theme="dark"] .confirm-message {
  color: var(--text-primary, #f9fafb);
}
</style>
