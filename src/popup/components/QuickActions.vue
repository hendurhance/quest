<template>
  <div class="quick-actions">
    <button @click="$emit('open-manager')" class="action-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M8 6H21M8 12H21M8 18H21M3 6H3.01M3 12H3.01M3 18H3.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"></path>
      </svg>
      View All
    </button>
    <button @click="$emit('open-random')" class="action-btn">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path d="M16 3H21V8M10 14L21 3M21 16V21H16M14 10L3 21M3 3H8V8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
      Random
    </button>
  </div>
</template>

<script setup lang="ts">
defineEmits<{
  'open-manager': []
  'open-random': []
}>()
</script>

<style scoped>
/* Quick actions */
.quick-actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    margin-top: 20px;
}

.action-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    font-size: 12px;
    color: var(--text-primary);
    cursor: pointer;
    transition: all 0.2s ease;
}

.action-btn:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}
</style>
