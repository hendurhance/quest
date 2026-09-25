export interface VoiceOption {
  id: string
  name: string
  gender: 'male' | 'female'
  description?: string
  accent?: string
  age?: string
  useCase?: string
}

/**
 * Google (Gemini) TTS Voice Options
 * All available voices from Gemini TTS service
 */
export const GEMINI_VOICES: VoiceOption[] = [
  { id: 'Achernar', name: 'Achernar', gender: 'female' },
  { id: 'Achird', name: 'Achird', gender: 'male' },
  { id: 'Algenib', name: 'Algenib', gender: 'male' },
  { id: 'Algieba', name: 'Algieba', gender: 'male' },
  { id: 'Alnilam', name: 'Alnilam', gender: 'male' },
  { id: 'Aoede', name: 'Aoede', gender: 'female' },
  { id: 'Autonoe', name: 'Autonoe', gender: 'female' },
  { id: 'Callirrhoe', name: 'Callirrhoe', gender: 'female' },
  { id: 'Charon', name: 'Charon', gender: 'male' },
  { id: 'Despina', name: 'Despina', gender: 'female' },
  { id: 'Enceladus', name: 'Enceladus', gender: 'male' },
  { id: 'Erinome', name: 'Erinome', gender: 'female' },
  { id: 'Fenrir', name: 'Fenrir', gender: 'male' },
  { id: 'Gacrux', name: 'Gacrux', gender: 'female' },
  { id: 'Iapetus', name: 'Iapetus', gender: 'male' },
  { id: 'Kore', name: 'Kore', gender: 'female' },
  { id: 'Laomedeia', name: 'Laomedeia', gender: 'female' },
  { id: 'Leda', name: 'Leda', gender: 'female' },
  { id: 'Orus', name: 'Orus', gender: 'male' },
  { id: 'Pulcherrima', name: 'Pulcherrima', gender: 'female' },
  { id: 'Puck', name: 'Puck', gender: 'male' },
  { id: 'Rasalgethi', name: 'Rasalgethi', gender: 'male' },
  { id: 'Sadachbia', name: 'Sadachbia', gender: 'male' },
  { id: 'Sadaltager', name: 'Sadaltager', gender: 'male' },
  { id: 'Schedar', name: 'Schedar', gender: 'male' },
  { id: 'Sulafat', name: 'Sulafat', gender: 'female' },
  { id: 'Umbriel', name: 'Umbriel', gender: 'male' },
  { id: 'Vindemiatrix', name: 'Vindemiatrix', gender: 'female' },
  { id: 'Zephyr', name: 'Zephyr', gender: 'female' },
  { id: 'Zubenelgenubi', name: 'Zubenelgenubi', gender: 'male' }
]

/**
 * Get formatted voice label for display
 */
export function getVoiceLabel(voice: VoiceOption): string {
  const genderIcon = voice.gender === 'female' ? '♀' : '♂'
  const parts = [voice.name, genderIcon]
  
  if (voice.description) {
    parts.push(`- ${voice.description}`)
  } else if (voice.accent) {
    parts.push(`(${voice.accent})`)
  }
  
  return parts.join(' ')
}
