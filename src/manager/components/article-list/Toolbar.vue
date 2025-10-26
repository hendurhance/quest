<template>
  <div class="toolbar">
    <div class="toolbar-left">
      <!-- Filters -->
      <div class="filters">
        <button class="filter-toggle" :class="{ active: hasActiveFilters }" @click="$emit('toggle-filters')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 6h16M4 12h16M4 18h16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <circle v-if="hasActiveFilters" cx="20" cy="6" r="3" fill="#3b82f6"/>
          </svg>
          Filters
          <span v-if="hasActiveFilters" class="filter-count">{{ activeFilterCount }}</span>
        </button>
        
        <div v-if="showFilters" class="filter-dropdown">
          <div class="filter-group">
            <label>Status</label>
            <select :value="currentFilter.readStatus" @change="handleReadStatusChange">
              <option value="">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Source</label>
            <select :value="currentFilter.source" @change="handleSourceChange">
              <option value="">All Sources</option>
              <option v-for="source in topSources" :key="source.domain" :value="source.domain">
                {{ source.domain }} ({{ source.count }})
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>Tag</label>
            <select :value="currentFilter.tag" @change="handleTagChange">
              <option value="">All Tags</option>
              <option v-for="tag in popularTags" :key="tag.name" :value="tag.name">
                {{ tag.name }} ({{ tag.usageCount }})
              </option>
            </select>
          </div>
          <div class="filter-actions">
            <button @click="$emit('clear-filters')" class="clear-btn">Clear All</button>
            <button @click="$emit('toggle-filters')" class="apply-btn">Done</button>
          </div>
        </div>
      </div>

      <!-- Sort -->
      <div class="sort-control">
        <label>Sort:</label>
        <select :value="sortBy" @change="handleSortChange">
          <option value="date-desc">Newest</option>
          <option value="date-asc">Oldest</option>
          <option value="title-asc">Title A-Z</option>
          <option value="title-desc">Title Z-A</option>
          <option value="domain-asc">Source A-Z</option>
          <option value="domain-desc">Source Z-A</option>
        </select>
      </div>
    </div>

    <div class="toolbar-right">
      <!-- Selection Actions -->
      <div class="selection-actions" v-if="selectMode && selectedCount > 0">
        <span class="selected-count">{{ selectedCount }} selected</span>
        <div class="bulk-actions-wrapper">
          <button @click="$emit('toggle-bulk-menu')" class="bulk-actions-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5v14m7-7H5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Actions
          </button>
          <!-- Bulk Actions Menu -->
          <div v-if="showBulkActions" class="bulk-menu">
            <button @click="$emit('bulk-action', 'mark-read')">Mark as Read</button>
            <button @click="$emit('bulk-action', 'mark-unread')">Mark as Unread</button>
            <button @click="$emit('bulk-action', 'pin')">Pin</button>
            <button @click="$emit('bulk-action', 'unpin')">Unpin</button>
            <button @click="$emit('bulk-action', 'archive')">Archive</button>
            <button @click="$emit('bulk-action', 'delete')" class="danger">Delete</button>
          </div>
        </div>
        <button @click="$emit('clear-selection')" class="clear-selection-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <button v-if="selectMode && selectedCount === 0" @click="$emit('exit-select-mode')" class="select-mode-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        Cancel
      </button>
      <button v-if="!selectMode" @click="$emit('toggle-select-mode')" class="select-mode-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          <rect x="14" y="3" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          <rect x="3" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
          <rect x="14" y="14" width="7" height="7" rx="1" stroke="currentColor" stroke-width="2"/>
        </svg>
        Select
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Tag {
  name: string
  usageCount: number
}

interface Source {
  domain: string
  count: number
}

const emit = defineEmits<{
  'toggle-filters': []
  'update:currentFilter': [filter: { readStatus?: string; source?: string; tag?: string }]
  'apply-filters': []
  'clear-filters': []
  'update:sortBy': [value: string]
  'toggle-select-mode': []
  'exit-select-mode': []
  'clear-selection': []
  'toggle-bulk-menu': []
  'bulk-action': [action: string]
}>()

const props = defineProps<{
  showFilters: boolean
  currentFilter: {
    readStatus?: string
    source?: string
    tag?: string
  }
  hasActiveFilters: boolean
  activeFilterCount: number
  topSources: Source[]
  popularTags: Tag[]
  sortBy: string
  selectMode: boolean
  selectedCount: number
  showBulkActions: boolean
}>()

const handleReadStatusChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:currentFilter', { ...props.currentFilter, readStatus: target.value || undefined })
  emit('apply-filters')
}

const handleSourceChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:currentFilter', { ...props.currentFilter, source: target.value || undefined })
  emit('apply-filters')
}

const handleTagChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:currentFilter', { ...props.currentFilter, tag: target.value || undefined })
  emit('apply-filters')
}

const handleSortChange = (event: Event) => {
  const target = event.target as HTMLSelectElement
  emit('update:sortBy', target.value)
}
</script>

<style scoped>
.toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 24px;
    background: var(--bg-primary);
    border-bottom: 1px solid var(--border-color);
    flex-shrink: 0;
}

.toolbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
}

.toolbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
}

.filters {
    position: relative;
}

.filter-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
    transition: all 0.2s;
}

.filter-toggle:hover {
    border-color: var(--primary-color);
    background: var(--bg-primary);
}

.filter-toggle.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.filter-toggle svg {
    flex-shrink: 0;
}

.filter-count {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 18px;
    height: 18px;
    padding: 0 6px;
    background: white;
    color: var(--primary-color);
    border-radius: 10px;
    font-size: 11px;
    font-weight: 700;
}

.filter-dropdown {
    position: absolute;
    top: calc(100% + 8px);
    left: 0;
    width: 320px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 12px;
    box-shadow: var(--shadow-lg);
    padding: 16px;
    z-index: 1000;
}

.filter-group {
    margin-bottom: 16px;
}

.filter-group:last-of-type {
    margin-bottom: 0;
}

.filter-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
}

.filter-group select {
    width: 100%;
    padding: 10px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.filter-group select:hover {
    border-color: var(--primary-color);
}

.filter-group select:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 3px rgba(217, 119, 6, 0.1);
}

.filter-actions {
    display: flex;
    gap: 8px;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--border-color);
}

.clear-btn {
    flex: 1;
    padding: 10px;
    background: transparent;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.clear-btn:hover {
    background: var(--danger-color);
    color: white;
    border-color: var(--danger-color);
}

.apply-btn {
    flex: 1;
    padding: 10px;
    background: var(--primary-color);
    border: 1px solid var(--primary-color);
    border-radius: 8px;
    color: white;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.apply-btn:hover {
    background: var(--primary-hover);
    border-color: var(--primary-hover);
}

.sort-control {
    display: flex;
    align-items: center;
    gap: 8px;
}

.sort-control label {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-secondary);
}

.sort-control select {
    padding: 8px 12px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
}

.sort-control select:hover {
    border-color: var(--primary-color);
}

.sort-control select:focus {
    outline: none;
    border-color: var(--primary-color);
}

.selection-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 16px;
    background: var(--secondary-color);
    border-radius: 8px;
}

.selected-count {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
}

.bulk-actions-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.bulk-actions-btn:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.clear-selection-btn {
    width: 32px;
    height: 32px;
    padding: 0;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 6px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.clear-selection-btn:hover {
    background: var(--danger-color);
    color: white;
    border-color: var(--danger-color);
}

.select-mode-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    color: var(--text-primary);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
}

.select-mode-btn:hover {
    border-color: var(--primary-color);
    background: var(--bg-primary);
}

.bulk-actions-wrapper {
    position: relative;
}

.bulk-menu {
    position: absolute;
    top: calc(100% + 8px);
    right: 0;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg);
    padding: 8px 0;
    z-index: 1000;
    min-width: 200px;
}

.bulk-menu button {
    display: block;
    width: 100%;
    padding: 12px 20px;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 14px;
    color: var(--text-primary);
    transition: all 0.2s;
    font-weight: 500;
}

.bulk-menu button:hover {
    background: var(--secondary-color);
    color: var(--primary-color);
}

.bulk-menu button.danger {
    color: var(--danger-color);
}

.bulk-menu button.danger:hover {
    background: var(--danger-color);
    color: white;
}

@media (max-width: 768px) {
    .toolbar {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;
    }

    .toolbar-left,
    .toolbar-right {
        width: 100%;
        justify-content: space-between;
    }

    .filter-dropdown {
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: calc(100% - 32px);
        max-width: 320px;
    }
}
</style>
