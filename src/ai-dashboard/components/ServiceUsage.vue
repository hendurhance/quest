<template>
  <section class="service-usage-section">
    <div class="section-header">
      <div class="section-title-group">
        <h2 class="section-title">Service Usage</h2>
        <p class="section-subtitle">Monitor your AI service consumption and performance</p>
      </div>
    </div>
    
    <div class="service-grid">
      <div class="service-card">
        <div class="service-card-header">
          <div class="service-info">
            <div class="service-icon openai">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.8956zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h3 class="service-name">OpenAI</h3>
              <p class="service-model">{{ settings?.openaiModel || OPENAI_MODELS[5].id.toString() }}</p>
            </div>
          </div>
          <div class="service-badge primary">
            {{ formatNumber(serviceUsage.openai.calls) }} calls
          </div>
        </div>
        
        <div class="service-metrics">
          <div class="metric">
            <span class="metric-label">Tokens Used</span>
            <span class="metric-value">{{ formatNumber(serviceUsage.openai.tokens) }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric">
            <span class="metric-label">Average per Call</span>
            <span class="metric-value">{{ calculateAverage(serviceUsage.openai.tokens, serviceUsage.openai.calls) }}</span>
          </div>
        </div>
        
        <div class="service-progress">
          <div class="progress-bar">
            <div class="progress-fill primary" :style="{ width: getUsagePercentage(serviceUsage.openai.tokens, 100000) + '%' }"></div>
          </div>
          <span class="progress-label">{{ getUsagePercentage(serviceUsage.openai.tokens, 100000) }}% of estimated limit</span>
        </div>
      </div>

      <div class="service-card">
        <div class="service-card-header">
          <div class="service-info">
            <div class="service-icon gemini">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"/>
              </svg>
            </div>
            <div>
              <h3 class="service-name">Google Gemini</h3>
              <p class="service-model">{{ settings?.geminiModel || GEMINI_MODELS[1].id.toString() }}</p>
            </div>
          </div>
          <div class="service-badge success">
            {{ formatNumber(serviceUsage.gemini.calls) }} calls
          </div>
        </div>
        
        <div class="service-metrics">
          <div class="metric">
            <span class="metric-label">Tokens Used</span>
            <span class="metric-value">{{ formatNumber(serviceUsage.gemini.tokens) }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric">
            <span class="metric-label">Average per Call</span>
            <span class="metric-value">{{ calculateAverage(serviceUsage.gemini.tokens, serviceUsage.gemini.calls) }}</span>
          </div>
        </div>
        
        <div class="service-progress">
          <div class="progress-bar">
            <div class="progress-fill success" :style="{ width: getUsagePercentage(serviceUsage.gemini.tokens, 100000) + '%' }"></div>
          </div>
          <span class="progress-label">{{ getUsagePercentage(serviceUsage.gemini.tokens, 100000) }}% of estimated limit</span>
        </div>
      </div>

      <div class="service-card">
        <div class="service-card-header">
          <div class="service-info">
            <div class="service-icon elevenlabs">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M5 0h5v24H5V0zM14 0h5v24h-5V0z"/>
              </svg>
            </div>
            <div>
              <h3 class="service-name">ElevenLabs</h3>
              <p class="service-model">Voice Synthesis</p>
            </div>
          </div>
          <div class="service-badge warning">
            {{ formatNumber(serviceUsage.elevenlabs.calls) }} calls
          </div>
        </div>
        
        <div class="service-metrics">
          <div class="metric">
            <span class="metric-label">Characters</span>
            <span class="metric-value">{{ formatNumber(serviceUsage.elevenlabs.characters) }}</span>
          </div>
          <div class="metric-divider"></div>
          <div class="metric">
            <span class="metric-label">Total Duration</span>
            <span class="metric-value">{{ formatDuration(serviceUsage.elevenlabs.duration) }}</span>
          </div>
        </div>
        
        <div class="service-progress">
          <div class="progress-bar">
            <div class="progress-fill warning" :style="{ width: getUsagePercentage(serviceUsage.elevenlabs.characters, 10000) + '%' }"></div>
          </div>
          <span class="progress-label">{{ getUsagePercentage(serviceUsage.elevenlabs.characters, 10000) }}% of monthly quota</span>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { GEMINI_MODELS, OPENAI_MODELS } from '@/utils/model-config';

interface Settings {
  openaiModel?: string
  geminiModel?: string
}

interface ServiceUsage {
  openai: { calls: number; tokens: number }
  gemini: { calls: number; tokens: number }
  elevenlabs: { calls: number; characters: number; duration: number }
}

interface Props {
  serviceUsage: ServiceUsage
  settings: Settings | null
}

defineProps<Props>()

const formatNumber = (num: number): string => {
  return num.toLocaleString()
}

const formatDuration = (seconds: number): string => {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const secs = Math.round(seconds % 60)
  if (minutes < 60) return `${minutes}m ${secs}s`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return `${hours}h ${mins}m`
}

const calculateAverage = (total: number, calls: number): string => {
  if (calls === 0) return '0'
  return Math.round(total / calls).toLocaleString()
}

const getUsagePercentage = (used: number, limit: number): number => {
  if (limit === 0) return 0
  return Math.min(Math.round((used / limit) * 100), 100)
}
</script>

<style scoped>
.service-usage-section {
  margin-bottom: 48px;
}

.section-header {
  margin-bottom: 24px;
}

.section-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  margin: 0;
}

.service-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 24px;
}

.service-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.service-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
  border-color: var(--primary-color);
}

.service-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
}

.service-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.service-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.service-icon.openai {
  background: #EEF2FF;
  color: #4F46E5;
}

.service-icon.gemini {
  background: #ECFDF5;
  color: #059669;
}

.service-icon.elevenlabs {
  background: #E0F2F4;
  color: #0B3C49;
}

.service-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.service-model {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 2px 0 0 0;
  font-weight: 500;
}

.service-badge {
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}

.service-badge.primary {
  background: #EEF2FF;
  color: #4F46E5;
}

.service-badge.success {
  background: #ECFDF5;
  color: #059669;
}

.service-badge.warning {
  background: #E0F2F4;
  color: #0B3C49;
}

.service-metrics {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
  padding: 16px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.metric {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.metric-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.metric-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
}

.metric-divider {
  width: 1px;
  height: 40px;
  background: var(--border-color);
}

.service-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.progress-bar {
  height: 8px;
  background: var(--bg-secondary);
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 999px;
  transition: width 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-fill.primary {
  background: linear-gradient(90deg, #6366F1, #4F46E5);
}

.progress-fill.success {
  background: linear-gradient(90deg, #10B981, #059669);
}

.progress-fill.warning {
  background: linear-gradient(90deg, #1FB6CC, #0B3C49);
}

.progress-label {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

@media (max-width: 768px) {
  .service-grid {
    grid-template-columns: 1fr;
  }

  .service-metrics {
    flex-direction: column;
    gap: 16px;
  }

  .metric-divider {
    width: 100%;
    height: 1px;
  }
}
</style>
