// AI Manager for Quest (TypeScript)
import type { Summary, AudioFile, Settings, AuditLog, SummaryProvider } from '@/types'
import { AIProvider, SummaryType } from '@/types'
import { storage, generateSmartPrompt } from './storage'
import { secureApiKeys } from './secure-api-keys'
import { ELEVENLABS_VOICES, GEMINI_VOICES } from './voice-config'
import { calculateCost, ELEVENLABS_MODELS, GEMINI_MODELS, GEMINI_TTS_MODELS, OPENAI_MODELS } from './model-config'

export class AIManager {
  private settings: Settings | null = null

  async init(): Promise<void> {
    const result = await chrome.storage.sync.get(['settings'])
    this.settings = result.settings || this.getDefaultSettings()
  }

  private getDefaultSettings(): Settings {
    return {
      theme: 'light',
      autoArchive: false,
      archiveDays: 30,
      reminderEnabled: false,
      reminderTime: '09:00',
      defaultCategory: 'Uncategorized',
      autoSummary: false,
      autoPodcast: false,
      
      // Summary settings
      summaryProvider: AIProvider.GEMINI,
      openaiModel: OPENAI_MODELS[5].id.toString(), // GPT-4.1
      geminiModel: GEMINI_MODELS[1].id.toString(), // Gemini 2.5 Flash
      
      // TTS settings
      ttsProvider: AIProvider.GEMINI,
      elevenlabsModel: ELEVENLABS_MODELS[2].id.toString(), // Eleven Multilingual v2
      elevenlabsVoiceId: ELEVENLABS_VOICES[0].id.toString(),
      geminiTtsModel: GEMINI_TTS_MODELS[0].id.toString(),
      geminiTtsVoice: GEMINI_VOICES[0].id.toString(),
    }
  }

  async generateSummary(
    articleId: string,
    type: SummaryType = SummaryType.CONCISE,
    provider?: SummaryProvider
  ): Promise<Summary> {
    await this.init()

    if (!this.settings) {
      throw new Error('Settings not initialized')
    }

    // Use configured provider or fallback to parameter
    const selectedProvider = provider || this.settings.summaryProvider || AIProvider.GEMINI

    // Get article
    const article = await storage.getArticle(articleId)
    if (!article) {
      throw new Error('Article not found')
    }

    // Ensure content is a string and has sufficient length
    const contentText = typeof article.content === 'string' ? article.content : String(article.content || '')
    
    if (!contentText || contentText.trim().length < 50) {
      throw new Error(
        `Article content is too short or empty (${contentText.trim().length} characters). ` +
        'Please save the article again from the original URL to extract content.'
      )
    }

    // Get API key from secure storage
    const apiKey = await secureApiKeys.getApiKey(selectedProvider)
    if (!apiKey) {
      const providerName = selectedProvider === AIProvider.OPENAI ? 'OpenAI' : 'Gemini'
      await this.logAudit({
        action: 'generate_summary',
        provider: selectedProvider,
        articleId,
        success: false,
        error: `No API key configured for ${selectedProvider}`,
      })
      throw new Error(
        `${providerName} API key not configured!\n\n` +
        `Please go to Settings → AI Configuration to add your ${providerName} API key.\n` +
        `Click the gear icon in the top right corner to access settings.`
      )
    }

    try {
      // Build the prompt with article content using smart prompt generation
      const prompt = generateSmartPrompt(type, contentText)
      
      let content: string
      let tokenCount: number = 0
      let inputTokens: number = 0
      let outputTokens: number = 0
      let totalTokens: number = 0
      let estimatedCost: number = 0

      if (selectedProvider === AIProvider.OPENAI) {
        const model = this.settings.openaiModel || OPENAI_MODELS[5].id.toString()
        const result = await this.callOpenAI(apiKey, model, prompt)
        content = result.content
        tokenCount = result.tokenCount
        inputTokens = result.inputTokens
        outputTokens = result.outputTokens
        totalTokens = result.totalTokens
        estimatedCost = result.estimatedCost
      } else {
        const model = this.settings.geminiModel || GEMINI_MODELS[1].id.toString()
        const result = await this.callGemini(apiKey, model, prompt)
        content = result.content
        tokenCount = result.tokenCount
        inputTokens = result.inputTokens
        outputTokens = result.outputTokens
        totalTokens = result.totalTokens
        estimatedCost = result.estimatedCost
      }

      // Save summary with detailed stats
      const summary = await storage.saveSummary({
        articleId,
        content,
        type,
        aiProvider: selectedProvider,
        model: selectedProvider === AIProvider.OPENAI ? this.settings.openaiModel : this.settings.geminiModel,
        tokenCount,
        inputTokens,
        outputTokens,
        totalTokens,
        estimatedCost,
      })

      // Log audit with detailed stats
      await this.logAudit({
        action: 'generate_summary',
        provider: selectedProvider,
        model: selectedProvider === AIProvider.OPENAI ? this.settings.openaiModel : this.settings.geminiModel,
        articleId,
        details: { 
          type, 
          tokenCount,
          inputTokens,
          outputTokens,
          totalTokens,
          estimatedCost,
        },
        success: true,
      })

      return summary
    } catch (error) {
      await this.logAudit({
        action: 'generate_summary',
        provider: selectedProvider,
        model: selectedProvider === AIProvider.OPENAI ? this.settings.openaiModel : this.settings.geminiModel,
        articleId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  private async callOpenAI(
    apiKey: string,
    model: string,
    prompt: string
  ): Promise<{ content: string; tokenCount: number; inputTokens: number; outputTokens: number; totalTokens: number; estimatedCost: number }> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates article summaries.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 2000,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'OpenAI API error')
    }

    const data = await response.json()
    const usage = data.usage || {}
    
    // Calculate cost based on model using the model config
    const inputTokens = usage.prompt_tokens || 0
    const outputTokens = usage.completion_tokens || 0
    const totalTokens = usage.total_tokens || 0
    
    // Use the centralized cost calculation
    const estimatedCost = calculateCost(AIProvider.OPENAI, model, inputTokens, outputTokens)
    
    return {
      content: data.choices[0].message.content,
      tokenCount: totalTokens,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
    }
  }

  private async callGemini(
    apiKey: string,
    model: string,
    prompt: string
  ): Promise<{ content: string; tokenCount: number; inputTokens: number; outputTokens: number; totalTokens: number; estimatedCost: number }> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Gemini API error')
    }

    const data = await response.json()
    const content = data.candidates[0].content.parts[0].text

    // Gemini provides token counts in usageMetadata
    const metadata = data.usageMetadata || {}
    const inputTokens = metadata.promptTokenCount || Math.ceil(prompt.length / 4)
    const outputTokens = metadata.candidatesTokenCount || Math.ceil(content.length / 4)
    const totalTokens = metadata.totalTokenCount || (inputTokens + outputTokens)
    
    // Use the centralized cost calculation
    const estimatedCost = calculateCost(AIProvider.GEMINI, model, inputTokens, outputTokens)

    return { 
      content, 
      tokenCount: totalTokens,
      inputTokens,
      outputTokens,
      totalTokens,
      estimatedCost,
    }
  }

  async generatePodcast(articleId: string, summaryId?: string): Promise<AudioFile> {
    await this.init()

    if (!this.settings) {
      throw new Error('Settings not initialized')
    }

    // Use configured TTS provider (defaulting to Gemini)
    const ttsProvider = this.settings.ttsProvider || AIProvider.GEMINI

    // Get API key from secure storage
    const apiKey = await secureApiKeys.getApiKey(ttsProvider)

    if (!apiKey) {
      const providerName = ttsProvider === AIProvider.ELEVENLABS ? 'ElevenLabs' : 'Gemini'
      await this.logAudit({
        action: 'generate_podcast',
        provider: ttsProvider,
        articleId,
        success: false,
        error: `No API key configured for ${ttsProvider}`,
      })
      throw new Error(
        `${providerName} API key not configured!\n\n` +
        `Please go to Settings → AI Configuration to add your ${providerName} API key.\n` +
        `Click the gear icon in the top right corner to access settings.`
      )
    }

    try {
      // Get or generate extended summary
      let summary: Summary | null = null

      if (summaryId) {
        const summaries = await storage.getSummariesForArticle(articleId)
        summary = summaries.find((s) => s.id === summaryId) || null
      } else {
        // Generate extended summary first
        summary = await this.generateSummary(articleId, SummaryType.EXTENDED)
      }

      if (!summary) {
        throw new Error('Summary not found or could not be generated')
      }

      // Generate audio
      let audioBlob: Blob
      let voiceId: string
      let characterCount = summary.content.length
      let estimatedCost = 0

      if (ttsProvider === AIProvider.ELEVENLABS) {
        voiceId = this.settings.elevenlabsVoiceId || ELEVENLABS_VOICES[0].id.toString()
        audioBlob = await this.callElevenLabs(apiKey, voiceId, summary.content)
        // ElevenLabs: Free tier 10K chars, then varies by plan
        // Assume $0.30 per 1K characters for Creator plan
        estimatedCost = (characterCount / 1000) * 0.30
      } else {
        voiceId = this.settings.geminiTtsVoice || GEMINI_VOICES[0].id.toString()
        const model = this.settings.geminiTtsModel || GEMINI_TTS_MODELS[0].id.toString()
        audioBlob = await this.callGeminiTTS(apiKey, model, voiceId, summary.content)
        // Gemini TTS pricing (gemini-2.5-flash-preview-tts / gemini-2.5-pro-preview-tts)
        // First 100 requests/day free, then $0.06 per 1K characters
        estimatedCost = (characterCount / 1000) * 0.06
      }

      // Get actual audio duration from the audio blob
      let duration = 0
      try {
        duration = await this.getAudioDuration(audioBlob)
      } catch (err) {
        // Fallback to estimate if we can't decode
        duration = Math.ceil(characterCount / 150 * 60) // ~150 chars per minute
      }

      // Save audio file with stats
      const audioFile = await storage.saveAudioFile({
        summaryId: summary.id,
        audioBlob,
        duration,
        provider: ttsProvider,
        voiceId,
        characterCount,
        estimatedCost,
      })

      // Update article to reference the audio (use summary ID as audioId)
      const article = await storage.getArticle(articleId)
      if (article) {
        await storage.updateArticle(articleId, {
          audioId: summary.id
        })
      }

      // Log audit with detailed stats
      await this.logAudit({
        action: 'generate_podcast',
        provider: ttsProvider,
        model: voiceId,
        articleId,
        details: { 
          summaryId: summary.id, 
          duration,
          characterCount,
          estimatedCost,
        },
        success: true,
      })

      return audioFile
    } catch (error) {
      await this.logAudit({
        action: 'generate_podcast',
        provider: ttsProvider,
        articleId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      throw error
    }
  }

  private async callElevenLabs(apiKey: string, voiceId: string, text: string): Promise<Blob> {
    // Get the selected model from settings (with fallback to recommended default)
    const modelId = this.settings?.elevenlabsModel || ELEVENLABS_MODELS[2].id.toString()
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        Accept: 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(error || 'ElevenLabs API error')
    }

    return response.blob()
  }

  private async callGeminiTTS(apiKey: string, model: string, voiceName: string, text: string): Promise<Blob> {
    const speaker = voiceName || GEMINI_VOICES[0].id.toString() // Default: Achernar
    
    // Create a natural prompt for TTS
    const prompt = `Say the following in a natural, conversational way suitable for a podcast or audiobook:`
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `${prompt}\n\n${text}`,
                },
              ],
            },
          ],
          generationConfig: {
            response_modalities: ['AUDIO'],
            speech_config: {
              voice_config: {
                prebuilt_voice_config: {
                  voice_name: speaker,
                },
              },
            },
          },
        }),
      }
    )

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Gemini TTS API error')
    }
    
    // Read as text to get the JSON string
    const responseText = await response.text()
    
    let data: any
    try {
      data = JSON.parse(responseText)
    } catch (error) {
      throw new Error('Invalid JSON response from Gemini TTS')
    }
    
    // Gemini TTS returns audio in the response as inline data
    const audioPart = data.candidates?.[0]?.content?.parts?.find(
      (part: any) => part.inlineData?.mimeType?.startsWith('audio/')
    )
    
    if (!audioPart || !audioPart.inlineData?.data) {
      throw new Error('No audio data returned from Gemini TTS')
    }
    
    // Audio content is base64 encoded
    const audioContent = audioPart.inlineData.data

    return new Promise<Blob>((resolve, reject) => {
      // Create worker from public folder
      const worker = new Worker('/audio-processor.worker.js')
      
      worker.onmessage = (event) => {
        const { type, data: workerData, error } = event.data
        
        if (type === 'DECODE_SUCCESS') {
          // Use the MIME type returned from the worker (could be audio/wav if converted from PCM)
          const blob = new Blob([workerData.arrayBuffer], { type: workerData.mimeType || 'audio/mpeg' })
          worker.terminate()
          resolve(blob)
        } else if (type === 'DECODE_ERROR') {
          worker.terminate()
          reject(new Error(`Worker failed: ${error}`))
        }
      }
      
      worker.onerror = (error) => {
        console.error('Worker error:', error)
        worker.terminate()
        reject(new Error('Web Worker failed to process audio'))
      }
      
      // Send base64 data AND MIME type to worker
      worker.postMessage({
        type: 'DECODE_BASE64_AUDIO',
        data: { 
          base64: audioContent,
          mimeType: audioPart.inlineData.mimeType
        }
      })
    })
  }

  async testApiKey(provider: AIProvider, apiKey: string, voiceId?: string): Promise<boolean> {
    try {
      if (provider === AIProvider.OPENAI) {
        await this.callOpenAI(apiKey, OPENAI_MODELS[0].id.toString(), 'Test connection')
      } else if (provider === AIProvider.GEMINI) {
        await this.callGemini(apiKey, GEMINI_MODELS[0].id.toString(), 'Test connection')
      } else if (provider === AIProvider.ELEVENLABS) {
        await this.callElevenLabs(apiKey, voiceId || ELEVENLABS_VOICES[0].id.toString(), 'Test connection')
      }
      return true
    } catch {
      return false
    }
  }

  /**
   * Get the actual duration of an audio blob by decoding it
   */
  private async getAudioDuration(blob: Blob): Promise<number> {
    return new Promise((resolve, reject) => {
      const audio = new Audio()
      const url = URL.createObjectURL(blob)
      
      audio.addEventListener('loadedmetadata', () => {
        URL.revokeObjectURL(url)
        if (audio.duration && isFinite(audio.duration)) {
          resolve(audio.duration)
        } else {
          reject(new Error('Invalid duration'))
        }
      })
      
      audio.addEventListener('error', () => {
        URL.revokeObjectURL(url)
        reject(new Error('Failed to load audio'))
      })
      
      audio.src = url
    })
  }

  private async logAudit(logData: Partial<AuditLog>): Promise<void> {
    try {
      await storage.logAudit(logData)
    } catch (error) {
      console.error('Failed to log audit:', error)
    }
  }
}

// Export singleton instance
export const aiManager = new AIManager()
