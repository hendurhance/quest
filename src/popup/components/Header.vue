<template>
  <header class="header">
    <div class="logo">
      <svg class="icon" width="20" height="20" viewBox="0 0 118 118" fill="none" xmlns="http://www.w3.org/2000/svg">
         <rect width="118" height="118" rx="32" fill="#7ADF93"/>
         <path d="M26.5561 100.161C28.492 100.985 30.6324 101.209 32.6979 100.803C34.7635 100.397 36.6583 99.381 38.1353 97.8866L59 77.2183L79.8646 97.8866C80.8375 98.8697 81.9964 99.6509 83.2744 100.185C84.5524 100.719 85.9241 100.995 87.31 100.998C88.7345 100.994 90.1442 100.709 91.4581 100.161C93.4098 99.374 95.0781 98.0194 96.245 96.2738C97.412 94.5282 98.0233 92.4727 97.9993 90.3757V34.6562C97.9937 29.9752 96.1242 25.4875 92.801 22.1776C89.4778 18.8676 84.9721 17.0056 80.2723 17L37.7276 17C33.0278 17.0056 28.5222 18.8676 25.1989 22.1776C21.8757 25.4875 20.0062 29.9752 20.0006 34.6562V90.3757C19.9777 92.4743 20.5912 94.531 21.7608 96.2768C22.9304 98.0226 24.6016 99.3762 26.5561 100.161Z" fill="#0B3C49"/>
      </svg>
      <h1>Quest</h1>
    </div>
    <div class="header-actions">
      <button @click="$emit('toggle-theme')" class="icon-btn" title="Toggle Theme">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 3V4M12 20V21M4 12H3M6.31412 6.31412L5.5 5.5M17.6859 6.31412L18.5 5.5M6.31412 17.69L5.5 18.5M17.6859 17.69L18.5 18.5M21 12H20M16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8C14.2091 8 16 9.79086 16 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
      </button>
      <button @click="$emit('open-manager')" class="icon-btn" title="Open Manager">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M12 15C13.66 15 15 13.66 15 12C15 10.34 13.66 9 12 9C10.34 9 9 10.34 9 12C9 13.66 10.34 15 12 15Z" stroke="currentColor" stroke-width="2"/>
          <path d="M19.4 15C19.2 15.3 19.2 15.7 19.4 16L20.4 17.3C20.6 17.6 20.6 18.1 20.3 18.3L18.3 20.3C18.1 20.6 17.6 20.6 17.3 20.4L16 19.4C15.7 19.2 15.3 19.2 15 19.4L14.3 20.8C14.1 21.1 13.8 21.3 13.5 21.3H10.5C10.2 21.3 9.9 21.1 9.7 20.8L9 19.4C8.7 19.2 8.3 19.2 8 19.4L6.7 20.4C6.4 20.6 5.9 20.6 5.7 20.3L3.7 18.3C3.4 18.1 3.4 17.6 3.6 17.3L4.6 16C4.8 15.7 4.8 15.3 4.6 15L3.2 14.3C2.9 14.1 2.7 13.8 2.7 13.5V10.5C2.7 10.2 2.9 9.9 3.2 9.7L4.6 9C4.8 8.7 4.8 8.3 4.6 8L3.6 6.7C3.4 6.4 3.4 5.9 3.7 5.7L5.7 3.7C5.9 3.4 6.4 3.4 6.7 3.6L8 4.6C8.3 4.8 8.7 4.8 9 4.6L9.7 3.2C9.9 2.9 10.2 2.7 10.5 2.7H13.5C13.8 2.7 14.1 2.9 14.3 3.2L15 4.6C15.3 4.8 15.7 4.8 16 4.6L17.3 3.6C17.6 3.4 18.1 3.4 18.3 3.7L20.3 5.7C20.6 5.9 20.6 6.4 20.4 6.7L19.4 8C19.2 8.3 19.2 8.7 19.4 9L20.8 9.7C21.1 9.9 21.3 10.2 21.3 10.5V13.5C21.3 13.8 21.1 14.1 20.8 14.3L19.4 15Z" stroke="currentColor" stroke-width="2"/>
        </svg>
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-theme': []
  'open-manager': []
}>()
</script>

<style scoped>
/* Header */
.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    padding-bottom: 0;
    border-bottom: none;
}

.logo {
    display: flex;
    align-items: center;
    gap: 8px;
}

.logo .icon {
    color: var(--primary-color);
}

.logo .icon {
    font-size: 20px;
}

.logo h1 {
    font-size: 16px;
    font-weight: 700;
    color: var(--text-primary);
}

.header-actions {
    display: flex;
    gap: 8px;
}

.icon-btn {
    background: none;
    border: none;
    border-radius: 6px;
    padding: 8px;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.icon-btn:hover {
    background: var(--secondary-color);
    color: var(--primary-color);
}
</style>
