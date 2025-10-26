<template>
  <Modal :show="show" :title="isEditMode ? 'Edit Article' : 'Add Article'" @close="handleClose">
    <form @submit.prevent="handleSubmit" class="article-form">
      <div class="form-group">
        <label for="url">URL *</label>
        <input 
          id="url" 
          v-model="formData.url" 
          type="url"
          placeholder="https://example.com/article"
          class="form-control"
          required
          :disabled="isEditMode"
        >
        <small class="form-hint">The article URL</small>
      </div>

      <div class="form-group">
        <label for="title">Title *</label>
        <input 
          id="title" 
          v-model="formData.title" 
          type="text"
          placeholder="Article title"
          class="form-control"
          required
        >
      </div>

      <div class="form-group">
        <label for="category">Category</label>
        <select id="category" v-model="formData.category" class="form-control">
          <option value="Uncategorized">Uncategorized</option>
          <option v-for="cat in categories" :key="cat.id" :value="cat.id">
            {{ cat.name }}
          </option>
        </select>
      </div>

      <div class="form-group">
        <label for="tags">Tags</label>
        <div class="tags-input-container">
          <Badge 
            v-for="tag in formData.tags" 
            :key="tag"
            variant="primary"
            removable
            @remove="removeTag(tag)"
          >
            {{ tag }}
          </Badge>
          <input 
            id="tags"
            v-model="tagInput"
            type="text"
            placeholder="Add tag..."
            class="tag-input"
            @keydown.enter.prevent="addTag"
            @keydown.comma.prevent="addTag"
            @input="handleTagInput"
            @focus="showTagSuggestions = true"
            @blur="hideTagSuggestions"
          >
          <div v-if="showTagSuggestions && filteredTagSuggestions.length > 0" class="tag-suggestions">
            <div
              v-for="suggestion in filteredTagSuggestions"
              :key="suggestion"
              class="tag-suggestion"
              @mousedown.prevent="selectSuggestion(suggestion)"
            >
              <svg class="tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                <line x1="7" y1="7" x2="7.01" y2="7"/>
              </svg>
              {{ suggestion }}
            </div>
          </div>
          <div v-if="showTagSuggestions && tagInput.trim() && !filteredTagSuggestions.length" class="tag-suggestions">
            <div class="tag-suggestion create-new" @mousedown.prevent="addTag">
              <svg class="tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="16"/>
                <line x1="8" y1="12" x2="16" y2="12"/>
              </svg>
              Create "{{ tagInput.trim() }}"
            </div>
          </div>
        </div>
        <small class="form-hint">Press Enter or comma to add tags</small>
      </div>

      <div class="form-group">
        <div class="checkbox-group">
          <input 
            id="isPinned" 
            v-model="formData.isPinned" 
            type="checkbox"
            class="checkbox"
          >
          <label for="isPinned">Pin this article</label>
        </div>
      </div>

      <div class="form-group">
        <div class="checkbox-group">
          <input 
            id="isRead" 
            v-model="formData.isRead" 
            type="checkbox"
            class="checkbox"
          >
          <label for="isRead">Mark as read</label>
        </div>
      </div>
    </form>

    <template #footer>
      <Button variant="secondary" @click="handleClose">Cancel</Button>
      <Button variant="primary" :loading="saving" @click="handleSubmit">
        {{ isEditMode ? 'Update' : 'Add' }} Article
      </Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { Modal, Button, Badge } from '@/components'
import { useStorage } from '@/composables/useStorage'
import { useNotification } from '@/composables/useNotification'
import { normalizeUrl } from '@/utils/formatters'
import type { Article } from '@/types'

interface Props {
  show: boolean
  article?: Article
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:show', value: boolean): void
  (e: 'saved'): void
}>()

const { saveArticle, updateArticle, tags: allTags, loadTags, categories, loadCategories } = useStorage()
const { success, error: showError } = useNotification()

const isEditMode = computed(() => !!props.article)

// Form state
const formData = ref({
  url: '',
  title: '',
  category: 'Uncategorized',
  tags: [] as string[],
  isPinned: false,
  isRead: false,
})

const tagInput = ref('')
const saving = ref(false)
const showTagSuggestions = ref(false)

// Tag suggestions based on existing tags
const filteredTagSuggestions = computed(() => {
  const input = tagInput.value.toLowerCase().trim()
  if (!input) return []
  
  return allTags.value
    .filter(tag => 
      tag.name.toLowerCase().includes(input) && 
      !formData.value.tags.includes(tag.name)
    )
    .map(tag => tag.name)
    .slice(0, 5)
})

// Load article data when modal opens
watch(() => props.show, async (newValue) => {
  if (newValue) {
    // Load tags and categories for suggestions
    await loadTags()
    await loadCategories()
    
    if (props.article) {
      // Edit mode - populate form
      formData.value = {
        url: props.article.actualUrl,
        title: props.article.title,
        category: props.article.organization.category,
        tags: [...props.article.organization.tags],
        isPinned: props.article.organization.isPinned,
        isRead: props.article.organization.isRead,
      }
    } else {
      // Add mode - reset form
      resetForm()
    }
  }
})

const resetForm = () => {
  formData.value = {
    url: '',
    title: '',
    category: 'Uncategorized',
    tags: [],
    isPinned: false,
    isRead: false,
  }
  tagInput.value = ''
}

const handleTagInput = () => {
  showTagSuggestions.value = true
}

const addTag = () => {
  const tag = tagInput.value.trim()
  if (tag && !formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    tagInput.value = ''
    showTagSuggestions.value = false
  }
}

const selectSuggestion = (tag: string) => {
  if (!formData.value.tags.includes(tag)) {
    formData.value.tags.push(tag)
    tagInput.value = ''
    showTagSuggestions.value = false
  }
}

const hideTagSuggestions = () => {
  setTimeout(() => {
    showTagSuggestions.value = false
  }, 200)
}

const removeTag = (tag: string) => {
  formData.value.tags = formData.value.tags.filter(t => t !== tag)
}

const handleSubmit = async () => {
  saving.value = true
  try {
    if (isEditMode.value && props.article) {
      // Update existing article
      await updateArticle(props.article.id, {
        title: formData.value.title,
        organization: {
          ...props.article.organization,
          category: formData.value.category,
          tags: formData.value.tags,
          isPinned: formData.value.isPinned,
          isRead: formData.value.isRead,
        },
        timestamps: {
          ...props.article.timestamps,
          dateRead: formData.value.isRead ? new Date().toISOString() : props.article.timestamps.dateRead,
        },
      })
      success('Article updated successfully')
    } else {
      // Create new article
      
      // Validate URL
      let url: URL
      try {
        url = new URL(formData.value.url)
      } catch (urlError) {
        showError('Invalid URL format. Please enter a valid URL.')
        saving.value = false
        return
      }
      
      const domain = url.hostname.replace('www.', '')
      
      const articleData = {
        actualUrl: formData.value.url,
        cleanUrl: normalizeUrl(formData.value.url),
        title: formData.value.title,
        domain,
        content: '',
        organization: {
          category: formData.value.category,
          tags: formData.value.tags,
          isPinned: formData.value.isPinned,
          isArchived: false,
          isRead: formData.value.isRead,
        },
      }
      
      await saveArticle(articleData)
      success('Article added successfully')
    }
    
    emit('saved')
    handleClose()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    showError(isEditMode.value ? `Failed to update article: ${errorMessage}` : `Failed to add article: ${errorMessage}`)
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  emit('close')
  emit('update:show', false)
}
</script>

<style scoped>
.article-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #111827);
  margin-bottom: 0.375rem;
}

.form-control {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.9375rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background-color: var(--bg-primary, white);
  color: var(--text-primary, #111827);
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #4285f4);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.form-control:disabled {
  background-color: var(--secondary-bg, #f3f4f6);
  cursor: not-allowed;
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-group label {
  margin: 0;
  cursor: pointer;
  font-weight: 400;
}

.form-hint {
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
}

.tags-input-container {
  position: relative;
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background-color: var(--bg-primary, white);
  min-height: 42px;
}

.tags-input-container:focus-within {
  border-color: var(--primary-color, #4285f4);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.tag-input {
  flex: 1;
  min-width: 120px;
  border: none;
  outline: none;
  padding: 0.25rem;
  font-size: 0.9375rem;
  background: transparent;
  color: var(--text-primary, #111827);
}

.tag-suggestions {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 4px;
  background: var(--bg-primary, white);
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
}

.tag-suggestion {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  transition: background-color 0.15s;
  font-size: 0.9375rem;
  color: var(--text-primary, #111827);
}

.tag-suggestion:hover {
  background-color: var(--secondary-color, #f3f4f6);
}

.tag-suggestion.create-new {
  color: var(--primary-color, #4285f4);
  font-weight: 500;
  border-top: 1px solid var(--border-color, #d1d5db);
}

.tag-icon {
  font-size: 14px;
  flex-shrink: 0;
}

/* Dark mode */
[data-theme="dark"] .form-group label {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .form-control {
  background-color: var(--bg-secondary, #374151);
  border-color: var(--border-color, #4b5563);
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .form-control:disabled {
  background-color: var(--secondary-bg, #4b5563);
}

[data-theme="dark"] .tags-input-container {
  background-color: var(--bg-secondary, #374151);
  border-color: var(--border-color, #4b5563);
}

[data-theme="dark"] .tag-input {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .tag-suggestions {
  background-color: var(--bg-secondary, #374151);
  border-color: var(--border-color, #4b5563);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
}

[data-theme="dark"] .tag-suggestion {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .tag-suggestion:hover {
  background-color: var(--secondary-bg, #4b5563);
}

[data-theme="dark"] .tag-suggestion.create-new {
  border-top-color: var(--border-color, #4b5563);
}
</style>
