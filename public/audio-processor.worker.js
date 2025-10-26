// Web Worker for processing large audio base64 data

// Function to convert PCM audio to WAV format
function pcmToWav(pcmData, sampleRate, numChannels, bitDepth) {
  const byteRate = sampleRate * numChannels * (bitDepth / 8)
  const blockAlign = numChannels * (bitDepth / 8)
  const dataSize = pcmData.length
  const wavHeader = new ArrayBuffer(44)
  const view = new DataView(wavHeader)
  
  // "RIFF" chunk descriptor
  view.setUint32(0, 0x52494646, false) // "RIFF"
  view.setUint32(4, 36 + dataSize, true) // File size - 8
  view.setUint32(8, 0x57415645, false) // "WAVE"
  
  // "fmt " sub-chunk
  view.setUint32(12, 0x666d7420, false) // "fmt "
  view.setUint32(16, 16, true) // Subchunk size (16 for PCM)
  view.setUint16(20, 1, true) // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true) // Number of channels
  view.setUint32(24, sampleRate, true) // Sample rate
  view.setUint32(28, byteRate, true) // Byte rate
  view.setUint16(32, blockAlign, true) // Block align
  view.setUint16(34, bitDepth, true) // Bits per sample
  
  // "data" sub-chunk
  view.setUint32(36, 0x64617461, false) // "data"
  view.setUint32(40, dataSize, true) // Data size
  
  // Combine header and PCM data
  const wavFile = new Uint8Array(44 + dataSize)
  wavFile.set(new Uint8Array(wavHeader), 0)
  wavFile.set(pcmData, 44)
  
  return wavFile
}

self.addEventListener('message', async (event) => {
  const { type, data } = event.data

  try {
    if (type === 'DECODE_BASE64_AUDIO') {      
      // Decode base64
      const binaryString = atob(data.base64)
      const bytes = new Uint8Array(binaryString.length)
      
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i)
      }
        Array.from(bytes.slice(0, 20))
          .map(b => b.toString(16).padStart(2, '0'))
          .join(' ')
      )
      
      let finalBytes = bytes
      let mimeType = 'audio/mpeg'
      
      // Check if this is PCM audio that needs WAV conversion
      if (data.mimeType && data.mimeType.includes('audio/L16')) {
        // Extract sample rate from MIME type (e.g., "audio/L16;codec=pcm;rate=24000")
        const rateMatch = data.mimeType.match(/rate=(\d+)/)
        const sampleRate = rateMatch ? parseInt(rateMatch[1]) : 24000
        
        // Convert PCM to WAV (16-bit, 1 channel - Gemini returns mono)
        finalBytes = pcmToWav(bytes, sampleRate, 1, 16)
        mimeType = 'audio/wav'
      } else {
        // Check for MP3 format
        const hasID3 = bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33
        const hasMp3Sync = bytes[0] === 0xFF && (bytes[1] & 0xE0) === 0xE0

        if (!hasID3 && !hasMp3Sync) {
          console.warn('Worker: Data does not appear to be valid MP3')
        }
      }
      
      // Create blob
      const blob = new Blob([finalBytes], { type: mimeType })
      
      // Convert to ArrayBuffer to send back
      const arrayBuffer = await blob.arrayBuffer()
      
      // Send back the result
      self.postMessage({
        type: 'DECODE_SUCCESS',
        data: {
          arrayBuffer: arrayBuffer,
          size: arrayBuffer.byteLength,
          mimeType: mimeType
        }
      }, [arrayBuffer]) // Transfer ownership for efficiency
      
    }
  } catch (error) {
    self.postMessage({
      type: 'DECODE_ERROR',
      error: error.message
    })
  }
})
