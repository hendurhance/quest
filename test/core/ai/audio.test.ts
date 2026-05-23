import { describe, it, expect } from 'vitest'
import {
  base64ToBytes,
  isPcm,
  parsePcmRate,
  pcmToWav,
  pcmDurationSec,
  estimateSpeechDurationSec,
} from '@/core/ai/audio'

describe('audio helpers', () => {
  it('decodes base64 to bytes', () => {
    expect(Array.from(base64ToBytes(btoa('abc')))).toEqual([97, 98, 99])
  })

  it('detects PCM mime types and parses the rate', () => {
    expect(isPcm('audio/L16;codec=pcm;rate=24000')).toBe(true)
    expect(isPcm('audio/mpeg')).toBe(false)
    expect(parsePcmRate('audio/L16;rate=16000')).toBe(16000)
    expect(parsePcmRate('audio/L16')).toBe(24000)
  })

  it('wraps PCM in a valid WAV container', () => {
    const pcm = new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7])
    const wav = pcmToWav(pcm, 24000)
    const view = new DataView(wav)
    const tag = (o: number) =>
      String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3))

    expect(tag(0)).toBe('RIFF')
    expect(tag(8)).toBe('WAVE')
    expect(tag(36)).toBe('data')
    expect(view.getUint32(24, true)).toBe(24000) // sample rate
    expect(view.getUint32(40, true)).toBe(8) // data size
    expect(wav.byteLength).toBe(44 + 8)
  })

  it('computes exact PCM duration', () => {
    // 48000 bytes @ 24kHz, 16-bit mono = 1.0s
    expect(pcmDurationSec(48000, 24000)).toBeCloseTo(1)
  })

  it('estimates speech duration from text length', () => {
    expect(estimateSpeechDurationSec('a'.repeat(150))).toBe(60)
  })
})
