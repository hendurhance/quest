<template>
  <div class="page-header">
    <div class="page-title-section">
      <h2 class="page-title">{{ title }}</h2>
      <span class="article-count">{{ articleCount }} {{ articleCount === 1 ? 'article' : 'articles' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  articleCount: number
}>()
</script>

<style scoped>
.page-header {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 24px 24px 16px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}

.page-title-section {
    display: flex;
    align-items: baseline;
    gap: 12px;
}

.page-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--text-primary);
    margin: 0;
}

.article-count {
    font-size: 14px;
    color: var(--text-secondary);
    font-weight: 500;
}
</style>
