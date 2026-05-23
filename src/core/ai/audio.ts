export function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

export function isPcm(mimeType: string): boolean {
  return /audio\/l16|pcm/i.test(mimeType)
}

export function parsePcmRate(mimeType: string): number {
  const match = mimeType.match(/rate=(\d+)/)
  return match ? parseInt(match[1], 10) : 24000
}

export function pcmToWav(pcm: Uint8Array, sampleRate: number, channels = 1, bitDepth = 16): ArrayBuffer {
  const blockAlign = channels * (bitDepth / 8)
  const byteRate = sampleRate * blockAlign
  const dataSize = pcm.length
  const buffer = new ArrayBuffer(44 + dataSize)
  const view = new DataView(buffer)
  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeStr(0, 'RIFF')
  view.setUint32(4, 36 + dataSize, true)
  writeStr(8, 'WAVE')
  writeStr(12, 'fmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, channels, true)
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, byteRate, true)
  view.setUint16(32, blockAlign, true)
  view.setUint16(34, bitDepth, true)
  writeStr(36, 'data')
  view.setUint32(40, dataSize, true)
  new Uint8Array(buffer, 44).set(pcm)

  return buffer
}

export function pcmDurationSec(byteLength: number, sampleRate: number, channels = 1, bitDepth = 16): number {
  const bytesPerSample = (bitDepth / 8) * channels
  return byteLength / bytesPerSample / sampleRate
}

export function estimateSpeechDurationSec(text: string): number {
  return Math.ceil((text.length / 150) * 60)
}
