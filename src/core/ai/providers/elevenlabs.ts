import type { TTSProviderClient } from './types'
import { estimateSpeechDurationSec } from '../audio'

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

    if (!response.ok) {
      throw new Error((await response.text()) || 'ElevenLabs API error')
    }

    // ElevenLabs returns encoded MP3; precise duration would need decoding,
    // so we estimate (the reader can refine on playback if needed).
    return {
      data: await response.arrayBuffer(),
      mimeType: 'audio/mpeg',
      durationSec: estimateSpeechDurationSec(text),
    }
  },
}
