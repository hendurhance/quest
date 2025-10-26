<template>
  <div class="content-area">
    <div v-if="isLoading" class="loading-state">
      <div class="spinner"></div>
      <p>Loading articles...</p>
    </div>

    <div v-else-if="articleCount === 0" class="empty-state">
      <svg width="100" height="100" viewBox="0 0 70 70" fill="none">
        <g fill="currentColor" opacity="0.3">
          <path d="m35.6 48.1c-.3.3-.3.8 0 1.1s.8.3 1.1 0c3.4-3.4 8.9-3.4 12.4 0 .3.3.8.3 1.1 0s.3-.8 0-1.1c-4-4-10.6-4-14.6 0z"></path>
          <path d="m21.2 48.5c-.3.3-.3.8.1 1.1.3.3.8.3 1.1-.1 4.9-5.4 13.3-5.3 18.1-.3.3.3.8.3 1.1 0s.3-.8 0-1.1c-5.5-5.6-14.9-5.7-20.4.4z"></path>
          <path d="m58.6 54.5 2.6-26.5c.1-1.1-.3-2.2-1-3s-1.8-1.3-2.9-1.3v-6.9c0-2.6-2-4.7-4.6-4.8l-42.1-.6c-2.7 0-4.7 2.1-4.8 4.6v1.8c-1.2.3-2.1 1.1-2.6 2.3-.6.7-1 1.6-1.2 2.3-.5 1.8-.4 3.7-.2 5.6.8 8.8 1.6 17.5 2.3 26.3.3 3.8 1.3 5.4 6.8 5.7 15.7.8 31.4.7 47.1.4.6 0 1.3 0 1.8-.3.6-.3 1-.9.9-1.5-.3-1.3-2.5-1.1-3.8-1.2.9-.6 1.5-1.6 1.7-2.9zm-48-41.5 42.1.6c1.7 0 3.2 1.5 3.1 3.2v7h-14.7c-1.1 0-2.2-.5-3-1.3l-2.3-2.6c-1.2-1.3-2.9-2.1-4.7-2.1h-23.8v-1.6c0-1.9 1.5-3.3 3.3-3.2zm44.1 43.6h-45.1c-1.2 0-2.3-.9-2.4-2.2l-2.9-32.6c-.1-1.4 1-2.6 2.4-2.6h24.4c1.4 0 2.7.6 3.6 1.6l2.3 2.6c1 1.2 2.5 1.9 4.1 1.9h16.2c.7 0 1.3.3 1.8.8s.7 1.2.6 1.8l-2.6 26.5c-.1 1.2-1.2 2.2-2.4 2.2z"></path>
          <path d="m44.2 33.8 2.2-2.2c.3-.3.3-.8 0-1.1s-.8-.3-1.1 0l-2.2 2.2-2.8-2.8c-.3-.3-.8-.3-1.1 0s-.3.8 0 1.1l2.8 2.8-2.6 2.6c-.3.3-.3.8 0 1.1s.8.3 1.1 0l2.6-2.6 2.8 2.8c.3.3.8.3 1.1 0s.3-.8 0-1.1z"></path>
          <path d="m57.8 7.6c-.9 1.2-1.6 2.4-2.1 3.8-.1.4.1.8.5.9s.8-.1.9-.5c.4-1.2 1-2.4 1.8-3.4.3-.3.2-.8-.1-1.1-.3 0-.7 0-1 .3z"></path>
          <path d="m64.2 10.5c-.2-.3-.7-.5-1-.2l-4.7 3c-.3.2-.4.7-.2 1s.7.5 1 .2l4.7-3c.3-.2.4-.7.2-1z"></path>
          <path d="m65.6 15.9-5.3.4c-.4 0-.7.4-.7.8s.4.7.8.7l5.3-.4c.4 0 .7-.4.7-.8-.1-.4-.4-.7-.8-.7z"></path>
        </g>
      </svg>
      <h3>No articles found</h3>
      <p>{{ emptyMessage }}</p>
    </div>

    <div v-else class="article-list">
      <slot />
    </div>

    <!-- Pagination -->
    <div v-if="showPagination" class="pagination">
      <button
        @click="$emit('go-to-page', currentPage - 1)"
        :disabled="currentPage === 1"
        class="page-btn"
      >
        Previous
      </button>
      <span class="page-info">
        Page {{ currentPage }} of {{ totalPages }}
      </span>
      <button
        @click="$emit('go-to-page', currentPage + 1)"
        :disabled="currentPage === totalPages"
        class="page-btn"
      >
        Next
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  isLoading: boolean
  articleCount: number
  emptyMessage: string
  showPagination: boolean
  currentPage: number
  totalPages: number
}>()

defineEmits<{
  'go-to-page': [page: number]
}>()
</script>

<style scoped>
.content-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
}

.article-list {
    flex: 1;
    overflow-y: auto;
    padding: 20px 24px;
}

.loading-state,
.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 20px;
    color: var(--text-secondary);
    text-align: center;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid var(--border-color);
    border-top-color: var(--primary-color);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
}

@keyframes spin {
    to {
        transform: rotate(360deg);
    }
}

.loading-state p {
    font-size: 16px;
    font-weight: 500;
}

.empty-state svg {
    margin-bottom: 20px;
    opacity: 0.5;
}

.empty-state h3 {
    font-size: 20px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
}

.empty-state p {
    font-size: 14px;
    color: var(--text-secondary);
    max-width: 400px;
}

.pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 8px;
    padding: 24px;
    border-top: 1px solid var(--border-color);
    background: var(--bg-primary);
    flex-shrink: 0;
}

.page-info {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
    padding: 0 12px;
}

.page-btn {
    padding: 8px 12px;
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    background: var(--bg-primary);
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
    font-weight: 500;
    min-width: 40px;
    height: 40px;
}

.page-btn:hover:not(:disabled) {
    background: var(--secondary-color);
    border-color: var(--primary-color);
    color: var(--primary-color);
}

.page-btn.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.page-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}

.article-list::-webkit-scrollbar {
    width: 8px;
}

.article-list::-webkit-scrollbar-track {
    background: var(--bg-secondary);
    border-radius: 4px;
}

.article-list::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
}

.article-list::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}
</style>
