import type { SummaryProviderId, TTSProviderId } from '@/core/db'
import { GEMINI_VOICES } from './voices'

export interface CatalogItem {
  id: string
  name: string
  detail?: string
}

export interface Catalog {
  items: CatalogItem[]
  available: string[]
}

interface OpenAIModel {
  id: string
  created: number
}

interface GeminiModel {
  name: string
  displayName?: string
  description?: string
  supportedGenerationMethods?: string[]
}

interface ElevenLabsModel {
  model_id: string
  name: string
  description?: string
  can_do_text_to_speech?: boolean
}

interface ElevenLabsVoice {
  voice_id: string
  name: string
  category?: string
  labels?: Record<string, string | undefined>
}

const OPENAI_TEXT = /^(gpt-|chatgpt-|o\d)/
// Audio, image, embedding and tool-only variants can't answer a plain text prompt.
const OPENAI_NON_TEXT = /(audio|realtime|tts|transcribe|search|image|embedding|instruct|moderation|codex|computer-use|deep-research)/
// Dated snapshots (gpt-4o-2024-08-06, gpt-3.5-turbo-0125) duplicate their alias.
const SNAPSHOT = /-\d{4}(-\d{2}-\d{2})?(-preview)?$/

const GEMINI_NON_TEXT = /(tts|image|embedding|live|audio|transcribe|robotics|computer-use|aqa|translate)/
const PREVIEW = /(preview|exp)/

export function openAITextModels(models: OpenAIModel[]): CatalogItem[] {
  return models
    .filter((m) => OPENAI_TEXT.test(m.id) && !OPENAI_NON_TEXT.test(m.id) && !SNAPSHOT.test(m.id))
    .sort((a, b) => b.created - a.created)
    .map((m) => ({ id: m.id, name: m.id }))
}

function compareVersions(a: string, b: string): number {
  const parse = (id: string) => (id.match(/\d+(\.\d+)?/)?.[0] ?? '0').split('.').map(Number)
  const [aMajor, aMinor = 0] = parse(a)
  const [bMajor, bMinor = 0] = parse(b)
  return aMajor - bMajor || aMinor - bMinor
}

export function geminiModels(models: GeminiModel[], kind: 'text' | 'tts'): CatalogItem[] {
  return models
    .map((m) => ({ ...m, id: m.name.replace(/^models\//, '') }))
    .filter((m) => m.id.startsWith('gemini-') && m.supportedGenerationMethods?.includes('generateContent'))
    .filter((m) => (kind === 'tts' ? m.id.includes('tts') : !GEMINI_NON_TEXT.test(m.id)))
    .sort(
      (a, b) =>
        Number(PREVIEW.test(a.id)) - Number(PREVIEW.test(b.id)) ||
        compareVersions(b.id, a.id) ||
        a.id.localeCompare(b.id),
    )
    .map((m) => ({ id: m.id, name: m.displayName || m.id, detail: m.description }))
}

export function elevenLabsTtsModels(models: ElevenLabsModel[]): CatalogItem[] {
  return models
    .filter((m) => m.can_do_text_to_speech)
    .map((m) => ({ id: m.model_id, name: m.name, detail: m.description }))
}

export function elevenLabsVoices(voices: ElevenLabsVoice[]): CatalogItem[] {
  return voices.map((v) => {
    const detail = [v.labels?.gender, v.labels?.accent, v.category].filter(Boolean).join(' · ')
    return { id: v.voice_id, name: v.name, detail: detail || undefined }
  })
}

async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const response = await fetch(url, { headers })
  if (!response.ok) {
    const body = await response.json().catch(() => ({}))
    const message = body?.error?.message || body?.detail?.message || `Request failed (${response.status})`
    throw new Error(message)
  }
  return response.json() as Promise<T>
}

const geminiInFlight = new Map<string, Promise<GeminiModel[]>>()

function fetchGemini(apiKey: string): Promise<GeminiModel[]> {
  let request = geminiInFlight.get(apiKey)
  if (!request) {
    request = getJson<{ models?: GeminiModel[] }>(
      `https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000&key=${encodeURIComponent(apiKey)}`,
    )
      .then((data) => data.models ?? [])
      .finally(() => geminiInFlight.delete(apiKey))
    geminiInFlight.set(apiKey, request)
  }
  return request
}

function geminiIds(models: GeminiModel[]): string[] {
  return models.map((m) => m.name.replace(/^models\//, ''))
}

export async function listSummaryModels(provider: SummaryProviderId, apiKey: string): Promise<Catalog> {
  if (provider === 'openai') {
    const data = await getJson<{ data?: OpenAIModel[] }>('https://api.openai.com/v1/models', {
      Authorization: `Bearer ${apiKey}`,
    })
    const models = data.data ?? []
    return { items: openAITextModels(models), available: models.map((m) => m.id) }
  }
  const models = await fetchGemini(apiKey)
  return { items: geminiModels(models, 'text'), available: geminiIds(models) }
}

export async function listTtsModels(provider: TTSProviderId, apiKey: string): Promise<Catalog> {
  if (provider === 'elevenlabs') {
    const models = await getJson<ElevenLabsModel[]>('https://api.elevenlabs.io/v1/models', { 'xi-api-key': apiKey })
    return { items: elevenLabsTtsModels(models), available: models.map((m) => m.model_id) }
  }
  const models = await fetchGemini(apiKey)
  return { items: geminiModels(models, 'tts'), available: geminiIds(models) }
}

const MAX_VOICE_PAGES = 20

export async function listVoices(provider: TTSProviderId, apiKey: string): Promise<Catalog> {
  if (provider === 'gemini') {
    const items = GEMINI_VOICES.map((v) => ({ id: v.id, name: v.name, detail: v.gender }))
    return { items, available: items.map((v) => v.id) }
  }
  const voices: ElevenLabsVoice[] = []
  let token: string | null = null
  for (let page = 0; page < MAX_VOICE_PAGES; page++) {
    const url = new URL('https://api.elevenlabs.io/v2/voices')
    url.searchParams.set('page_size', '100')
    if (token) url.searchParams.set('next_page_token', token)
    const data: { voices?: ElevenLabsVoice[]; has_more?: boolean; next_page_token?: string | null } = await getJson(
      url.toString(),
      { 'xi-api-key': apiKey },
    )
    voices.push(...(data.voices ?? []))
    token = data.has_more ? data.next_page_token ?? null : null
    if (!token) break
  }
  const items = elevenLabsVoices(voices)
  return { items, available: items.map((v) => v.id) }
}
