<template>
  <QModal :open="open" title="Settings" size="md" @update:open="$emit('update:open', $event)">
    <div class="settings">
      <section class="sec">
        <h4 class="sec__label">Appearance</h4>
        <div class="row">
          <div class="row__text">
            <span class="row__name">Theme</span>
            <span class="row__desc">Paper for daylight, Ink for night.</span>
          </div>
          <div class="seg">
            <button type="button" :class="{ on: theme === 'light' }" @click="setTheme('light')">
              <QIcon name="sun" :size="14" /> Paper
            </button>
            <button type="button" :class="{ on: theme === 'dark' }" @click="setTheme('dark')">
              <QIcon name="moon" :size="14" /> Ink
            </button>
          </div>
        </div>
      </section>

      <section class="sec">
        <h4 class="sec__label">AI Summaries</h4>
        <div class="row">
          <div class="row__text"><span class="row__name">Provider</span></div>
          <div class="control">
            <select v-model="form.summaryProvider">
              <option :value="OPENAI">OpenAI</option>
              <option :value="GEMINI">Gemini</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="row__text"><span class="row__name">Model</span></div>
          <div class="control">
            <select v-if="form.summaryProvider === OPENAI" v-model="form.openaiModel">
              <option v-for="m in OPENAI_MODELS" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
            <select v-else v-model="form.geminiModel">
              <option v-for="m in GEMINI_MODELS" :key="m.id" :value="m.id">{{ m.name }}</option>
            </select>
          </div>
        </div>
      </section>

      <section class="sec">
        <h4 class="sec__label">Podcasts</h4>
        <div class="row">
          <div class="row__text"><span class="row__name">Voice provider</span></div>
          <div class="control">
            <select v-model="form.ttsProvider">
              <option :value="GEMINI">Gemini TTS</option>
              <option :value="ELEVENLABS">ElevenLabs</option>
            </select>
          </div>
        </div>
        <div class="row">
          <div class="row__text"><span class="row__name">Voice</span></div>
          <div class="control">
            <select v-if="form.ttsProvider === GEMINI" v-model="form.geminiTtsVoice">
              <option v-for="v in GEMINI_VOICES" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
            <select v-else v-model="form.elevenlabsVoiceId">
              <option v-for="v in ELEVENLABS_VOICES" :key="v.id" :value="v.id">{{ v.name }}</option>
            </select>
          </div>
        </div>
      </section>

      <!-- API keys — only the providers currently in use -->
      <section class="sec">
        <h4 class="sec__label">API Keys</h4>
        <div v-if="needOpenAI" class="field">
          <div class="field__top">
            <span class="field__name">OpenAI</span>
            <span class="field__state" :class="{ 'is-set': keyState.openai }">{{ keyState.openai ? 'Saved' : 'Not set' }}</span>
          </div>
          <div class="field__row">
            <input v-model="keyInput.openai" class="input" type="password" placeholder="sk-…" />
            <QButton variant="secondary" size="sm" :disabled="!keyInput.openai" @click="test(OPENAI, keyInput.openai)">Test</QButton>
          </div>
        </div>
        <div v-if="needGemini" class="field">
          <div class="field__top">
            <span class="field__name">Gemini</span>
            <span class="field__state" :class="{ 'is-set': keyState.gemini }">{{ keyState.gemini ? 'Saved' : 'Not set' }}</span>
          </div>
          <div class="field__row">
            <input v-model="keyInput.gemini" class="input" type="password" placeholder="AIza…" />
            <QButton variant="secondary" size="sm" :disabled="!keyInput.gemini" @click="test(GEMINI, keyInput.gemini)">Test</QButton>
          </div>
        </div>
        <div v-if="needElevenLabs" class="field">
          <div class="field__top">
            <span class="field__name">ElevenLabs</span>
            <span class="field__state" :class="{ 'is-set': keyState.elevenlabs }">{{ keyState.elevenlabs ? 'Saved' : 'Not set' }}</span>
          </div>
          <div class="field__row">
            <input v-model="keyInput.elevenlabs" class="input" type="password" placeholder="Your ElevenLabs key" />
            <QButton variant="secondary" size="sm" :disabled="!keyInput.elevenlabs" @click="test(ELEVENLABS, keyInput.elevenlabs)">Test</QButton>
          </div>
        </div>
        <p class="hint">Keys are encrypted on this device and never synced.</p>
      </section>

      <section class="sec">
        <h4 class="sec__label">Automation</h4>
        <div class="row">
          <div class="row__text">
            <span class="row__name">Summarise on save</span>
            <span class="row__desc">Generate a summary the moment you save.</span>
          </div>
          <QSwitch v-model="form.autoSummary" />
        </div>
        <div class="row">
          <div class="row__text">
            <span class="row__name">Podcast on save</span>
            <span class="row__desc">Also produce a spoken version.</span>
          </div>
          <QSwitch v-model="form.autoPodcast" />
        </div>
        <div class="row">
          <div class="row__text">
            <span class="row__name">AI grouping on save</span>
            <span class="row__desc">Let AI choose the shelf and tags.</span>
          </div>
          <QSwitch v-model="form.autoGroup" />
        </div>
        <div class="row">
          <div class="row__text">
            <span class="row__name">Auto-archive</span>
            <span class="row__desc">Tidy away read articles automatically.</span>
          </div>
          <QSwitch v-model="form.autoArchive" />
        </div>
        <div v-if="form.autoArchive" class="row">
          <div class="row__text"><span class="row__name">Archive after</span></div>
          <div class="control control--num">
            <input v-model.number="form.archiveDays" class="input input--num" type="number" min="1" />
            <span class="unit">days</span>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <QButton variant="ghost" @click="$emit('update:open', false)">Cancel</QButton>
      <QButton variant="primary" :loading="saving" @click="save">Save settings</QButton>
    </template>
  </QModal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Settings } from '@/types'
import { AIProvider } from '@/types'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { hasApiKey, setApiKey } from '@/core/keys'
import { sendMessage } from '@/core/messaging/bus'
import { defaultSettings } from '@/core/settings'
import { OPENAI_MODELS, GEMINI_MODELS } from '@/core/ai/models'
import { GEMINI_VOICES, ELEVENLABS_VOICES } from '@/core/ai/voices'
import { QModal, QButton, QIcon, QSwitch } from '@/design/primitives'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const settings = useSettingsStore()
const ui = useUiStore()
const { theme, setTheme } = useTheme()

const OPENAI = AIProvider.OPENAI
const GEMINI = AIProvider.GEMINI
const ELEVENLABS = AIProvider.ELEVENLABS

const form = ref<Settings>(defaultSettings())
const keyInput = ref({ openai: '', gemini: '', elevenlabs: '' })
const keyState = ref({ openai: false, gemini: false, elevenlabs: false })
const saving = ref(false)

// Only surface the keys for providers actually selected.
const needOpenAI = computed(() => form.value.summaryProvider === OPENAI)
const needGemini = computed(() => form.value.summaryProvider === GEMINI || form.value.ttsProvider === GEMINI)
const needElevenLabs = computed(() => form.value.ttsProvider === ELEVENLABS)

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await settings.load()
    form.value = { ...defaultSettings(), ...(settings.settings ?? {}) }
    keyInput.value = { openai: '', gemini: '', elevenlabs: '' }
    keyState.value = {
      openai: await hasApiKey(AIProvider.OPENAI),
      gemini: await hasApiKey(AIProvider.GEMINI),
      elevenlabs: await hasApiKey(AIProvider.ELEVENLABS),
    }
  },
)

async function test(provider: AIProvider, key: string): Promise<void> {
  if (!key) return
  try {
    const res = await sendMessage({ action: 'testApiKey', provider, apiKey: key })
    if (res.success) ui.success('API key works')
    else ui.error(res.error || 'API key test failed')
  } catch {
    ui.error('Could not test key')
  }
}

async function save(): Promise<void> {
  saving.value = true
  try {
    await settings.save(form.value)
    if (keyInput.value.openai) await setApiKey(AIProvider.OPENAI, keyInput.value.openai)
    if (keyInput.value.gemini) await setApiKey(AIProvider.GEMINI, keyInput.value.gemini)
    if (keyInput.value.elevenlabs) await setApiKey(AIProvider.ELEVENLABS, keyInput.value.elevenlabs)
    sendMessage({ action: 'settingsSaved' }).catch(() => {})
    ui.success('Settings saved')
    emit('update:open', false)
  } catch (err) {
    ui.error(err instanceof Error ? err.message : 'Failed to save settings')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}
.sec {
  display: flex;
  flex-direction: column;
}
.sec__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-faint);
  margin-bottom: 0.4rem;
}
.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: 0.7rem 0;
  border-top: 1px solid var(--rule);
}
.sec .row:first-of-type {
  border-top: 0;
}
.row__text {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}
.row__name {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
}
.row__desc {
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
.control {
  width: 220px;
  flex: none;
  position: relative;
}
.control select {
  width: 100%;
  appearance: none;
  font-family: var(--font-serif);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.45rem 1.9rem 0.45rem 0.65rem;
  cursor: pointer;
}
.control:not(.control--num)::after {
  content: '▾';
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-faint);
  pointer-events: none;
}
.control--num {
  width: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.seg {
  display: flex;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  overflow: hidden;
  flex: none;
}
.seg button {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.4rem 0.7rem;
  border: 0;
  background: var(--paper-raised);
  color: var(--ink-muted);
  cursor: pointer;
  font-family: var(--font-serif);
  font-size: var(--text-sm);
}
.seg button + button {
  border-left: 1px solid var(--rule-strong);
}
.seg button.on {
  background: var(--accent-tint);
  color: var(--accent);
}
.field {
  padding: 0.7rem 0;
  border-top: 1px solid var(--rule);
}
.sec .field:first-of-type {
  border-top: 0;
}
.field__top {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  margin-bottom: 0.4rem;
}
.field__name {
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
}
.field__state {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
.field__state.is-set {
  color: var(--positive);
}
.field__row {
  display: flex;
  gap: 0.5rem;
}
.input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.45rem 0.6rem;
  outline: none;
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}
.input--num {
  width: 80px;
  flex: none;
  text-align: center;
}
.unit {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
}
.hint {
  margin-top: 0.6rem;
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
</style>
