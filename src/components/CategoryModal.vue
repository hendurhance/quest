<template>
  <component :is="ModalComponent" v-bind="modalProps" @close="handleClose">
    <div class="form-group">
      <label for="categoryName">Category Name</label>
      <input
        id="categoryName"
        v-model="categoryName"
        type="text"
        placeholder="Enter category name..."
        maxlength="30"
        @keydown.enter="handleCreate"
        ref="nameInputRef"
      />
      <div v-if="error" class="error-message">{{ error }}</div>
    </div>

    <div class="form-group">
      <label>Category Color</label>
      <div class="color-actions">
        <button
          type="button"
          class="generate-color-btn"
          @click="generateNewColor"
          title="Generate random color"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
          </svg>
          Generate Color
        </button>
        <div class="current-color" :style="{ backgroundColor: selectedColor }" :title="selectedColor"></div>
      </div>
    </div>

    <div class="category-preview">
      <span class="preview-label">Preview:</span>
      <div class="category-badge">
        <span class="category-color" :style="{ backgroundColor: selectedColor }"></span>
        <span class="category-name">{{ categoryName || 'Category Name' }}</span>
      </div>
    </div>

    <template #footer>
      <button class="btn btn-secondary" @click="handleClose">Cancel</button>
      <button 
        class="btn btn-primary" 
        @click="handleCreate"
        :disabled="!isValid || isCreating"
      >
        <span v-if="isCreating" class="spinner"></span>
        {{ isCreating ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Category' : 'Create Category') }}
      </button>
    </template>
  </component>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { generateRandomColor } from '@/utils/color-generator'

// Import both modal variants
import ManagerModal from './Modal.vue'
import PopupModal from '../popup/components/Modal.vue'

interface Props {
  isOpen?: boolean
  show?: boolean
  title?: string
  existingCategories: Array<{ name: string; id: string }>
  editingCategory?: { id: string; name: string; color: string } | null
}

const props = withDefaults(defineProps<Props>(), {
  isOpen: false,
  show: false,
  title: 'Create New Category',
  editingCategory: null
})

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'create', data: { name: string; color: string }): void
  (e: 'created', data: { name: string; color: string }): void
  (e: 'updated', data: { id: string; name: string; color: string }): void
}>()

const isEditMode = computed(() => !!props.editingCategory)
// Determine which modal component to use and its props
const ModalComponent = computed(() => {
  // If isOpen is provided, use PopupModal; if show is provided, use ManagerModal
  return props.isOpen !== undefined && props.isOpen !== false ? PopupModal : ManagerModal
})

const modalProps = computed(() => {
  const title = isEditMode.value ? 'Edit Category' : (props.title || 'Create New Category')
  
  if (props.isOpen !== undefined && props.isOpen !== false) {
    // Popup Modal props
    return {
      isOpen: props.isOpen,
      title
    }
  } else {
    // Manager Modal props
    return {
      show: props.show,
      title
    }
  }
})
const categoryName = ref('')
const selectedColor = ref(generateRandomColor())
const error = ref('')
const isCreating = ref(false)
const nameInputRef = ref<HTMLInputElement>()

const generateNewColor = () => {
  selectedColor.value = generateRandomColor()
}

const isValid = computed(() => {
  return categoryName.value.trim().length >= 2
})

const handleClose = () => {
  categoryName.value = ''
  selectedColor.value = generateRandomColor()
  error.value = ''
  isCreating.value = false
  emit('close')
}

const handleCreate = async () => {
  const name = categoryName.value.trim()
  
  if (!name || name.length < 2) {
    error.value = 'Category name must be at least 2 characters'
    return
  }

  // Check if category already exists (exclude current category if editing)
  const exists = props.existingCategories.some(
    c => c.name.toLowerCase() === name.toLowerCase() && 
         (!isEditMode.value || c.id !== props.editingCategory!.id)
  )
  
  if (exists) {
    error.value = 'A category with this name already exists'
    return
  }

  isCreating.value = true
  error.value = ''

  const categoryData = {
    name,
    color: selectedColor.value
  }

  try {
    if (isEditMode.value) {
      // Emit updated event with ID
      emit('updated', {
        id: props.editingCategory!.id,
        ...categoryData
      })
    } else {
      // Emit both events for backward compatibility
      emit('create', categoryData)
      emit('created', categoryData)
    }
    
    // Reset form
    categoryName.value = ''
    selectedColor.value = generateRandomColor()
    isCreating.value = false
  } catch (err) {
    error.value = 'Failed to save category'
    isCreating.value = false
  }
}

// Watch for editing category changes
watch(() => props.editingCategory, (newVal) => {
  if (newVal) {
    categoryName.value = newVal.name
    selectedColor.value = newVal.color
  } else {
    categoryName.value = ''
    selectedColor.value = generateRandomColor()
  }
}, { immediate: true })

// Clear error when typing
watch(categoryName, () => {
  if (error.value) {
    error.value = ''
  }
})

// Focus input when modal opens (watch both props for compatibility)
watch([() => props.isOpen, () => props.show], ([isOpen, show]) => {
  if (isOpen || show) {
    nextTick(() => {
      nameInputRef.value?.focus()
    })
  }
})
</script>

<style scoped>
.form-group {
  margin-bottom: 16px;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.form-group input {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  font-size: 14px;
  background: var(--bg-primary);
  color: var(--text-primary);
  transition: all 0.2s ease;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.1);
}

.error-message {
  font-size: 12px;
  color: var(--danger-color);
  margin-top: 4px;
}

.color-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.generate-color-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 14px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.generate-color-btn:hover {
  background: var(--secondary-color);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.generate-color-btn:active {
  transform: translateY(0);
}

.generate-color-btn svg {
  animation: none;
  flex-shrink: 0;
}

.generate-color-btn:hover svg {
  animation: spin 1s ease-in-out;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.current-color {
  width: 48px;
  height: 44px;
  border-radius: var(--radius);
  border: 2px solid var(--border-color);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  cursor: pointer;
  flex-shrink: 0;
}

.current-color:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
}

.category-preview {
  padding: 12px;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
}

.preview-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.category-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: var(--bg-primary);
  border-radius: var(--radius);
  border: 1px solid var(--border-color);
}

.category-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.category-name {
  font-size: 12px;
  color: var(--text-primary);
  font-weight: 500;
}

.btn {
  padding: 8px 16px;
  border-radius: var(--radius);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-secondary {
  background: var(--bg-primary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--secondary-color);
  color: var(--text-primary);
}

.btn-primary {
  background: var(--primary-color);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  background: var(--text-secondary);
  cursor: not-allowed;
  transform: none;
  opacity: 0.6;
}

.spinner {
  width: 12px;
  height: 12px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin-animation 1s linear infinite;
}

@keyframes spin-animation {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
