<template>
  <div class="current-page">
    <div class="save-section">
      <div class="tags-input">
        <input
          v-model="localTagsInput"
          type="text"
          placeholder="Add tags (e.g., AI, Design)"
          @input="handleTagsInput"
          @focus="showSuggestions = true"
          @blur="hideTagSuggestions"
          @keydown.enter.prevent="addCurrentTag"
          @keydown.comma.prevent="addCurrentTag"
        />
        <div v-if="showSuggestions && tagSuggestions.length > 0" class="tag-suggestions">
          <div
            v-for="suggestion in tagSuggestions"
            :key="suggestion"
            class="tag-suggestion"
            @mousedown.prevent="selectTag(suggestion)"
          >
            <svg class="tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            {{ suggestion }}
          </div>
        </div>
        <div v-if="showSuggestions && currentTypingTag && !tagSuggestions.length && !isExistingTag" class="tag-suggestions">
          <div class="tag-suggestion create-new" @mousedown.prevent="addCurrentTag">
            <svg class="tag-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            Create "{{ currentTypingTag }}"
          </div>
        </div>
      </div>

      <div class="save-options">
        <select v-model="localSelectedCategory" @change="handleCategoryChange">
          <option value="" disabled>Select Category</option>
          <option v-for="category in categories" :key="category.id" :value="category.id">
            {{ category.name }}
          </option>
          <option value="new-category">+ Create New Category</option>
        </select>

        <label class="checkbox-label">
          <input v-model="localCloseTabAfterSave" type="checkbox" />
          <span class="checkmark"></span>
          Close tab after saving
        </label>
      </div>

      <div class="ai-features">
        <label class="checkbox-label">
          <input v-model="localGenerateSummary" type="checkbox" />
          <span class="checkmark"></span>
          Generate AI summary
        </label>
        <label class="checkbox-label">
          <input v-model="localCreatePodcast" type="checkbox" />
          <span class="checkmark"></span>
          Create podcast
        </label>
      </div>

      <button @click="$emit('save')" :class="{ saving: isSaving }" class="save-btn" :disabled="isSaving || isAlreadySaved">
        <svg class="btn-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path v-if="!isSaving && !isAlreadySaved" d="M6 2C4.9 2 4 2.9 4 4V20L12 17L20 20V4C20 2.9 19.1 2 18 2H6Z" fill="currentColor"/>
          <path v-if="isAlreadySaved" d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        {{ isAlreadySaved ? 'Already Saved' : (isSaving ? 'Saving...' : 'Save for Later') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Category } from '@/types'

interface Props {
  tagsInput: string
  selectedCategory: string
  closeTabAfterSave: boolean
  generateSummary: boolean
  createPodcast: boolean
  isSaving: boolean
  isAlreadySaved: boolean
  categories: Category[]
  allTags: string[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:tagsInput': [value: string]
  'update:selectedCategory': [value: string]
  'update:closeTabAfterSave': [value: boolean]
  'update:generateSummary': [value: boolean]
  'update:createPodcast': [value: boolean]
  'save': []
  'create-category': []
}>()

// Local reactive values with two-way binding
const localTagsInput = computed({
  get: () => props.tagsInput,
  set: (value) => emit('update:tagsInput', value)
})

const localSelectedCategory = computed({
  get: () => props.selectedCategory,
  set: (value) => emit('update:selectedCategory', value)
})

const localCloseTabAfterSave = computed({
  get: () => props.closeTabAfterSave,
  set: (value) => emit('update:closeTabAfterSave', value)
})

const localGenerateSummary = computed({
  get: () => props.generateSummary,
  set: (value) => emit('update:generateSummary', value)
})

const localCreatePodcast = computed({
  get: () => props.createPodcast,
  set: (value) => emit('update:createPodcast', value)
})

// Tag suggestions
const showSuggestions = ref(false)
const tagSuggestions = ref<string[]>([])

const currentTypingTag = computed(() => {
  const tags = localTagsInput.value.split(',').map(t => t.trim())
  const lastTag = tags[tags.length - 1]
  return lastTag
})

const isExistingTag = computed(() => {
  const tag = currentTypingTag.value.toLowerCase()
  return props.allTags.some(t => t.toLowerCase() === tag)
})

const handleTagsInput = () => {
  const input = currentTypingTag.value.toLowerCase()
  if (input.length > 0) {
    tagSuggestions.value = props.allTags
      .filter(tag => 
        tag.toLowerCase().includes(input) && 
        !localTagsInput.value.split(',').map(t => t.trim()).includes(tag)
      )
      .slice(0, 5)
    showSuggestions.value = true
  } else {
    showSuggestions.value = false
  }
}

const addCurrentTag = () => {
  const tag = currentTypingTag.value.trim()
  if (tag) {
    const currentTags = localTagsInput.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
    // Remove the last incomplete tag and add the new one
    currentTags.pop()
    currentTags.push(tag)
    localTagsInput.value = currentTags.join(', ') + ', '
    showSuggestions.value = false
  }
}

const selectTag = (tag: string) => {
  const currentTags = localTagsInput.value.split(',').map(t => t.trim()).filter(t => t.length > 0)
  // Remove the last incomplete tag
  currentTags.pop()
  currentTags.push(tag)
  localTagsInput.value = currentTags.join(', ') + ', '
  showSuggestions.value = false
}

const hideTagSuggestions = () => {
  setTimeout(() => {
    showSuggestions.value = false
  }, 200)
}

const handleCategoryChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  if (target.value === 'new-category') {
    emit('create-category')
    // Reset to empty after modal closes
    localSelectedCategory.value = ''
  }
}
</script>

<style scoped>
/* Current page section */
.current-page {
    margin-bottom: 20px;
}

/* Save section */
.save-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.tags-input {
    position: relative;
}

.tags-input input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 14px;
    background: var(--bg-primary);
    color: var(--text-primary);
    transition: border-color 0.2s;
}

.tags-input input:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.tag-suggestions {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-top: none;
    border-radius: 0 0 var(--radius) var(--radius);
    max-height: 180px;
    overflow-y: auto;
    z-index: 10;
    margin-top: 2px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.tag-suggestion {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    cursor: pointer;
    font-size: 13px;
    border-bottom: 1px solid var(--border-color);
    transition: background-color 0.15s;
}

.tag-suggestion:last-child {
    border-bottom: none;
}

.tag-suggestion:hover {
    background: var(--secondary-color);
}

.tag-suggestion.create-new {
    color: var(--primary-color);
    font-weight: 500;
    border-top: 1px solid var(--border-color);
}

.tag-icon {
    font-size: 14px;
    flex-shrink: 0;
}

.save-options {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
}

.save-options select {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 13px;
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--text-secondary);
    cursor: pointer;
    user-select: none;
}

.checkbox-label input {
    display: none;
}

.checkmark {
    width: 16px;
    height: 16px;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
}

.checkbox-label input:checked + .checkmark {
    background: var(--primary-color);
    border-color: var(--primary-color);
}

.checkbox-label input:checked + .checkmark::after {
    content: '✓';
    color: white;
    font-size: 10px;
    font-weight: bold;
}

.save-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--primary-color);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    width: 100%;
}

.save-btn:hover {
    background: var(--primary-hover);
    transform: translateY(-1px);
}

.save-btn:active {
    transform: translateY(1px);
}

.save-btn:disabled {
    background: var(--text-secondary);
    cursor: not-allowed;
    transform: none;
}

.save-btn.saving {
    background: var(--text-secondary);
    cursor: not-allowed;
}

/* AI Features */
.ai-features {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 16px;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

/* Responsive adjustments */
@media (max-width: 400px) {
    .save-options {
        flex-direction: column;
        align-items: flex-start;
    }
}
</style>
