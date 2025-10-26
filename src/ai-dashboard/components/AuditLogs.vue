<template>
  <section class="audit-logs-section">
    <div class="section-header">
      <div class="section-title-group">
        <h2 class="section-title">Audit Logs</h2>
        <p class="section-subtitle">Track all AI operations and their outcomes</p>
      </div>
      <div class="section-actions">
        <div class="search-box">
          <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="8" stroke="currentColor" stroke-width="2"/>
            <path d="M21 21L16.65 16.65" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <input 
            :value="searchQuery"
            @input="$emit('update:searchQuery', ($event.target as HTMLInputElement).value)"
            type="text" 
            placeholder="Search logs..."
            class="search-input"
          >
        </div>
        <select 
          :value="filterProvider"
          @change="$emit('update:filterProvider', ($event.target as HTMLSelectElement).value)"
          class="filter-select"
        >
          <option value="">All Providers</option>
          <option value="openai">OpenAI</option>
          <option value="gemini">Gemini</option>
          <option value="elevenlabs">ElevenLabs</option>
        </select>
        <select 
          :value="filterAction"
          @change="$emit('update:filterAction', ($event.target as HTMLSelectElement).value)"
          class="filter-select"
        >
          <option value="">All Actions</option>
          <option value="generate_summary">Generate Summary</option>
          <option value="generate_podcast">Generate Podcast</option>
        </select>
      </div>
    </div>

    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading audit logs...</p>
    </div>

    <div v-else-if="logs.length === 0" class="empty-state">
      <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
        <path d="M9 12h6M9 16h6M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
      </svg>
      <h3>No audit logs found</h3>
      <p>AI operations will be logged here</p>
    </div>

    <div v-else class="logs-container">
      <div class="table-wrapper">
        <table class="audit-table">
          <thead>
            <tr>
              <th class="col-timestamp">Timestamp</th>
              <th class="col-action">Action</th>
              <th class="col-provider">Provider</th>
              <th class="col-article">Article</th>
              <th class="col-status">Status</th>
              <th class="col-details">Details</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id" class="log-row">
              <td class="col-timestamp">
                <span class="timestamp">{{ formatDateTime(log.timestamp) }}</span>
              </td>
              <td class="col-action">
                <span class="badge badge-default">{{ formatAction(log.action) }}</span>
              </td>
              <td class="col-provider">
                <span :class="['badge', `badge-${getProviderColor(log.provider)}`]">
                  {{ log.provider }}
                </span>
              </td>
              <td class="col-article">
                <button 
                  v-if="log.articleId" 
                  @click="$emit('open-article', log.articleId)"
                  class="article-link"
                >
                  {{ getArticleTitle(log.articleId) }}
                </button>
                <span v-else class="no-data">—</span>
              </td>
              <td class="col-status">
                <span :class="['status-badge', log.success ? 'status-success' : 'status-error']">
                  <span class="status-dot"></span>
                  {{ log.success ? 'Success' : 'Failed' }}
                </span>
              </td>
              <td class="col-details">
                <div class="details">
                  <span v-if="log.details?.tokenCount" class="detail-item">
                    {{ log.details.tokenCount.toLocaleString() }} tokens
                  </span>
                  <span v-if="log.details?.duration" class="detail-item">
                    {{ log.details.duration }}s
                  </span>
                  <span v-if="log.error" class="error-text">{{ log.error }}</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="pagination">
        <button 
          @click="$emit('update:currentPage', currentPage - 1)"
          :disabled="currentPage === 1"
          class="page-btn"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Previous
        </button>
        <div class="page-numbers">
          <span class="page-info">Page <strong>{{ currentPage }}</strong> of <strong>{{ totalPages }}</strong></span>
        </div>
        <button 
          @click="$emit('update:currentPage', currentPage + 1)"
          :disabled="currentPage === totalPages"
          class="page-btn"
        >
          Next
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 18l6-6-6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatDateTime } from '@/utils/formatters'
import { AIProvider } from '@/types'

interface AuditLog {
  id: string
  timestamp: string
  action: string
  provider?: string
  articleId?: string
  success: boolean
  details?: {
    tokenCount?: number
    duration?: number
    characters?: number
  }
  error?: string
}

interface Props {
  logs: AuditLog[]
  loading: boolean
  searchQuery: string
  filterProvider: string
  filterAction: string
  currentPage: number
  totalPages: number
  getArticleTitle: (id: string) => string
}

defineProps<Props>()

defineEmits<{
  'update:searchQuery': [value: string]
  'update:filterProvider': [value: string]
  'update:filterAction': [value: string]
  'update:currentPage': [value: number]
  'open-article': [id: string]
}>()

const formatAction = (action: string): string => {
  return action.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ')
}

const getProviderColor = (provider?: string): string => {
  if (provider === AIProvider.OPENAI) return 'primary'
  if (provider === AIProvider.GEMINI) return 'success'
  if (provider === AIProvider.ELEVENLABS) return 'warning'
  return 'default'
}
</script>

<style scoped>
.audit-logs-section {
  margin-bottom: 48px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
}

.section-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.section-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.search-box {
  position: relative;
  min-width: 280px;
}

.search-icon {
  position: absolute;
  left: 14px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 10px 14px 10px 40px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color);
  background: var(--bg-primary);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.search-input::placeholder {
  color: var(--text-secondary);
}

.filter-select {
  padding: 10px 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--primary-color);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

.loading-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  text-align: center;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--border-color);
  border-top-color: var(--primary-color);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-state p {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.empty-state svg {
  margin-bottom: 16px;
  color: var(--text-secondary);
}

.empty-state h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0;
}

.logs-container {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.audit-table {
  width: 100%;
  border-collapse: collapse;
}

.audit-table thead {
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-color);
}

.audit-table th {
  padding: 16px;
  text-align: left;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.audit-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s;
}

.audit-table tbody tr:last-child {
  border-bottom: none;
}

.audit-table tbody tr:hover {
  background: var(--bg-secondary);
}

.audit-table td {
  padding: 16px;
  font-size: 14px;
  color: var(--text-primary);
}

.timestamp {
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.badge-default {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.badge-primary {
  background: #EEF2FF;
  color: #4F46E5;
}

.badge-success {
  background: #ECFDF5;
  color: #059669;
}

.badge-warning {
  background: #E0F2F4;
  color: #0B3C49;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
}

.status-success {
  background: #ECFDF5;
  color: #059669;
}

.status-error {
  background: #FEE2E2;
  color: #DC2626;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.article-link {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-align: left;
  text-decoration: none;
  transition: color 0.2s;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.article-link:hover {
  color: var(--primary-hover);
  text-decoration: underline;
}

.no-data {
  color: var(--text-secondary);
}

.details {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-item {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

.error-text {
  font-size: 12px;
  color: var(--danger-color);
  font-weight: 500;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-top: 1px solid var(--border-color);
}

.page-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.page-btn:hover:not(:disabled) {
  background: var(--bg-primary);
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 8px;
}

.page-info {
  font-size: 14px;
  color: var(--text-secondary);
  font-weight: 500;
}

.page-info strong {
  color: var(--text-primary);
  font-weight: 700;
}

@media (max-width: 1024px) {
  .section-header {
    flex-direction: column;
  }

  .section-actions {
    width: 100%;
  }

  .search-box {
    flex: 1;
    min-width: 0;
  }
}

@media (max-width: 768px) {
  .table-wrapper {
    overflow-x: scroll;
  }

  .audit-table {
    min-width: 800px;
  }

  .pagination {
    flex-direction: column;
    gap: 16px;
  }
}
</style>
