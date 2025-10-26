<template>
  <div class="stats-grid">
    <div class="stat-card" v-for="stat in stats" :key="stat.id">
      <div class="stat-icon-wrapper" :style="{ backgroundColor: stat.bgColor }">
        <div class="stat-icon" :style="{ color: stat.iconColor }">
          <component :is="'div'" v-html="stat.icon" />
        </div>
      </div>
      <div class="stat-content">
        <p class="stat-label">{{ stat.label }}</p>
        <p class="stat-value">{{ formatNumber(stat.value) }}</p>
        <p class="stat-meta">
          <span class="stat-badge">{{ formatNumber(stat.secondary) }}</span>
          <span class="stat-meta-text">{{ stat.secondaryLabel }}</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  totalSummaries: number
  summariesThisMonth: number
  totalPodcasts: number
  podcastsThisMonth: number
  enhancedArticles: number
  totalArticles: number
  totalApiCalls: number
  apiCallsThisMonth: number
}

const props = defineProps<Props>()

const stats = computed(() => [
  {
    id: 'summaries',
    label: 'Total AI Summaries',
    value: props.totalSummaries,
    secondary: props.summariesThisMonth,
    secondaryLabel: 'this month',
    bgColor: '#EEF2FF',
    iconColor: '#4F46E5',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M9 12h6M9 16h6M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10l5 5v11a2 2 0 0 1-2 2z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    id: 'podcasts',
    label: 'Audio Podcasts',
    value: props.totalPodcasts,
    secondary: props.podcastsThisMonth,
    secondaryLabel: 'this month',
    bgColor: '#ECFDF5',
    iconColor: '#059669',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/><path d="M8 14.5l4 3 4-3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  },
  {
    id: 'enhanced',
    label: 'Enhanced Articles',
    value: props.enhancedArticles,
    secondary: props.totalArticles,
    secondaryLabel: 'total articles',
    bgColor: '#FEF3C7',
    iconColor: '#D97706',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h8l-1 8 10-12h-8l1-8z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
  },
  {
    id: 'api',
    label: 'API Requests',
    value: props.totalApiCalls,
    secondary: props.apiCallsThisMonth,
    secondaryLabel: 'this month',
    bgColor: '#F3E8FF',
    iconColor: '#7C3AED',
    icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/><path d="M12 2v4m0 12v4M2 12h4m12 0h4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
  }
])

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
  margin-bottom: 40px;
}

.stat-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: flex-start;
  gap: 20px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-hover));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-color);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-icon-wrapper {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.stat-card:hover .stat-icon-wrapper {
  transform: scale(1.05);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0 0 8px 0;
  letter-spacing: 0.01em;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 12px 0;
  line-height: 1;
  letter-spacing: -0.02em;
}

.stat-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.stat-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 10px;
  background: var(--bg-secondary);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.stat-meta-text {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .stat-card {
    padding: 20px;
  }

  .stat-icon-wrapper {
    width: 48px;
    height: 48px;
  }

  .stat-value {
    font-size: 28px;
  }
}
</style>
