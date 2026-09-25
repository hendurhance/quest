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
        <h4 class="sec__label">Summaries</h4>
        <div class="row row--field">
          <div class="row__text"><span class="row__name">Provider</span></div>
          <div class="control select">
            <select :value="form.summaryProvider" @change="setSummaryProvider">
              <option :value="OPENAI">OpenAI</option>
              <option :value="GEMINI">Gemini</option>
            </select>
          </div>
        </div>
        <div class="row row--field">
          <div class="row__text"><span class="row__name">API key</span></div>
          <ApiKeyField
            v-model="keyInput[form.summaryProvider]"
            class="control"
            :provider="form.summaryProvider"
            :saved="keyState[form.summaryProvider]"
            :testing="testing === form.summaryProvider"
            @commit="refreshProvider(form.summaryProvider)"
            @test="test(form.summaryProvider)"
            @remove="removeKey(form.summaryProvider)"
          />
        </div>
        <div class="row row--field">
          <div class="row__text">
            <span class="row__name">Model</span>
            <span class="row__desc">Listed live from {{ providerName(form.summaryProvider) }}.</span>
          </div>
          <CatalogSelect
            v-model="summaryModel"
            class="control"
            placeholder="Choose a model…"
            :state="list(`summary:${form.summaryProvider}`)"
            @retry="loadSummaryModels"
          />
        </div>
      </section>

      <section class="sec">
        <h4 class="sec__label">Podcasts</h4>
        <div class="row row--field">
          <div class="row__text"><span class="row__name">Voice provider</span></div>
          <div class="control select">
            <select :value="form.ttsProvider" @change="setTtsProvider">
              <option :value="GEMINI">Gemini</option>
              <option :value="ELEVENLABS">ElevenLabs</option>
            </select>
          </div>
        </div>
        <div class="row row--field">
          <div class="row__text"><span class="row__name">API key</span></div>
          <p v-if="form.ttsProvider === form.summaryProvider" class="control shared">
            Uses your {{ providerName(form.ttsProvider) }} key above.
          </p>
          <ApiKeyField
            v-else
            v-model="keyInput[form.ttsProvider]"
            class="control"
            :provider="form.ttsProvider"
            :saved="keyState[form.ttsProvider]"
            :testing="testing === form.ttsProvider"
            @commit="refreshProvider(form.ttsProvider)"
            @test="test(form.ttsProvider)"
            @remove="removeKey(form.ttsProvider)"
          />
        </div>
        <div class="row row--field">
          <div class="row__text"><span class="row__name">Model</span></div>
          <CatalogSelect
            v-model="ttsModel"
            class="control"
            placeholder="Choose a voice model…"
            :state="list(`tts:${form.ttsProvider}`)"
            @retry="loadTtsLists"
          />
        </div>
        <div class="row row--field">
          <div class="row__text"><span class="row__name">Voice</span></div>
          <CatalogSelect
            v-model="voice"
            class="control"
            placeholder="Choose a voice…"
            :state="list(`voice:${form.ttsProvider}`)"
            @retry="loadTtsLists"
          />
        </div>
      </section>

      <section class="sec">
        <h4 class="sec__label">Automation</h4>
        <label class="row">
          <span class="row__text">
            <span class="row__name">Summarise on save</span>
            <span class="row__desc">Generate a summary the moment you save.</span>
          </span>
          <QSwitch v-model="form.autoSummary" />
        </label>
        <label class="row">
          <span class="row__text">
            <span class="row__name">Podcast on save</span>
            <span class="row__desc">Also produce a spoken version.</span>
          </span>
          <QSwitch v-model="form.autoPodcast" />
        </label>
        <label class="row">
          <span class="row__text">
            <span class="row__name">AI grouping on save</span>
            <span class="row__desc">Let AI choose the shelf and tags.</span>
          </span>
          <QSwitch v-model="form.autoGroup" />
        </label>
        <label class="row">
          <span class="row__text">
            <span class="row__name">Auto-archive</span>
            <span class="row__desc">Tidy away read articles automatically.</span>
          </span>
          <QSwitch v-model="form.autoArchive" />
        </label>
        <div v-if="form.autoArchive" class="row">
          <div class="row__text"><span class="row__name">Archive after</span></div>
          <div class="control--num">
            <input v-model.number="form.archiveDays" class="input input--num" type="number" min="1" />
            <span class="unit">days</span>
          </div>
        </div>
      </section>

      <p class="hint">API keys are encrypted on this device and never synced.</p>
    </div>

    <template #footer>
      <QButton variant="ghost" @click="$emit('update:open', false)">Cancel</QButton>
      <QButton variant="primary" :loading="saving" @click="save">Save settings</QButton>
    </template>
  </QModal>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import type { Settings, SummaryProvider, TTSProvider } from '@/types'
import { AIProvider, getProviderDisplayName } from '@/types'
import { useSettingsStore } from '@/stores/settings'
import { useUiStore } from '@/stores/ui'
import { useTheme } from '@/composables/useTheme'
import { getApiKey, hasApiKey, removeApiKey, setApiKey } from '@/core/keys'
import { sendMessage } from '@/core/messaging/bus'
import { defaultSettings } from '@/core/settings'
import { listSummaryModels, listTtsModels, listVoices } from '@/core/ai/catalog'
import type { Catalog } from '@/core/ai/catalog'
import { QModal, QButton, QIcon, QSwitch } from '@/design/primitives'
import CatalogSelect from './CatalogSelect.vue'
import type { CatalogState } from './CatalogSelect.vue'
import ApiKeyField from './ApiKeyField.vue'

const props = defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: 'update:open', value: boolean): void }>()

const settings = useSettingsStore()
const ui = useUiStore()
const { theme, setTheme } = useTheme()

const OPENAI = AIProvider.OPENAI
const GEMINI = AIProvider.GEMINI
const ELEVENLABS = AIProvider.ELEVENLABS
const providerName = getProviderDisplayName

const emptyKeys = () => ({ [OPENAI]: '', [GEMINI]: '', [ELEVENLABS]: '' })
const form = ref<Settings>(defaultSettings())
const keyInput = reactive<Record<AIProvider, string>>(emptyKeys())
const keyState = reactive<Record<AIProvider, boolean>>({ [OPENAI]: false, [GEMINI]: false, [ELEVENLABS]: false })
const testing = ref<AIProvider | null>(null)
const saving = ref(false)

const summaryModel = computed({
  get: () => (form.value.summaryProvider === OPENAI ? form.value.openaiModel : form.value.geminiModel),
  set: (id: string) => {
    if (form.value.summaryProvider === OPENAI) form.value.openaiModel = id
    else form.value.geminiModel = id
  },
})
const ttsModel = computed({
  get: () => (form.value.ttsProvider === ELEVENLABS ? form.value.elevenlabsModel : form.value.geminiTtsModel ?? ''),
  set: (id: string) => {
    if (form.value.ttsProvider === ELEVENLABS) form.value.elevenlabsModel = id
    else form.value.geminiTtsModel = id
  },
})
const voice = computed({
  get: () => (form.value.ttsProvider === ELEVENLABS ? form.value.elevenlabsVoiceId : form.value.geminiTtsVoice),
  set: (id: string) => {
    if (form.value.ttsProvider === ELEVENLABS) form.value.elevenlabsVoiceId = id
    else form.value.geminiTtsVoice = id
  },
})

const IDLE: CatalogState = { status: 'idle', items: [], available: [] }
const lists = reactive<Record<string, CatalogState>>({})
const requestSeq: Record<string, number> = {}

function list(key: string): CatalogState {
  return lists[key] ?? IDLE
}

async function keyFor(provider: AIProvider): Promise<string | null> {
  const typed = keyInput[provider].trim()
  if (typed) return typed
  return keyState[provider] ? getApiKey(provider) : null
}

async function load(key: string, fetchCatalog: (apiKey: string) => Promise<Catalog>, provider?: AIProvider) {
  const seq = (requestSeq[key] = (requestSeq[key] ?? 0) + 1)
  const isLatest = () => requestSeq[key] === seq
  const apiKey = provider ? await keyFor(provider) : ''
  if (!isLatest()) return
  if (apiKey === null) {
    lists[key] = IDLE
    return
  }
  lists[key] = { ...list(key), status: 'loading' }
  try {
    const catalog = await fetchCatalog(apiKey)
    if (isLatest()) lists[key] = { status: 'ready', ...catalog }
  } catch (error) {
    if (isLatest()) {
      lists[key] = { ...IDLE, status: 'error', error: error instanceof Error ? error.message : 'unknown error' }
    }
  }
}

function loadSummaryModels(): void {
  const p = form.value.summaryProvider
  const id = p === OPENAI ? 'openai' : 'gemini'
  void load(`summary:${p}`, (k) => listSummaryModels(id, k), p)
}

function loadTtsLists(): void {
  const p = form.value.ttsProvider
  const id = p === ELEVENLABS ? 'elevenlabs' : 'gemini'
  void load(`tts:${p}`, (k) => listTtsModels(id, k), p)
  void load(`voice:${p}`, (k) => listVoices(id, k), p === ELEVENLABS ? p : undefined)
}

function refreshProvider(provider: AIProvider): void {
  if (form.value.summaryProvider === provider) loadSummaryModels()
  if (form.value.ttsProvider === provider) loadTtsLists()
}

function setSummaryProvider(event: Event): void {
  form.value.summaryProvider = (event.target as HTMLSelectElement).value as SummaryProvider
  loadSummaryModels()
}

function setTtsProvider(event: Event): void {
  form.value.ttsProvider = (event.target as HTMLSelectElement).value as TTSProvider
  loadTtsLists()
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    await settings.load()
    Object.assign(keyInput, emptyKeys())
    const [openai, gemini, elevenlabs] = await Promise.all([hasApiKey(OPENAI), hasApiKey(GEMINI), hasApiKey(ELEVENLABS)])
    Object.assign(keyState, { [OPENAI]: openai, [GEMINI]: gemini, [ELEVENLABS]: elevenlabs })
    form.value = { ...defaultSettings(), ...(settings.settings ?? {}) }
    loadSummaryModels()
    loadTtsLists()
  },
)

async function test(provider: AIProvider): Promise<void> {
  const apiKey = await keyFor(provider)
  if (!apiKey) return
  testing.value = provider
  try {
    const res = await sendMessage({ action: 'testApiKey', provider, apiKey })
    if (res.success) {
      ui.success(`${providerName(provider)} key works`)
      refreshProvider(provider)
    } else {
      ui.error(res.error || 'API key test failed')
    }
  } catch {
    ui.error('Could not test key')
  } finally {
    testing.value = null
  }
}

async function removeKey(provider: AIProvider): Promise<void> {
  await removeApiKey(provider)
  keyState[provider] = false
  keyInput[provider] = ''
  refreshProvider(provider)
  ui.success(`${providerName(provider)} key removed`)
}

async function save(): Promise<void> {
  saving.value = true
  try {
    await settings.save({ ...form.value, theme: theme.value })
    for (const provider of [OPENAI, GEMINI, ELEVENLABS]) {
      const typed = keyInput[provider].trim()
      if (typed) await setApiKey(provider, typed)
    }
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
label.row {
  cursor: pointer;
}
.row--field {
  align-items: flex-start;
}
.row--field .row__text {
  padding-top: 0.4rem;
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
  width: 270px;
  flex: none;
}
.select {
  position: relative;
}
.select select {
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
.select::after {
  content: '▾';
  position: absolute;
  right: 0.65rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--ink-faint);
  pointer-events: none;
}
.shared {
  padding-top: 0.45rem;
  font-size: var(--text-sm);
  color: var(--ink-muted);
  font-style: italic;
}
.control--num {
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
.input {
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.45rem 0.6rem;
  outline: none;
}
.input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}
.input--num {
  width: 80px;
  text-align: center;
}
.unit {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-muted);
}
.hint {
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}

@media (max-width: 600px) {
  .row--field {
    flex-direction: column;
    align-items: stretch;
    gap: 0.4rem;
  }
  .row--field .row__text {
    padding-top: 0;
  }
  .control {
    width: 100%;
  }
}
</style>
