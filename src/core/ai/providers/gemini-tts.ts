import type { TTSProviderClient } from './types'
import { base64ToBytes, isPcm, parsePcmRate, pcmToWav, pcmDurationSec, estimateSpeechDurationSec } from '../audio'

export const geminiTtsProvider: TTSProviderClient = {
  id: 'gemini',
  async speak({ text, voiceId, model, apiKey }) {
    const prompt =
      'Read this aloud like a warm, engaging human podcast host — natural pacing, real expression and emphasis, with the easy rhythm of someone actually talking, not a narrator:'
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${prompt}\n\n${text}` }] }],
          generationConfig: {
            response_modalities: ['AUDIO'],
            speech_config: { voice_config: { prebuilt_voice_config: { voice_name: voiceId } } },
          },
        }),
      },
    )

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error?.message || 'Gemini TTS API error')
    }

    const data = await response.json()
    const part = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType?: string; data?: string } }) => p.inlineData?.mimeType?.startsWith('audio/'),
    )
    if (!part?.inlineData?.data) {
      throw new Error('No audio data returned from Gemini TTS')
    }

    const mimeType: string = part.inlineData.mimeType ?? ''
    const bytes = base64ToBytes(part.inlineData.data)

    // Gemini returns raw little-endian PCM — wrap it in WAV (pure, SW-safe) and
    // compute the exact duration from the sample count.
    if (isPcm(mimeType)) {
      const rate = parsePcmRate(mimeType)
      return { data: pcmToWav(bytes, rate), mimeType: 'audio/wav', durationSec: pcmDurationSec(bytes.length, rate) }
    }

    const copy = bytes.slice().buffer
    return { data: copy, mimeType: mimeType || 'audio/mpeg', durationSec: estimateSpeechDurationSec(text) }
  },
}
