<template>
  <div class="quick-stats">
    <div class="stat-item">
      <span class="stat-number">{{ totalArticles }}</span>
      <span class="stat-label">Saved</span>
    </div>
    <div class="stat-item">
      <span class="stat-number">{{ unreadArticles }}</span>
      <span class="stat-label">Unread</span>
    </div>
    <div class="stat-item">
      <span class="stat-number">{{ readToday }}</span>
      <span class="stat-label">Read Today</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  totalArticles: number
  unreadArticles: number
  readToday: number
}>()
</script>

<style scoped>
/* Quick stats */
.quick-stats {
    display: flex;
    justify-content: space-around;
    margin: 20px 0;
    padding: 12px;
    background: var(--bg-secondary);
    border-radius: 6px;
    border: 1px solid var(--border-color);
}

.stat-item {
    text-align: center;
}

.stat-number {
    display: block;
    font-size: 20px;
    font-weight: 700;
    color: var(--primary-color);
}

.stat-label {
    font-size: 12px;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}
</style>
