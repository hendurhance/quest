<template>
  <header class="dashboard-header">
    <div class="header-container">
      <div class="header-left">
        <div class="logo">
          <svg class="icon" width="32" height="32" viewBox="0 0 118 118" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="118" height="118" rx="32" fill="#7ADF93"/>
            <path d="M26.5561 100.161C28.492 100.985 30.6324 101.209 32.6979 100.803C34.7635 100.397 36.6583 99.381 38.1353 97.8866L59 77.2183L79.8646 97.8866C80.8375 98.8697 81.9964 99.6509 83.2744 100.185C84.5524 100.719 85.9241 100.995 87.31 100.998C88.7345 100.994 90.1442 100.709 91.4581 100.161C93.4098 99.374 95.0781 98.0194 96.245 96.2738C97.412 94.5282 98.0233 92.4727 97.9993 90.3757V34.6562C97.9937 29.9752 96.1242 25.4875 92.801 22.1776C89.4778 18.8676 84.9721 17.0056 80.2723 17L37.7276 17C33.0278 17.0056 28.5222 18.8676 25.1989 22.1776C21.8757 25.4875 20.0062 29.9752 20.0006 34.6562V90.3757C19.9777 92.4743 20.5912 94.531 21.7608 96.2768C22.9304 98.0226 24.6016 99.3762 26.5561 100.161Z" fill="#0B3C49"/>
          </svg>
          <div class="logo-text">
            <h1>AI Dashboard</h1>
            <p class="subtitle">Intelligence & Analytics</p>
          </div>
        </div>
      </div>
      <div class="header-right">
        <button @click="$emit('toggle-theme')" class="icon-btn" title="Toggle Theme">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="2"/>
            <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41m11.32-11.32l1.41-1.41" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
        <button @click="$emit('go-to-manager')" class="primary-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M19 12H5m0 0l7 7m-7-7l7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <span>Back to Library</span>
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
defineEmits<{
  'toggle-theme': []
  'go-to-manager': []
}>()
</script>

<style scoped>
.dashboard-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: var(--bg-primary);
  border-bottom: 1px solid var(--border-color);
  backdrop-filter: blur(12px);
  background: rgba(255, 255, 255, 0.8);
}

[data-theme="dark"] .dashboard-header {
  background: rgba(31, 41, 55, 0.8);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 16px;
}

.logo .icon {
  flex-shrink: 0;
}

.logo-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.logo-text h1 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.subtitle {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-btn {
  width: 40px;
  height: 40px;
  padding: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 10px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-btn:hover {
  background: var(--bg-primary);
  color: var(--primary-color);
  border-color: var(--primary-color);
  transform: translateY(-1px);
}

.icon-btn:active {
  transform: translateY(0);
}

.primary-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 1px 3px rgba(99, 102, 241, 0.3);
}

.primary-btn:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.primary-btn:active {
  transform: translateY(0);
}

@media (max-width: 768px) {
  .header-container {
    padding: 16px 20px;
    flex-direction: column;
    gap: 16px;
  }

  .header-left,
  .header-right {
    width: 100%;
  }

  .header-right {
    justify-content: flex-end;
  }

  .logo-text h1 {
    font-size: 18px;
  }

  .subtitle {
    font-size: 12px;
  }
}
</style>
