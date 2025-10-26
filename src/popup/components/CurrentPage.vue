<template>
  <div class="current-page">
    <div class="page-info">
      <img :src="favicon" class="favicon" alt="">
      <div class="page-details">
        <h3>{{ title }}</h3>
        <p>{{ domain }}</p>
        <div class="reading-time">
          <span>{{ readingTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  favicon: string
  title: string
  domain: string
  readingTime: string
}>()
</script>

<style scoped>
/* Current page section */
.current-page {
    margin-bottom: 20px;
}

.page-info {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    padding: 16px;
    background: var(--bg-secondary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.favicon {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    flex-shrink: 0;
}

.page-details {
    flex: 1;
    min-width: 0;
}

.page-details h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 4px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.page-details p {
    font-size: 12px;
    color: var(--text-secondary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.reading-time {
    margin-top: 4px;
    font-size: 11px;
    color: var(--primary-color);
    font-weight: 500;
}
</style>
