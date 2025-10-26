<template>
  <article 
    :class="['article-card', { 
      'article-card--read': article.organization.isRead,
      'article-card--selected': isSelected,
      'article-card--pinned': article.organization.isPinned,
      'article-card--archived': article.organization.isArchived
    }]"
    :data-id="article.id"
  >
    <!-- Header Section with Actions -->
    <div class="article-card__header">
      <input 
        v-if="selectMode"
        type="checkbox" 
        class="article-card__checkbox"
        :checked="isSelected"
        @click.stop="$emit('select', article.id)"
        aria-label="Select article"
      >
      
      <img 
        class="article-card__favicon" 
        :src="article.favicon || defaultFavicon" 
        :alt="`${article.domain} favicon`"
        @error="handleImageError"
      >
      
      <div class="article-card__content">
        <h3 class="article-card__title">
          <button 
            class="article-card__title-link"
            @click.stop="handleOpen"
            :title="article.title"
          >
            {{ article.title }}
          </button>
        </h3>
        
        <div class="article-card__meta">
          <a 
            :href="article.actualUrl" 
            class="article-card__domain" 
            target="_blank"
            rel="noopener noreferrer"
            @click.stop
          >
            {{ article.domain }}
          </a>
          
          <span class="article-card__separator">•</span>
          <time :datetime="article.timestamps.dateAdded" class="article-card__date">
            {{ formatRelativeTime(article.timestamps.dateAdded) }}
          </time>
          
          <template v-if="article.metadata.readingTime">
            <span class="article-card__separator">•</span>
            <span class="article-card__reading-time">{{ article.metadata.readingTime }}</span>
          </template>
          
          <template v-if="article.organization.isPinned">
            <span class="article-card__separator">•</span>
            <span class="article-card__badge article-card__badge--pinned">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 17v5m-3-2l3-3 3 3M9 10.76V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v6.76a2 2 0 0 1 1.33 1.89V14a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-1.35A2 2 0 0 1 9 10.76z" />
              </svg>
              Pinned
            </span>
          </template>
        </div>
        
        <div v-if="article.organization.tags && article.organization.tags.length > 0" class="article-card__tags">
          <button 
            v-for="tag in article.organization.tags" 
            :key="tag"
            class="article-card__tag"
            @click.stop="$emit('filter-tag', tag)"
            :title="`Filter by ${tag}`"
          >
            {{ tag }}
          </button>
        </div>
      </div>
      
      <!-- Action Buttons (moved to header right) -->
      <div class="article-card__actions">
        <div class="article-card__action-group">
          <button 
            :class="['article-card__action', { 'article-card__action--active': article.organization.isPinned }]"
            :title="article.organization.isPinned ? 'Remove from favorites' : 'Add to favorites'"
            @click.stop="handleAction('pin')"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" :fill="article.organization.isPinned ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
            </svg>
          </button>
          
          <button 
            :class="['article-card__action', { 'article-card__action--active': article.organization.isRead }]"
            :title="article.organization.isRead ? 'Mark as unread' : 'Mark as read'"
            @click.stop="handleAction(article.organization.isRead ? 'unread' : 'read')"
          >
            <svg v-if="article.organization.isRead" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
              <line x1="3" y1="3" x2="21" y2="21"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
              <circle cx="12" cy="12" r="3"/>
            </svg>
          </button>
          
          <button 
            :class="['article-card__action', { 'article-card__action--active': article.organization.isArchived }]"
            :title="article.organization.isArchived ? 'Unarchive' : 'Archive'"
            @click.stop="handleAction('archive')"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="21 8 21 21 3 21 3 8"/>
              <rect x="1" y="3" width="22" height="5"/>
              <line x1="10" y1="12" x2="14" y2="12"/>
            </svg>
          </button>
          
          <button 
            class="article-card__action article-card__action--ai"
            :title="hasSummary ? 'Summary already exists' : summaryLoading ? 'Generating summary...' : 'Generate AI Summary'"
            :disabled="summaryLoading || hasSummary"
            @click.stop="handleAction('ai-summary')"
          >
            <svg v-if="summaryLoading" class="spinner" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              <circle cx="9" cy="10" r="1"/>
              <circle cx="12" cy="10" r="1"/>
              <circle cx="15" cy="10" r="1"/>
            </svg>
          </button>
          
          <button 
            class="article-card__action article-card__action--podcast"
            :title="hasPodcast ? 'Podcast already exists' : podcastLoading ? 'Generating podcast...' : 'Create Podcast'"
            :disabled="podcastLoading || hasPodcast"
            @click.stop="handleAction('podcast')"
          >
            <svg v-if="podcastLoading" class="spinner" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/>
            </svg>
          </button>
          
          <button 
            class="article-card__action article-card__action--danger"
            title="Delete article"
            @click.stop="handleAction('delete')"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
        
        <button 
          class="article-card__action article-card__action--primary"
          @click.stop="handleOpen"
          title="Open article"
        >
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          <span>Open</span>
        </button>
      </div>
    </div>
    
    <!-- AI Features Section -->
    <div v-if="hasSummary || hasPodcast" class="article-card__ai-features">
      <!-- Summary Section -->
      <div v-if="hasSummary" class="article-card__ai-section article-card__ai-section--summary">
        <div class="article-card__ai-badge">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 2L2 7L12 12L22 7L12 2Z"/>
            <path d="M2 17L12 22L22 17"/>
            <path d="M2 12L12 17L22 12"/>
          </svg>
          <span>AI Summary</span>
        </div>
        <div class="article-card__ai-content">
          <slot name="summary" />
        </div>
      </div>
      
      <!-- Podcast Section -->
      <div v-if="hasPodcast" class="article-card__ai-section article-card__ai-section--podcast">
        <div class="article-card__ai-badge">
          <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor" stroke="none">
            <circle cx="12" cy="12" r="2"/>
            <path d="M16.2 7.8C17.3 8.9 18 10.4 18 12C18 13.6 17.3 15.1 16.2 16.2M7.8 16.2C6.7 15.1 6 13.6 6 12C6 10.4 6.7 8.9 7.8 7.8M19.07 4.93C20.88 6.74 22 9.24 22 12C22 14.76 20.88 17.26 19.07 19.07M4.93 19.07C3.12 17.26 2 14.76 2 12C2 9.24 3.12 6.74 4.93 4.93"/>
          </svg>
          <span>Podcast</span>
        </div>
        <div class="article-card__ai-content">
          <slot name="podcast" />
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatRelativeTime } from '@/utils/formatters'
import type { Article } from '../../types';

interface Props {
  article: Article;
  isSelected?: boolean;
  selectMode?: boolean;
  summaryLoading?: boolean;
  podcastLoading?: boolean;
  hasSummary?: boolean;
  hasPodcast?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  isSelected: false,
  selectMode: false,
  summaryLoading: false,
  podcastLoading: false,
  hasSummary: false,
  hasPodcast: false,
});

const emit = defineEmits<{
  (e: 'select', articleId: string): void;
  (e: 'open', articleId: string): void;
  (e: 'action', payload: { articleId: string; action: string }): void;
  (e: 'filter-tag', tag: string): void;
}>();

const defaultFavicon = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxNiIgaGVpZ2h0PSIxNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48cmVjdCB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIGZpbGw9IiNkZGQiIHJ4PSIzIi8+PHBhdGggZD0iTTEyIDIyYzUuNTIzIDAgMTAtNC40NzcgMTAtMTBTMTcuNTIzIDIgMTIgMlMyIDYuNDc3IDIgMTJzNC40NzcgMTAgMTAgMTB6IiBmaWxsPSIjOTk5Ii8+PHBhdGggZD0iTTEyIDEwYzEuMSAwIDItLjkgMi0ycy0uOS0yLTItMi0yIC45LTIgMiAuOSAyIDIgMnoiIGZpbGw9IiNmZmYiLz48L3N2Zz4=';

const handleOpen = () => {
  emit('open', props.article.id);
};

const handleAction = (action: string) => {
  emit('action', { articleId: props.article.id, action });
};

const handleImageError = (e: Event) => {
  const target = e.target as HTMLImageElement;
  target.src = defaultFavicon;
};
</script>

<style scoped>
/* ======================
   ARTICLE CARD - BASE
   ====================== */
.article-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px 16px;
  background: var(--bg-primary, #ffffff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  margin-bottom: 8px;
  transition: all 0.15s ease;
}

.article-card:hover {
  border-color: var(--primary-color, #0B3C49);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

/* Card States */
.article-card--selected {
  background: rgba(217, 119, 6, 0.04);
  border-color: var(--primary-color, #0B3C49);
  box-shadow: 0 0 0 2px rgba(217, 119, 6, 0.08);
}

.article-card--read {
  opacity: 0.75;
  background: var(--bg-secondary, #f9fafb);
}

.article-card--read .article-card__title {
  color: var(--text-secondary, #6b7280);
}

.article-card--pinned {
  border-left: 3px solid var(--warning-color, #f59e0b);
  padding-left: 13px;
}

.article-card--archived {
  opacity: 0.5;
}

.article-card--archived .article-card__title {
  text-decoration: line-through;
  color: var(--text-secondary, #6b7280);
}

/* ======================
   HEADER SECTION
   ====================== */
.article-card__header {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  width: 100%;
}

.article-card__checkbox {
  margin-top: 2px;
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color, #0B3C49);
  cursor: pointer;
  flex-shrink: 0;
}

.article-card__favicon {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  flex-shrink: 0;
  object-fit: cover;
  margin-top: 1px;
}

/* ======================
   CONTENT SECTION
   ====================== */
.article-card__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.article-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #111827);
  line-height: 1.4;
  margin: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.article-card__title-link {
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  text-decoration: none;
  transition: color 0.15s ease;
  width: 100%;
  display: block;
}

.article-card__title-link:hover {
  color: var(--primary-color, #0B3C49);
}

.article-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary, #6b7280);
  flex-wrap: wrap;
  line-height: 1.4;
}

.article-card__domain {
  color: var(--primary-color, #0B3C49);
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.15s ease;
}

.article-card__domain:hover {
  opacity: 0.7;
  text-decoration: underline;
}

.article-card__separator {
  color: var(--text-tertiary, #9ca3af);
  user-select: none;
  font-size: 10px;
}

.article-card__date,
.article-card__reading-time {
  white-space: nowrap;
}

.article-card__badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.article-card__badge--pinned {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning-color, #f59e0b);
}

.article-card__badge--pinned svg {
  width: 10px;
  height: 10px;
}

/* Tags */
.article-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 2px;
}

.article-card__tag {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
  border: 1px solid var(--border-color, #e5e7eb);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.article-card__tag:hover {
  background: var(--primary-color, #0B3C49);
  color: white;
  border-color: var(--primary-color, #0B3C49);
  transform: translateY(-1px);
}

/* ======================
   ACTIONS SECTION
   ====================== */
.article-card__actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
  margin-left: auto;
  flex-shrink: 0;
}

.article-card__action-group {
  display: flex;
  align-items: center;
  gap: 3px;
}

.article-card__action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 5px 8px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: var(--bg-secondary, #f9fafb);
  color: var(--text-secondary, #6b7280);
  border-radius: 5px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.article-card__action:hover:not(:disabled) {
  background: var(--bg-primary, #ffffff);
  border-color: var(--primary-color, #0B3C49);
  color: var(--primary-color, #0B3C49);
  transform: translateY(-1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

.article-card__action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.article-card__action svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* Primary Action (Open) */
.article-card__action--primary {
  background: var(--primary-color, #0B3C49);
  color: white;
  border-color: var(--primary-color, #0B3C49);
  font-weight: 600;
  padding: 5px 10px;
  width: 100%;
}

.article-card__action--primary:hover:not(:disabled) {
  background: #b45309;
  border-color: #b45309;
  color: white;
}

/* Active State */
.article-card__action--active {
  background: var(--primary-color, #0B3C49);
  color: white;
  border-color: var(--primary-color, #0B3C49);
}

.article-card__action--active:hover:not(:disabled) {
  background: #b45309;
  border-color: #b45309;
  opacity: 0.9;
}

/* AI Action */
.article-card__action--ai {
  color: var(--ai-color, #8b5cf6);
}

.article-card__action--ai:hover:not(:disabled) {
  background: rgba(139, 92, 246, 0.08);
  border-color: var(--ai-color, #8b5cf6);
  color: var(--ai-color, #8b5cf6);
}

/* Podcast Action */
.article-card__action--podcast {
  color: var(--podcast-color, #06b6d4);
}

.article-card__action--podcast:hover:not(:disabled) {
  background: rgba(6, 182, 212, 0.08);
  border-color: var(--podcast-color, #06b6d4);
  color: var(--podcast-color, #06b6d4);
}

/* Danger Action (Delete) */
.article-card__action--danger {
  color: var(--danger-color, #ef4444);
}

.article-card__action--danger:hover:not(:disabled) {
  background: rgba(239, 68, 68, 0.08);
  border-color: var(--danger-color, #ef4444);
  color: var(--danger-color, #ef4444);
}

/* ======================
   AI FEATURES SECTION
   ====================== */
.article-card__ai-features {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 10px;
}

.article-card__ai-section {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.03) 0%, rgba(139, 92, 246, 0.01) 100%);
  border: 1px solid rgba(139, 92, 246, 0.12);
  border-radius: 8px;
  min-width: 0;
  transition: all 0.2s ease;
}

.article-card__ai-section:hover {
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(139, 92, 246, 0.02) 100%);
  border-color: rgba(139, 92, 246, 0.2);
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.08);
}

.article-card__ai-section--podcast {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.03) 0%, rgba(6, 182, 212, 0.01) 100%);
  border-color: rgba(6, 182, 212, 0.12);
}

.article-card__ai-section--podcast:hover {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.05) 0%, rgba(6, 182, 212, 0.02) 100%);
  border-color: rgba(6, 182, 212, 0.2);
  box-shadow: 0 2px 8px rgba(6, 182, 212, 0.08);
}

.article-card__ai-badge {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  background: rgba(139, 92, 246, 0.1);
  border: 1px solid rgba(139, 92, 246, 0.2);
  border-radius: 12px;
  font-size: 11px;
  font-weight: 600;
  color: #8b5cf6;
  width: fit-content;
  letter-spacing: 0.01em;
}

.article-card__ai-section--podcast .article-card__ai-badge {
  background: rgba(6, 182, 212, 0.1);
  border-color: rgba(6, 182, 212, 0.2);
  color: #06b6d4;
}

.article-card__ai-badge svg {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  opacity: 0.9;
}

.article-card__ai-content {
  font-size: 13px;
  line-height: 1.5;
  color: var(--text-secondary, #6b7280);
  flex: 1;
}

/* ======================
   LOADING SPINNER
   ====================== */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.spinner {
  animation: spin 1s linear infinite;
}

/* ======================
   RESPONSIVE DESIGN
   ====================== */
@media (max-width: 768px) {
  .article-card {
    padding: 10px 12px;
    gap: 8px;
  }

  .article-card__header {
    gap: 8px;
  }

  .article-card__favicon {
    width: 18px;
    height: 18px;
  }

  .article-card__title {
    font-size: 14px;
  }

  .article-card__meta {
    font-size: 11px;
  }

  .article-card__actions {
    gap: 3px;
  }

  .article-card__action-group {
    gap: 2px;
  }

  .article-card__action {
    padding: 4px 6px;
    font-size: 11px;
  }

  .article-card__action span {
    display: none;
  }

  .article-card__action--primary span {
    display: inline;
  }

  .article-card__action svg {
    width: 12px;
    height: 12px;
  }

  .article-card__ai-features {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .article-card__ai-section {
    padding: 8px;
  }

  .article-card__ai-badge {
    font-size: 10px;
    padding: 2px 6px;
  }

  .article-card__ai-badge svg {
    width: 10px;
    height: 10px;
  }
}
</style>
