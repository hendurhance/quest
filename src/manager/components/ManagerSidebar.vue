<template>
  <aside class="sidebar">
    <div class="sidebar-section">
      <div class="section-header">
        <h3>Views</h3>
      </div>
      <ul class="nav-list">
        <li>
          <a @click="$emit('change-view', 'all')" :class="{ active: currentView === 'all' }" class="nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="currentColor"/>
            </svg>
            <span>All Articles</span>
            <span class="count">{{ stats.total }}</span>
          </a>
        </li>
        <li>
          <a @click="$emit('change-view', 'unread')" :class="{ active: currentView === 'unread' }" class="nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM8 20H4v-6h4v6zm0-8H4V6h4v6zm6 8h-4v-6h4v6zm0-8h-4V6h4v6zm6 8h-4V12h4v8zm0-10h-4V6h4v4z" fill="currentColor"/>
            </svg>
            <span>Reading List</span>
            <span class="count">{{ stats.unread }}</span>
          </a>
        </li>
        <li>
          <a @click="$emit('change-view', 'pinned')" :class="{ active: currentView === 'pinned' }" class="nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="currentColor"/>
            </svg>
            <span>Favorites</span>
            <span class="count">{{ stats.pinned }}</span>
          </a>
        </li>
        <li>
          <a @click="$emit('change-view', 'archived')" :class="{ active: currentView === 'archived' }" class="nav-link">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M20.54 5.23l-1.39-1.68C18.88 3.21 18.47 3 18 3H6c-.47 0-.88.21-1.16.55L3.46 5.23C3.17 5.57 3 6.02 3 6.5V19c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6.5c0-.48-.17-.93-.46-1.27zM12 17.5L6.5 12H10v-2h4v2h3.5L12 17.5zM5.12 5l.81-1h12l.94 1H5.12z" fill="currentColor"/>
            </svg>
            <span>Archive</span>
            <span class="count">{{ stats.archived }}</span>
          </a>
        </li>
      </ul>
    </div>

    <div class="sidebar-section">
      <div class="section-header">
        <h3>Categories</h3>
        <button @click="$emit('create-category')" class="add-btn" title="Add Category">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>
      </div>
      <ul class="nav-list">
        <li v-for="category in categories" :key="category.id">
          <a 
            @click="$emit('change-view', 'category', category.id)" 
            @contextmenu.prevent="openCategoryMenu($event, category)"
            :class="{ active: currentView === 'category' && currentCategoryId === category.id }" 
            class="nav-link category-link"
            :title="`Right-click for options`"
          >
            <span class="category-dot" :style="{ backgroundColor: category.color }"></span>
            <span>{{ category.name }}</span>
            <span class="count">{{ getCategoryCount(category.id) }}</span>
            <svg class="category-menu-icon" width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="12" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
            </svg>
          </a>
        </li>
      </ul>
      
      <!-- Category Context Menu -->
      <Teleport to="body">
        <div 
          v-if="showCategoryMenu && selectedCategory" 
          ref="categoryMenuRef"
          class="context-menu"
          :style="{ top: menuPosition.y + 'px', left: menuPosition.x + 'px' }"
        >
          <button @click.stop="editCategory" class="context-menu-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            Edit Category
          </button>
          <button 
            @click.stop="deleteCategory" 
            class="context-menu-item danger"
            :disabled="getCategoryCount(selectedCategory.id) > 0"
            :title="getCategoryCount(selectedCategory.id) > 0 ? 'Cannot delete category with articles' : ''"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            Delete Category
            <span v-if="getCategoryCount(selectedCategory.id) > 0" class="disabled-hint">
              ({{ getCategoryCount(selectedCategory.id) }} articles)
            </span>
          </button>
        </div>
      </Teleport>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Category } from '@/types'

defineProps<{
  currentView: string
  currentCategoryId: string
  stats: {
    total: number
    unread: number
    pinned: number
    archived: number
  }
  categories: Category[]
  getCategoryCount: (categoryId: string) => number
}>()

const emit = defineEmits<{
  'change-view': [view: string, categoryId?: string]
  'create-category': []
  'edit-category': [category: Category]
  'delete-category': [categoryId: string]
}>()

// Category context menu state
const showCategoryMenu = ref(false)
const selectedCategory = ref<Category | null>(null)
const menuPosition = ref({ x: 0, y: 0 })
const categoryMenuRef = ref<HTMLElement>()

const openCategoryMenu = (event: MouseEvent, category: Category) => {
  event.preventDefault()
  event.stopPropagation()
  selectedCategory.value = category
  menuPosition.value = { x: event.clientX, y: event.clientY }
  showCategoryMenu.value = true
}

const closeCategoryMenu = () => {
  showCategoryMenu.value = false
  selectedCategory.value = null
}

const editCategory = () => {
  if (selectedCategory.value) {
    emit('edit-category', selectedCategory.value)
  }
  closeCategoryMenu()
}

const deleteCategory = () => {
  if (selectedCategory.value) {
    emit('delete-category', selectedCategory.value.id)
  }
  closeCategoryMenu()
}

// Close menu on click outside
const handleClickOutside = (event: MouseEvent) => {
  if (showCategoryMenu.value && categoryMenuRef.value) {
    const target = event.target as Node
    // Don't close if clicking inside the menu
    if (!categoryMenuRef.value.contains(target)) {
      closeCategoryMenu()
    }
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.sidebar {
    width: 260px;
    background: var(--bg-primary);
    border-right: 1px solid var(--border-color);
    overflow-y: auto;
    flex-shrink: 0;
}

.sidebar-section {
    padding: 20px 16px;
    border-bottom: 1px solid var(--border-color);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.section-header h3 {
    font-size: 12px;
    font-weight: 700;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.add-btn {
    width: 20px;
    height: 20px;
    padding: 0;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    color: var(--text-secondary);
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
}

.add-btn:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.nav-list {
    list-style: none;
    padding: 0;
    margin: 0;
}

.nav-list li {
    margin-bottom: 4px;
}

.nav-link {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    color: var(--text-primary);
    text-decoration: none;
    cursor: pointer;
    transition: all 0.2s;
    font-size: 14px;
}

.nav-link:hover {
    background: var(--bg-secondary);
}

.nav-link.active {
    background: var(--primary-color);
    color: white;
    font-weight: 600;
}

.nav-link svg {
    flex-shrink: 0;
}

.nav-link span:not(.count) {
    flex: 1;
}

.count {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
    background: var(--bg-secondary);
    padding: 2px 8px;
    border-radius: 10px;
    min-width: 24px;
    text-align: center;
}

.nav-link.active .count {
    background: rgba(255, 255, 255, 0.2);
    color: white;
}

.category-dot {
    max-width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
    display: inline-block;
}

.category-link {
    position: relative;
}

.category-menu-icon {
    opacity: 0;
    transition: opacity 0.2s;
    margin-left: auto;
    color: var(--text-secondary);
}

.category-link:hover .category-menu-icon {
    opacity: 0.6;
}

.category-link.active .category-menu-icon {
    opacity: 0.4;
    color: white;
}

.tag-cloud {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 12px;
}

.tag-item {
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 16px;
    padding: 6px 12px;
    font-size: 12px;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all 0.2s;
    font-weight: 500;
}

.tag-item:hover {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
    transform: translateY(-1px);
}

.tag-item.active {
    background: var(--primary-color);
    color: white;
    border-color: var(--primary-color);
}

.sidebar::-webkit-scrollbar {
    width: 8px;
}

.sidebar::-webkit-scrollbar-track {
    background: var(--bg-secondary);
    border-radius: 4px;
}

.sidebar::-webkit-scrollbar-thumb {
    background: var(--border-color);
    border-radius: 4px;
}

.sidebar::-webkit-scrollbar-thumb:hover {
    background: var(--text-secondary);
}

/* Context Menu */
.context-menu {
    position: fixed;
    background: var(--bg-primary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    padding: 4px;
    min-width: 200px;
    z-index: 10000;
}

.context-menu-item {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 12px;
    border: none;
    background: none;
    color: var(--text-primary);
    font-size: 14px;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
    text-align: left;
}

.context-menu-item:hover:not(:disabled) {
    background: var(--bg-secondary);
}

.context-menu-item.danger {
    color: #ef4444;
}

.context-menu-item.danger:hover:not(:disabled) {
    background: rgba(239, 68, 68, 0.1);
}

.context-menu-item:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.disabled-hint {
    margin-left: auto;
    font-size: 11px;
    color: var(--text-secondary);
}

@media (max-width: 1200px) {
    .sidebar {
        width: 220px;
    }
}

@media (max-width: 768px) {
    .main-content {
        flex-direction: column;
    }

    .sidebar {
        width: 100%;
        border-right: none;
        border-bottom: 1px solid var(--border-color);
        max-height: 200px;
    }
}
</style>
