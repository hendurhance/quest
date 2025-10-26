<template>
  <div class="recent-items">
    <h4>{{ title }}</h4>
    <div v-if="items.length > 0" class="item-list">
      <div 
        v-for="item in items" 
        :key="item.id" 
        class="item"
        @click="$emit('item-click', item)"
      >
        <img :src="item.favicon || 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNkZGQiIHJ4PSIzIi8+PHBhdGggZD0iTTEyIDIyYzUuNTIzIDAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMlMyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTEyIDEwYzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4='" class="favicon" alt="">
        <div class="item-content">
          <div class="item-title">{{ item.title }}</div>
          <div class="item-meta">
            <span>{{ item.category }}</span>
            <span>{{ item.savedDate }}</span>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2C4.9 2 4 2.9 4 4V20L12 17L20 20V4C20 2.9 19.1 2 18 2H6Z"/>
      </svg>
      <p>{{ emptyMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
export interface RecentItem {
  id: string
  title: string
  favicon?: string
  category: string
  savedDate: string
}

defineProps<{
  title: string
  items: RecentItem[]
  emptyMessage: string
}>()

defineEmits<{
  'item-click': [item: RecentItem]
}>()
</script>

<style scoped>
/* Recent items */
.recent-items h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 12px;
    color: var(--text-primary);
}

.item-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 200px;
    overflow-y: auto;
    margin-bottom: 16px;
}

.item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
}

.item:hover {
    border-color: var(--primary-color);
    box-shadow: var(--shadow);
}

.item .favicon {
    width: 14px;
    height: 14px;
}

.item-content {
    flex: 1;
    min-width: 0;
}

.item-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
    margin-bottom: 2px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.item-meta {
    font-size: 11px;
    color: var(--text-secondary);
    display: flex;
    gap: 8px;
}

.empty-state {
    text-align: center;
    padding: 30px 20px;
    color: var(--text-secondary);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
}

.empty-icon {
    width: 24px;
    height: 24px;
    margin-bottom: 12px;
    color: var(--text-secondary);
    opacity: 0.5;
}

.empty-state p {
    margin: 0;
    font-size: 13px;
}

/* Scrollbar styling */
.item-list::-webkit-scrollbar {
    width: 6px;
}

.item-list::-webkit-scrollbar-track {
    background: var(--bg-secondary);
    border-radius: 3px;
}

.item-list::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 3px;
}

.item-list::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}
</style>
