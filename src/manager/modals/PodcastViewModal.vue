<template>
  <Teleport to="body">
    <div v-if="show" class="podcast-modal-overlay" @click.self="closeModal">
      <div class="podcast-modal">
        <div class="podcast-modal-header">
          <div class="podcast-modal-title-section">
            <h3 class="podcast-modal-title">Podcast Player</h3>
            <span class="provider-badge" :class="audioFile.provider.toLowerCase()">
              {{ audioFile.provider.toUpperCase() }}
            </span>
            <span v-if="audioFile.voiceId" class="voice-badge" title="Voice used">
              {{ audioFile.voiceId }}
            </span>
          </div>
          <button class="podcast-modal-close" @click="closeModal" title="Close">&times;</button>
        </div>
        <div class="podcast-modal-body">
          <div class="audio-player">
            <audio 
              ref="audioElement" 
              controls 
              style="width: 100%;"
              :src="audioUrl"
              type="audio/mpeg"
            >
              Your browser does not support the audio element.
            </audio>
            <div class="audio-info">
              <div class="audio-info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
                <div class="audio-info-content">
                  <span class="audio-info-label">Duration</span>
                  <span class="audio-info-value">{{ formatDuration(actualDuration || audioFile.duration) }}</span>
                </div>
              </div>
              <div class="audio-info-item">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                </svg>
                <div class="audio-info-content">
                  <span class="audio-info-label">Generated</span>
                  <span class="audio-info-value">{{ new Date(audioFile.generatedDate).toLocaleDateString() }}</span>
                </div>
              </div>
            </div>
            <div class="audio-actions">
              <button class="audio-action-btn download-btn" @click="handleDownload" title="Download audio file">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                Download
              </button>
              <button class="audio-action-btn inject-btn" @click="handleInject" title="Inject into page">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="16 18 22 12 16 6"></polyline>
                  <polyline points="8 6 2 12 8 18"></polyline>
                </svg>
                Inject to Page
              </button>
              <button class="audio-action-btn regenerate-btn" @click="handleRegenerate" title="Regenerate podcast">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
                Regenerate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount } from 'vue'
import type { AudioFile, Article } from '@/types'

interface Props {
  show: boolean
  audioFile: AudioFile
  article: Article
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'regenerate', articleId: string): void
  (e: 'inject', article: Article, audioFile: AudioFile, audioUrl: string): void
}>()

const audioElement = ref<HTMLAudioElement | null>(null)
const audioUrl = ref('')
const actualDuration = ref(0)
let eventListenersAdded = false

// Add event listeners to audio element when it's first mounted
watch(() => audioElement.value, (el) => {
  if (el && !eventListenersAdded) {
    el.addEventListener('loadedmetadata', () => {
      // Update actual duration from audio element
      if (el.duration && isFinite(el.duration)) {
        actualDuration.value = el.duration
      }
    })
    
    eventListenersAdded = true
  }
})

// Create blob URL when audioFile changes
watch(() => props.audioFile, async (audioFile) => {
  if (audioFile && audioFile.audioBlob) {    
    // Validate blob before converting
    if (!(audioFile.audioBlob instanceof Blob)) {
      return
    }
    
    if (audioFile.audioBlob.size === 0) {
      return
    }
    
    // Only recreate if we have a different audio file
    const needsNewUrl = !audioUrl.value || audioFile.id !== props.audioFile.id
    
    if (needsNewUrl) {
      // Revoke old URL to prevent memory leaks
      if (audioUrl.value && audioUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl.value)
      }
      audioUrl.value = ''
      
      try {
        // Create blob URL
        const blobUrl = URL.createObjectURL(audioFile.audioBlob)
        
        // Set the URL (Vue will update the audio src attribute)
        audioUrl.value = blobUrl
        
        // Wait a tick for Vue to update the DOM
        await new Promise(resolve => setTimeout(resolve, 0))
        
        // Force reload if element is available
        if (audioElement.value) {
          audioElement.value.load()
        } else {
          console.warn('Audio element not available yet')
        }
      } catch (error) {
        console.error('Error creating or testing blob URL:', error)
      }
    }
  } else if (audioFile && !audioFile.audioBlob) {
    console.error('AudioFile provided but audioBlob is missing!')
  }
}, { immediate: true })

// Cleanup on unmount
const cleanup = () => {
  if (audioUrl.value && audioUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(audioUrl.value)
  }
}

// Use onBeforeUnmount if available, otherwise just cleanup
if (typeof onBeforeUnmount !== 'undefined') {
  onBeforeUnmount(cleanup)
}

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

const closeModal = () => {
  emit('close')
}

const handleRegenerate = () => {
  emit('regenerate', props.article.id)
  closeModal()
}

const handleDownload = () => {
  if (!audioUrl.value) {
    return
  }

  const fileName = `podcast-${props.article.title.substring(0, 30).replace(/[^a-z0-9]/gi, '-').toLowerCase()}.wav`
  
  // Create temporary anchor element
  const a = document.createElement('a')
  a.href = audioUrl.value
  a.download = fileName
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const handleInject = () => {
  if (!audioUrl.value) {
    return
  }

  emit('inject', props.article, props.audioFile, audioUrl.value)
  // Don't close modal immediately - let the parent handle it
}
</script>

<style scoped>
.podcast-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.podcast-modal {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  max-width: 500px;
  width: 90%;
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.podcast-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color);
  gap: 16px;
}

.podcast-modal-title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.podcast-modal-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.provider-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.provider-badge.openai {
  background: #10a37f20;
  color: #10a37f;
  border: 1px solid #10a37f40;
}

.provider-badge.gemini {
  background: #4285f420;
  color: #4285f4;
  border: 1px solid #4285f440;
}

.provider-badge.elevenlabs {
  background: #7c3aed20;
  color: #7c3aed;
  border: 1px solid #7c3aed40;
}

.voice-badge {
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.podcast-modal-close {
  padding: 8px;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  font-size: 24px;
  background: transparent;
  color: var(--text-secondary);
  transition: all 0.2s;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
}

.podcast-modal-close:hover {
  background: #ef444420;
  color: #ef4444;
}

.podcast-modal-body {
  padding: 24px;
}

.audio-player {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.audio-player audio {
  width: 100%;
  height: 54px;
  border-radius: 8px;
}

.audio-info {
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 16px;
  background: var(--bg-secondary);
  border-radius: 8px;
  gap: 24px;
}

.audio-info-item {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: center;
}

.audio-info-item svg {
  color: var(--text-secondary);
  flex-shrink: 0;
}

.audio-info-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.audio-info-label {
  font-size: 11px;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  font-weight: 500;
}

.audio-info-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.audio-actions {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin-top: 8px;
}

.audio-action-btn {
  padding: 10px 16px;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  white-space: nowrap;
}

.audio-action-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.audio-action-btn:active {
  transform: translateY(0);
}

.download-btn {
  background: #3b82f620;
  color: #3b82f6;
  border: 1px solid #3b82f640;
}

.download-btn:hover {
  background: #3b82f630;
  border-color: #3b82f660;
}

.inject-btn {
  background: #10b98120;
  color: #10b981;
  border: 1px solid #10b98140;
}

.inject-btn:hover {
  background: #10b98130;
  border-color: #10b98160;
}

.regenerate-btn {
  background: #1daabf20;
  color: #1daabf;
  border: 1px solid #1daabf40;
}

.regenerate-btn:hover {
  background: #1daabf30;
  border-color: #1daabf60;
}
</style>
