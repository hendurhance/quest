import type { TTSProviderClient } from './types'
import { estimateSpeechDurationSec } from '../audio'

function errorText(body: string): string {
  try {
    const detail = JSON.parse(body)?.detail
    if (typeof detail === 'string') return detail
    if (Array.isArray(detail)) return detail.map((d) => d?.msg).filter(Boolean).join('; ') || body
    if (detail?.message) return detail.message
  } catch {
    // not JSON — use the text as-is
  }
  return body.trim().slice(0, 300) || 'ElevenLabs API error'
}

export const elevenLabsProvider: TTSProviderClient = {
  id: 'elevenlabs',
  async speak({ text, voiceId, model, apiKey }) {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: { Accept: 'audio/mpeg', 'Content-Type': 'application/json', 'xi-api-key': apiKey },
      body: JSON.stringify({
        text,
        model_id: model,
        voice_settings: { stability: 0.5, similarity_boost: 0.5 },
      }),
    })

    if (!response.ok) throw new Error(errorText(await response.text()))

    // ElevenLabs returns encoded MP3; precise duration would need decoding,
    // so we estimate (the reader can refine on playback if needed).
    return {
      data: await response.arrayBuffer(),
      mimeType: 'audio/mpeg',
      durationSec: estimateSpeechDurationSec(text),
    }
  },
}
