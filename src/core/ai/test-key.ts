import { AIProvider } from '@/types'

export async function testApiKey(provider: AIProvider, apiKey: string): Promise<boolean> {
  try {
    if (provider === AIProvider.OPENAI) {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${apiKey}` },
      })
      return res.ok
    }
    if (provider === AIProvider.GEMINI) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      )
      return res.ok
    }
    // ElevenLabs
    const res = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
    })
    return res.ok
  } catch {
    return false
  }
}
