<template>
  <main class="article-list-container">
    <slot />
  </main>
</template>

<script setup lang="ts">
// This component is a simple container wrapper for the article list section
</script>

<style scoped>
.article-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    background: var(--bg-secondary);
}
</style>
