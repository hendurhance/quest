<template>
  <Teleport to="body">
    <div v-if="show" class="summary-modal-overlay" @click.self="closeModal">
      <div class="summary-modal">
        <div class="summary-modal-header">
          <div class="summary-modal-title-section">
            <h3 class="summary-modal-title">AI Summary</h3>
            <span class="provider-badge" :class="summary.aiProvider.toLowerCase()">
              {{ summary.aiProvider.toUpperCase() }}
            </span>
            <span class="summary-type-badge">
              {{ getSummaryTypeDisplayName(summary.type) }}
            </span>
            <span class="model-badge" title="Model used">
              {{ summary.model || 'N/A' }}
            </span>
          </div>
          <div class="summary-modal-header-actions">
            <button class="summary-action-btn copy-btn" @click="handleCopy" title="Copy to clipboard">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
            <button class="summary-action-btn regenerate-btn" @click="handleRegenerate" title="Regenerate summary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Regenerate
            </button>
            <button class="summary-action-btn inject-btn" @click="handleInject" title="Inject into page">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16 18 22 12 16 6"></polyline>
                <polyline points="8 6 2 12 8 18"></polyline>
              </svg>
              Inject
            </button>
            <button class="summary-modal-close" @click="closeModal" title="Close">&times;</button>
          </div>
        </div>
        <div class="summary-modal-body">
          <div class="summary-content" v-html="formattedContent"></div>
        </div>
        <div class="summary-modal-footer">
          <span class="summary-modal-date">
            Generated: {{ new Date(summary.generatedDate).toLocaleString() }}
          </span>
          <span class="summary-modal-words">
            {{ wordCount }} words
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Summary, Article } from '@/types'
import { SummaryType, getSummaryTypeDisplayName } from '@/types'

interface Props {
  show: boolean
  summary: Summary
  article: Article
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'copy', content: string): void
  (e: 'regenerate', articleId: string, type: SummaryType): void
  (e: 'inject', article: Article, summary: Summary): void
}>()

const formattedContent = computed(() => {
  // Convert markdown to HTML
  return props.summary.content
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br>')
    .replace(/^(.+)$/, '<p>$1</p>')
})

const wordCount = computed(() => {
  return props.summary.content.split(/\s+/).length
})

const closeModal = () => {
  emit('close')
}

const handleCopy = async () => {
  emit('copy', props.summary.content)
}

const handleRegenerate = () => {
  emit('regenerate', props.article.id, props.summary.type)
  closeModal()
}

const handleInject = () => {
  emit('inject', props.article, props.summary)
}
</script>

<style scoped>
.summary-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.summary-modal {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 800px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.summary-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
  flex-wrap: wrap;
}

.summary-modal-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 300px;
  flex-wrap: wrap;
}

.summary-modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.summary-type-badge,
.model-badge {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  text-transform: uppercase;
}

.model-badge {
  background: #f3f4f6;
  color: #6b7280;
  border: 1px solid #e5e7eb;
  text-transform: none;
}

.provider-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.provider-badge.openai {
  background: #10a37f20;
  color: #10a37f;
}

.provider-badge.gemini {
  background: #4285f420;
  color: #4285f4;
}

.summary-modal-header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.summary-action-btn {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  background: var(--bg-secondary);
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.summary-action-btn:hover {
  background: var(--bg-tertiary);
  transform: translateY(-1px);
}

.copy-btn {
  background: var(--primary-color);
  color: white;
}

.copy-btn:hover {
  background: var(--primary-hover);
}

.regenerate-btn {
  background: #f59e0b20;
  color: #f59e0b;
}

.regenerate-btn:hover {
  background: #f59e0b30;
}

.inject-btn {
  background: #10b98120;
  color: #10b981;
}

.inject-btn:hover {
  background: #10b98130;
}

.summary-modal-close {
  padding: 8px 12px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 20px;
  background: var(--bg-secondary);
  color: var(--text-primary);
  transition: all 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.summary-modal-close:hover {
  background: #ef444420;
  color: #ef4444;
}

.summary-modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.summary-modal-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.summary-modal-date,
.summary-modal-words {
  font-size: 13px;
  color: var(--text-secondary);
}

.summary-content {
  font-size: 16px;
  line-height: 1.7;
  color: var(--text-primary);
}

.summary-content :deep(h1),
.summary-content :deep(h2),
.summary-content :deep(h3) {
  margin-top: 24px;
  margin-bottom: 12px;
  color: var(--text-primary);
}

.summary-content :deep(h1) {
  font-size: 24px;
}

.summary-content :deep(h2) {
  font-size: 20px;
}

.summary-content :deep(h3) {
  font-size: 18px;
}

.summary-content :deep(p) {
  margin-bottom: 16px;
}

.summary-content :deep(ul),
.summary-content :deep(ol) {
  margin-bottom: 16px;
  padding-left: 24px;
}

.summary-content :deep(li) {
  margin-bottom: 8px;
}

.summary-content :deep(strong) {
  font-weight: 600;
  color: var(--text-primary);
}

.summary-content :deep(em) {
  font-style: italic;
}

.summary-content :deep(code) {
  background: var(--bg-secondary);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
}

.summary-content :deep(pre) {
  background: var(--bg-secondary);
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin-bottom: 16px;
}

.summary-content :deep(blockquote) {
  border-left: 4px solid var(--primary-color);
  padding-left: 16px;
  margin: 16px 0;
  color: var(--text-secondary);
  font-style: italic;
}
</style>
