<template>
  <Modal :show="show" title="Export / Import Data" @close="handleClose">
    <div class="export-import-container">
      <!-- Export Section -->
      <section class="section">
        <h3 class="section-title">Export Data</h3>
        <p class="section-description">
          Export all your articles, categories, and tags as a JSON file.
        </p>

        <div class="warning-message">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div class="warning-content">
            <strong>Note:</strong> Audio podcasts cannot be exported and will need to be regenerated after import.
          </div>
        </div>
        
        <div class="export-options">
          <div class="checkbox-group">
            <input 
              id="exportArticles" 
              v-model="exportOptions.articles" 
              type="checkbox"
              class="checkbox"
            >
            <label for="exportArticles">Articles ({{ stats.articles }})</label>
          </div>
          
          <div class="checkbox-group">
            <input 
              id="exportCategories" 
              v-model="exportOptions.categories" 
              type="checkbox"
              class="checkbox"
            >
            <label for="exportCategories">Categories ({{ stats.categories }})</label>
          </div>
          
          <div class="checkbox-group">
            <input 
              id="exportTags" 
              v-model="exportOptions.tags" 
              type="checkbox"
              class="checkbox"
            >
            <label for="exportTags">Tags ({{ stats.tags }})</label>
          </div>

          <div class="checkbox-group">
            <input 
              id="exportSettings" 
              v-model="exportOptions.settings" 
              type="checkbox"
              class="checkbox"
            >
            <label for="exportSettings">Settings</label>
          </div>
        </div>

        <Button 
          variant="primary"
          :loading="exporting"
          :disabled="!hasExportSelection"
          @click="handleExport"
        >
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </template>
          Export Selected Data
        </Button>
      </section>

      <!-- Import Section -->
      <section class="section">
        <h3 class="section-title">Import Data</h3>
        <p class="section-description">
          Import articles and data from a previously exported JSON file.
        </p>

        <div class="import-area">
          <input 
            ref="fileInput"
            type="file" 
            accept=".json"
            class="file-input"
            @change="handleFileSelect"
          >
          
          <div 
            class="drop-zone"
            :class="{ 'drop-zone-active': isDragging }"
            @click="triggerFileInput"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="handleFileDrop"
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <p class="drop-zone-text">
              <template v-if="selectedFile">
                <strong>{{ selectedFile.name }}</strong>
                <span>({{ formatFileSize(selectedFile.size) }})</span>
              </template>
              <template v-else>
                Click to select or drag and drop a JSON file
              </template>
            </p>
          </div>
        </div>

        <div v-if="importPreview" class="import-preview">
          <h4 class="preview-title">Preview</h4>
          <div class="preview-stats">
            <div v-if="importPreview.articles" class="preview-stat">
              <span class="preview-label">Articles:</span>
              <span class="preview-value">{{ importPreview.articles.length }}</span>
            </div>
            <div v-if="importPreview.categories" class="preview-stat">
              <span class="preview-label">Categories:</span>
              <span class="preview-value">{{ importPreview.categories.length }}</span>
            </div>
            <div v-if="importPreview.tags" class="preview-stat">
              <span class="preview-label">Tags:</span>
              <span class="preview-value">{{ importPreview.tags.length }}</span>
            </div>
          </div>

          <div class="import-options">
            <div class="checkbox-group">
              <input 
                id="mergeData" 
                v-model="importMerge" 
                type="checkbox"
                class="checkbox"
              >
              <label for="mergeData">Merge with existing data (instead of replace)</label>
            </div>
          </div>
        </div>

        <Button 
          v-if="selectedFile"
          variant="primary"
          :loading="importing"
          @click="handleImport"
        >
          <template #icon>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </template>
          Import Data
        </Button>
      </section>
    </div>

    <template #footer>
      <Button variant="secondary" @click="handleClose">Close</Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { Modal, Button } from '@/components'
import { useStorage } from '@/composables/useStorage'
import { useNotification } from '@/composables/useNotification'
import { storage } from '@/utils/storage'

interface Props {
  show: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:show', value: boolean): void
  (e: 'imported'): void
}>()

const { articles, categories, tags, loadArticles, loadCategories, loadTags, init } = useStorage()
const { success, error: showError } = useNotification()

// Export state
const exportOptions = ref({
  articles: true,
  categories: true,
  tags: true,
  settings: true,
})
const exporting = ref(false)

// Import state
const fileInput = ref<HTMLInputElement | null>(null)
const selectedFile = ref<File | null>(null)
const importPreview = ref<any>(null)
const importMerge = ref(true)
const importing = ref(false)
const isDragging = ref(false)

// Computed
const stats = computed(() => ({
  articles: articles.value.length,
  categories: categories.value.length,
  tags: tags.value.length,
}))

const hasExportSelection = computed(() => {
  return Object.values(exportOptions.value).some(v => v)
})

// Reset state when modal opens
watch(() => props.show, async (newValue) => {
  if (newValue) {
    resetImportState()
    
    // Load fresh data when modal opens
    try {
      await init()
      await Promise.all([
        loadArticles(),
        loadCategories(),
        loadTags()
      ])
    } catch (err) {
      showError('Error loading data for export/import')
    }
  }
})

const handleExport = async () => {
  if (!hasExportSelection.value) {
    showError('Please select at least one data type to export')
    return
  }

  exporting.value = true
  try {
    const exportData: any = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      appVersion: chrome.runtime.getManifest().version,
    }

    if (exportOptions.value.articles) {
      // Load all summaries first
      await storage.init()
      const allSummaries = await storage.getAllSummaries()
      
      // Create a map of article ID to summary for quick lookup
      const summaryMap = new Map(
        allSummaries.map(summary => [summary.articleId, summary])
      )

      // Export articles with their summaries, but without audio files
      exportData.articles = articles.value.map(article => {
        const summary = summaryMap.get(article.id)
        
        return {
          ...article,
          // Include the summary if it exists
          aiSummary: summary ? {
            id: summary.id,
            articleId: summary.articleId,
            content: summary.content,
            type: summary.type,
            aiProvider: summary.aiProvider,
            model: summary.model,
            generatedDate: summary.generatedDate,
            tokenCount: summary.tokenCount,
            inputTokens: summary.inputTokens,
            outputTokens: summary.outputTokens,
            totalTokens: summary.totalTokens,
            estimatedCost: summary.estimatedCost,
            // Exclude audio-related fields - will need to be regenerated
            audioUrl: undefined,
            audioBlob: undefined,
            duration: undefined,
            voiceName: undefined
          } : undefined,
          // Remove runtime podcast blob URL
          audioPodcast: undefined,
        }
      })
    }
    
    if (exportOptions.value.categories) {
      exportData.categories = categories.value
    }
    
    if (exportOptions.value.tags) {
      exportData.tags = tags.value
    }
    
    if (exportOptions.value.settings) {
      const { settings } = await chrome.storage.sync.get(['settings'])
      exportData.settings = settings
    }

    const jsonString = JSON.stringify(exportData, null, 2)
    const blob = new Blob([jsonString], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quest-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    success(`Exported ${Object.keys(exportData).filter(k => !['version', 'exportDate', 'appVersion'].includes(k)).join(', ')}`)
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    showError(`Failed to export data: ${errorMessage}`)
  } finally {
    exporting.value = false
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  if (target.files && target.files[0]) {
    processFile(target.files[0])
  }
}

const handleFileDrop = (event: DragEvent) => {
  isDragging.value = false
  if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
    processFile(event.dataTransfer.files[0])
  }
}

const processFile = async (file: File) => {
  if (!file.name.endsWith('.json')) {
    showError('Please select a JSON file')
    return
  }

  selectedFile.value = file

  try {
    const text = await file.text()
    const data = JSON.parse(text)
    
    // Count items for preview
    const itemCounts = {
      articles: data.articles?.length || 0,
      categories: data.categories?.length || 0,
      tags: data.tags?.length || 0,
    }
    
    if (itemCounts.articles === 0 && itemCounts.categories === 0 && itemCounts.tags === 0) {
      showError('No valid data found in the file')
      selectedFile.value = null
      importPreview.value = null
      return
    }
    
    importPreview.value = data
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Invalid file format'
    showError(`Invalid JSON file: ${errorMessage}`)
    selectedFile.value = null
    importPreview.value = null
  }
}

const handleImport = async () => {
  if (!importPreview.value) {
    showError('No data to import')
    return
  }

  importing.value = true
  try {
    const data = importPreview.value

    // Import via background script to handle IndexedDB
    const response = await chrome.runtime.sendMessage({
      action: 'importData',
      data,
      merge: importMerge.value,
    })

    if (response && response.success) {
      const importedItems = []
      if (data.articles) importedItems.push(`${data.articles.length} articles`)
      if (data.categories) importedItems.push(`${data.categories.length} categories`)
      if (data.tags) importedItems.push(`${data.tags.length} tags`)
      if (data.settings && !importMerge.value) importedItems.push('settings')
      
      success(`Successfully imported: ${importedItems.join(', ')}`)
      
      // Wait a bit for the background script to finish
      await new Promise(resolve => setTimeout(resolve, 500))
      
      emit('imported')
      handleClose()
    } else {
      const errorMsg = response?.error || 'Failed to import data'
      showError(errorMsg)
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    showError(`Failed to import data: ${errorMessage}`)
  } finally {
    importing.value = false
  }
}

const resetImportState = () => {
  selectedFile.value = null
  importPreview.value = null
  importMerge.value = true
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const handleClose = () => {
  emit('close')
  emit('update:show', false)
}
</script>

<style scoped>
.export-import-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.section {
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 0.5rem;
}

.section-description {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin: 0 0 1rem;
}

.warning-message {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  background-color: #E0F2F4;
  border: 1px solid #1FB6CC;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.warning-message svg {
  flex-shrink: 0;
  color: #0B3C49;
  margin-top: 2px;
}

.warning-content {
  font-size: 0.875rem;
  color: #084158;
  line-height: 1.5;
}

.warning-content strong {
  font-weight: 600;
  display: inline;
  margin-right: 0.25rem;
}

.export-options,
.import-options {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
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
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
}

.file-input {
  display: none;
}

.import-area {
  margin-bottom: 1rem;
}

.drop-zone {
  border: 2px dashed var(--border-color, #d1d5db);
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  background-color: var(--bg-secondary, #f9fafb);
}

.drop-zone:hover,
.drop-zone-active {
  border-color: var(--primary-color, #4285f4);
  background-color: rgba(66, 133, 244, 0.05);
}

.drop-zone svg {
  color: var(--text-tertiary, #9ca3af);
  margin-bottom: 0.75rem;
}

.drop-zone-text {
  margin: 0;
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
}

.drop-zone-text strong {
  display: block;
  color: var(--text-primary, #111827);
  margin-bottom: 0.25rem;
}

.import-preview {
  background-color: var(--bg-secondary, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
}

.preview-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 0.75rem;
}

.preview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.preview-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background-color: var(--bg-primary, white);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
}

.preview-label {
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
}

.preview-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

/* Dark mode */
[data-theme="dark"] .section {
  border-color: var(--border-color, #374151);
}

[data-theme="dark"] .section-title {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .section-description {
  color: var(--text-secondary, #9ca3af);
}

[data-theme="dark"] .warning-message {
  background-color: #0A2A32;
  border-color: #17A3B8;
}

[data-theme="dark"] .warning-message svg {
  color: #1FB6CC;
}

[data-theme="dark"] .warning-content {
  color: #E0F2F4;
}

[data-theme="dark"] .checkbox-group label {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .drop-zone {
  background-color: var(--bg-secondary, #374151);
  border-color: var(--border-color, #4b5563);
}

[data-theme="dark"] .drop-zone-text strong {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .import-preview {
  background-color: var(--bg-secondary, #374151);
  border-color: var(--border-color, #4b5563);
}

[data-theme="dark"] .preview-title {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .preview-stat {
  background-color: var(--bg-primary, #1f2937);
  border-color: var(--border-color, #4b5563);
}

[data-theme="dark"] .preview-value {
  color: var(--text-primary, #f9fafb);
}
</style>
