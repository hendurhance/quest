<template>
  <Modal :show="show" title="Settings" size="large" @close="handleClose">
    <div class="settings-container">
      <!-- General Settings -->
      <section class="settings-section">
        <h3 class="section-title">General</h3>
        
        <div class="form-group">
          <label for="theme">Theme</label>
          <select id="theme" v-model="formData.theme" class="form-control">
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </div>

        <div class="form-group">
          <label for="defaultCategory">Default Category</label>
          <select id="defaultCategory" v-model="formData.defaultCategory" class="form-control">
            <option value="Uncategorized">Uncategorized</option>
            <option value="Articles">Articles</option>
            <option value="Development">Development</option>
            <option value="Research">Research</option>
            <option value="Videos">Videos</option>
            <option value="News">News</option>
          </select>
        </div>
      </section>

      <!-- Auto-Archive Settings -->
      <section class="settings-section">
        <h3 class="section-title">Auto-Archive</h3>
        
        <div class="form-group">
          <div class="checkbox-group">
            <input 
              id="autoArchive" 
              v-model="formData.autoArchive" 
              type="checkbox"
              class="checkbox"
            >
            <label for="autoArchive">Automatically archive read articles</label>
          </div>
        </div>

        <div v-if="formData.autoArchive" class="form-group">
          <label for="archiveDays">Archive after (days)</label>
          <input 
            id="archiveDays" 
            v-model.number="formData.archiveDays" 
            type="number"
            min="1"
            max="365"
            class="form-control"
          >
          <small class="form-hint">Articles will be archived {{ formData.archiveDays }} days after being marked as read</small>
        </div>
      </section>

      <!-- Reminder Settings -->
      <section class="settings-section">
        <h3 class="section-title">Reminders</h3>
        
        <div class="form-group">
          <div class="checkbox-group">
            <input 
              id="reminderEnabled" 
              v-model="formData.reminderEnabled" 
              type="checkbox"
              class="checkbox"
            >
            <label for="reminderEnabled">Enable reading reminders</label>
          </div>
        </div>

        <div v-if="formData.reminderEnabled" class="form-group">
          <label for="reminderTime">Reminder time</label>
          <input 
            id="reminderTime" 
            v-model="formData.reminderTime" 
            type="time"
            class="form-control"
          >
        </div>
      </section>

      <!-- AI Features -->
      <section class="settings-section">
        <h3 class="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            <polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline>
            <line x1="12" y1="22.08" x2="12" y2="12"></line>
          </svg>
          AI Features
        </h3>
        
        <div class="form-group">
          <div class="checkbox-group">
            <input 
              id="autoSummary" 
              v-model="formData.autoSummary" 
              type="checkbox"
              class="checkbox"
            >
            <label for="autoSummary">Automatically generate summaries for saved articles</label>
          </div>
        </div>

        <div class="form-group">
          <div class="checkbox-group">
            <input 
              id="autoPodcast" 
              v-model="formData.autoPodcast" 
              type="checkbox"
              class="checkbox"
            >
            <label for="autoPodcast">Automatically generate podcasts for saved articles</label>
          </div>
        </div>
      </section>

      <!-- Summary Model Configuration -->
      <section class="settings-section">
        <h3 class="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="display: inline-block; vertical-align: middle; margin-right: 8px;">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          AI Summary Configuration
        </h3>
        <p class="section-description">Choose which AI model to use for generating article summaries</p>
        
        <!-- Provider Selection -->
        <div class="form-group">
          <label>Summary Provider</label>
          <div class="provider-selector">
            <button 
              type="button"
              @click="formData.summaryProvider = AIProvider.OPENAI"
              :class="['provider-card', { active: formData.summaryProvider === AIProvider.OPENAI }]"
            >
              <div class="provider-header">
                <div class="provider-icon openai">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z"/>
                  </svg>
                </div>
                <div class="provider-info">
                  <h4>OpenAI</h4>
                  <span class="badge">Most Popular</span>
                </div>
              </div>
              <p class="provider-desc">GPT-4.1 - Best for nuanced understanding</p>
            </button>
            
            <button 
              type="button"
              @click="formData.summaryProvider = AIProvider.GEMINI"
              :class="['provider-card', { active: formData.summaryProvider === AIProvider.GEMINI }]"
            >
              <div class="provider-header">
                <div class="provider-icon gemini">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"/>
                  </svg>
                </div>
                <div class="provider-info">
                  <h4>Google Gemini</h4>
                  <span class="badge recommended">Recommended</span>
                </div>
              </div>
              <p class="provider-desc">Gemini 2.5 Flash - Fastest & most cost-efficient</p>
            </button>
          </div>
        </div>

        <!-- OpenAI Configuration (only shown if selected) -->
        <div v-if="formData.summaryProvider === AIProvider.OPENAI" class="provider-config">
          <div class="form-group">
            <label for="openaiModel">Model</label>
            <select id="openaiModel" v-model="formData.openaiModel" class="form-control">
              <option 
                v-for="model in OPENAI_MODELS" 
                :key="model.id" 
                :value="model.id"
              >
                {{ model.name }}{{ model.recommended ? ' (Recommended)' : '' }} - {{ model.description }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="openaiApiKey">OpenAI API Key</label>
            <div class="input-group">
              <input 
                id="openaiApiKey" 
                v-model="openaiApiKey" 
                :type="showOpenAIKey ? 'text' : 'password'"
                placeholder="sk-proj-..."
                class="form-control"
              >
              <button 
                type="button" 
                @click="showOpenAIKey = !showOpenAIKey"
                class="input-addon-btn"
              >
                <svg v-if="showOpenAIKey" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 12 7 5 12 5s10 7 10 7-5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 12 7 5 12 5s10 7 10 7-5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <small class="form-hint">
              Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">platform.openai.com/api-keys</a>
            </small>
          </div>

          <Button 
            v-if="openaiApiKey" 
            variant="secondary" 
            size="small"
            :loading="testingOpenAI"
            @click="testOpenAIKey"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
              <path d="M9 11l3 3L22 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Test Connection
          </Button>
        </div>

        <!-- Gemini Configuration (only shown if selected) -->
        <div v-if="formData.summaryProvider === AIProvider.GEMINI" class="provider-config">
          <div class="form-group">
            <label for="geminiModel">Model</label>
            <select id="geminiModel" v-model="formData.geminiModel" class="form-control">
              <option 
                v-for="model in GEMINI_MODELS" 
                :key="model.id" 
                :value="model.id"
              >
                {{ model.name }}{{ model.recommended ? ' (Recommended)' : '' }} - {{ model.description }}
              </option>
            </select>
            <small class="form-hint">
              <strong>Gemini 2.5 Flash</strong> is the latest model with best speed and quality
            </small>
          </div>

          <div class="form-group">
            <label for="geminiApiKey">Google AI API Key</label>
            <div class="input-group">
              <input 
                id="geminiApiKey" 
                v-model="geminiApiKey" 
                :type="showGeminiKey ? 'text' : 'password'"
                placeholder="AIza..."
                class="form-control"
              >
              <button 
                type="button" 
                @click="showGeminiKey = !showGeminiKey"
                class="input-addon-btn"
              >
                <svg v-if="showGeminiKey" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 12 7 5 12 5s10 7 10 7-5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 12 7 5 12 5s10 7 10 7-5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <small class="form-hint">
              Get your free API key from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a> (Free tier available!)
            </small>
          </div>

          <Button 
            v-if="geminiApiKey" 
            variant="secondary" 
            size="small"
            :loading="testingGemini"
            @click="testGeminiKey"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
              <path d="M9 11l3 3L22 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Test Connection
          </Button>
        </div>
      </section>

      <!-- Podcast/TTS Configuration -->
      <section class="settings-section">
        <h3 class="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke-width="2"/>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" stroke-width="2" stroke-linecap="round"/>
          </svg>
          Podcast/Text-to-Speech Configuration
        </h3>
        <p class="section-description">Choose which TTS service to use for generating podcasts</p>
        
        <!-- TTS Provider Selection -->
        <div class="form-group">
          <label>Podcast Provider</label>
          <div class="provider-selector">
            <button 
              type="button"
              @click="formData.ttsProvider = AIProvider.ELEVENLABS"
              :class="['provider-card', { active: formData.ttsProvider === AIProvider.ELEVENLABS }]"
            >
              <div class="provider-header">
                <div class="provider-icon elevenlabs">
                  <svg fill="#ffffff" fill-rule="evenodd" height="1em" style="flex:none;line-height:1" viewBox="0 0 24 24" width="1em" xmlns="http://www.w3.org/2000/svg"><title>ElevenLabs</title><path d="M5 0h5v24H5V0zM14 0h5v24h-5V0z"></path></svg>
                </div>
                <div class="provider-info">
                  <h4>ElevenLabs</h4>
                  <span class="badge">Best Quality</span>
                </div>
              </div>
              <p class="provider-desc">Most realistic AI voices - Natural intonation</p>
            </button>
            
            <button 
              type="button"
              @click="formData.ttsProvider = AIProvider.GEMINI"
              :class="['provider-card', { active: formData.ttsProvider === AIProvider.GEMINI }]"
            >
              <div class="provider-header">
                <div class="provider-icon gemini">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
                    <path d="M20.616 10.835a14.147 14.147 0 01-4.45-3.001 14.111 14.111 0 01-3.678-6.452.503.503 0 00-.975 0 14.134 14.134 0 01-3.679 6.452 14.155 14.155 0 01-4.45 3.001c-.65.28-1.318.505-2.002.678a.502.502 0 000 .975c.684.172 1.35.397 2.002.677a14.147 14.147 0 014.45 3.001 14.112 14.112 0 013.679 6.453.502.502 0 00.975 0c.172-.685.397-1.351.677-2.003a14.145 14.145 0 013.001-4.45 14.113 14.113 0 016.453-3.678.503.503 0 000-.975 13.245 13.245 0 01-2.003-.678z"/>
                  </svg>
                </div>
                <div class="provider-info">
                  <h4>Gemini TTS</h4>
                  <span class="badge recommended">Recommended</span>
                </div>
              </div>
              <p class="provider-desc">Reliable quality - Most affordable at scale</p>
            </button>
          </div>
        </div>

        <!-- ElevenLabs Configuration -->
        <div v-if="formData.ttsProvider === AIProvider.ELEVENLABS" class="provider-config">
          <div class="form-group">
            <label for="elevenlabsApiKey">ElevenLabs API Key</label>
            <div class="input-group">
              <input 
                id="elevenlabsApiKey" 
                v-model="elevenlabsApiKey" 
                :type="showElevenLabsKey ? 'text' : 'password'"
                placeholder="sk_..."
                class="form-control"
              >
              <button 
                type="button" 
                @click="showElevenLabsKey = !showElevenLabsKey"
                class="input-addon-btn"
              >
                <svg v-if="showElevenLabsKey" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 12 7 5 12 5s10 7 10 7-5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 12 7 5 12 5s10 7 10 7-5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <small class="form-hint">
              Get your API key from <a href="https://elevenlabs.io/app/settings/api-keys" target="_blank">elevenlabs.io</a> (10,000 free characters/month)
            </small>
          </div>

          <div class="form-group">
            <label for="elevenlabsModel">Model</label>
            <select id="elevenlabsModel" v-model="formData.elevenlabsModel" class="form-control">
              <option 
                v-for="model in ELEVENLABS_MODELS" 
                :key="model.id" 
                :value="model.id"
              >
                {{ model.name }}{{ model.recommended ? ' (Recommended)' : '' }} - {{ model.description }}
              </option>
            </select>
            <small class="form-hint">
              <strong>Multilingual v2</strong> is recommended for most use cases with 29 languages and natural output.
            </small>
          </div>

          <div class="form-group">
            <label for="elevenlabsVoiceId">Voice</label>
            <select id="elevenlabsVoiceId" v-model="formData.elevenlabsVoiceId" class="form-control">
              <option 
                v-for="voice in ELEVENLABS_VOICES" 
                :key="voice.id" 
                :value="voice.id"
              >
                {{ voice.name }} ({{ voice.gender === 'female' ? 'Female' : 'Male' }}{{ voice.description ? ', ' + voice.description : '' }}){{ voice.id === ELEVENLABS_VOICES[0].id.toString() ? ' (Recommended)' : '' }}
              </option>
            </select>
            <small class="form-hint">
              Preview voices at <a href="https://elevenlabs.io/voice-library" target="_blank">Voice Library</a>
            </small>
          </div>

          <Button 
            v-if="elevenlabsApiKey" 
            variant="secondary" 
            size="small"
            :loading="testingElevenLabs"
            @click="testElevenLabsKey"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
              <path d="M9 11l3 3L22 4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke-width="2" stroke-linecap="round"/>
            </svg>
            Test Connection
          </Button>
        </div>

        <!-- Gemini TTS Configuration -->
        <div v-if="formData.ttsProvider === AIProvider.GEMINI" class="provider-config">
          <div class="info-box">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
              <path d="M12 16v-4M12 8h.01" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            </svg>
            <div>
              <strong>Gemini TTS uses the same API key as Gemini</strong>
              <p>If you selected Gemini for summaries above, your API key is already configured!</p>
            </div>
          </div>

            <div class="form-group">
              <label for="geminiTtsModel">TTS Model</label>
              <select id="geminiTtsModel" v-model="formData.geminiTtsModel" class="form-control">
                <option value="gemini-2.5-flash-preview-tts">Gemini 2.5 Flash TTS (Recommended - Low latency, cost-efficient)</option>
                <option value="gemini-2.5-pro-preview-tts">Gemini 2.5 Pro TTS (Best quality, high control)</option>
              </select>
              <small class="form-hint">
                <strong>Flash TTS</strong> is great for everyday use.
                <strong>Pro TTS</strong> offers best quality for podcasts and audiobooks.
              </small>
            </div>          <div class="form-group">
            <label for="geminiTtsVoice">Voice</label>
            <select id="geminiTtsVoice" v-model="formData.geminiTtsVoice" class="form-control">
              <optgroup label="Female Voices">
                <option 
                  v-for="voice in GEMINI_VOICES.filter(v => v.gender === 'female')" 
                  :key="voice.id" 
                  :value="voice.id"
                >
                  {{ voice.name }} (Female){{ voice.id === GEMINI_VOICES[0].id.toString() ? ' (Recommended)' : '' }}
                </option>
              </optgroup>
              <optgroup label="Male Voices">
                <option 
                  v-for="voice in GEMINI_VOICES.filter(v => v.gender === 'male')" 
                  :key="voice.id" 
                  :value="voice.id"
                >
                  {{ voice.name }} (Male)
                </option>
              </optgroup>
            </select>
            <small class="form-hint">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display: inline-block; vertical-align: middle; margin-right: 4px;">
                <circle cx="12" cy="12" r="10" stroke-width="2"/>
                <path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round"/>
              </svg>
              All voices support 20+ languages with natural conversation, style control, and dynamic performance.
            </small>
          </div>

          <div v-if="!geminiApiKey" class="form-group">
            <label for="geminiApiKeyForTts">Google AI API Key</label>
            <div class="input-group">
              <input 
                id="geminiApiKeyForTts" 
                v-model="geminiApiKey" 
                :type="showGeminiKey ? 'text' : 'password'"
                placeholder="AIza..."
                class="form-control"
              >
              <button 
                type="button" 
                @click="showGeminiKey = !showGeminiKey"
                class="input-addon-btn"
              >
                <svg v-if="showGeminiKey" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 12 7 5 12 5s10 7 10 7-5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                  <line x1="4.5" y1="4.5" x2="19.5" y2="19.5" stroke="currentColor" stroke-width="2"/>
                </svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M2 12C2 12 7 5 12 5s10 7 10 7-5 7-10 7S2 12 2 12z" stroke="currentColor" stroke-width="2"/>
                  <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2"/>
                </svg>
              </button>
            </div>
            <small class="form-hint">
              Same API key works for both Gemini and Gemini TTS from <a href="https://aistudio.google.com/app/apikey" target="_blank">Google AI Studio</a>
            </small>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <Button variant="secondary" @click="handleClose">Cancel</Button>
      <Button variant="primary" :loading="saving" @click="handleSave">Save Settings</Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Modal, Button } from '@/components'
import { AIManager } from '@/utils/ai-manager'
import { secureApiKeys } from '@/utils/secure-api-keys'
import { ELEVENLABS_VOICES, GEMINI_VOICES } from '@/utils/voice-config'
import { OPENAI_MODELS, GEMINI_MODELS, GEMINI_TTS_MODELS, ELEVENLABS_MODELS } from '@/utils/model-config'
import { useNotification } from '@/composables/useNotification'
import type { Settings } from '@/types'
import { AIProvider } from '@/types'

interface Props {
  show: boolean
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'update:show', value: boolean): void
}>()

// AI Manager instance
const aiManager = new AIManager()

// Notification composable
const { success, error: showError } = useNotification()

// Form state
const formData = ref<Settings>({
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
  openaiModel: OPENAI_MODELS[2].id.toString(), // GPT-5 (recommended)
  geminiModel: GEMINI_MODELS[1].id.toString(), // Gemini 2.5 Flash (recommended)
  
  // TTS settings
  ttsProvider: AIProvider.GEMINI,
  elevenlabsModel: ELEVENLABS_MODELS[2].id.toString(), // Multilingual v2 (recommended)
  elevenlabsVoiceId: ELEVENLABS_VOICES[0].id.toString(),
  geminiTtsModel: GEMINI_TTS_MODELS[0].id.toString(),
  geminiTtsVoice: GEMINI_VOICES[0].id.toString(),
})

// API Keys (stored separately in secure storage)
const openaiApiKey = ref('')
const geminiApiKey = ref('')
const elevenlabsApiKey = ref('')

// UI state
const showOpenAIKey = ref(false)
const showGeminiKey = ref(false)
const showElevenLabsKey = ref(false)
const saving = ref(false)
const testingOpenAI = ref(false)
const testingGemini = ref(false)
const testingElevenLabs = ref(false)

// Load settings when modal opens
watch(() => props.show, async (newValue) => {
  if (newValue) {
    await loadSettings()
  }
})

const loadSettings = async () => {
  try {
    // Load regular settings
    const result = await chrome.storage.sync.get(['settings'])
    if (result.settings) {
      formData.value = { ...formData.value, ...result.settings }
    }
    
    // Load API keys from secure storage
    openaiApiKey.value = await secureApiKeys.getApiKey(AIProvider.OPENAI) || ''
    geminiApiKey.value = await secureApiKeys.getApiKey(AIProvider.GEMINI) || ''
    elevenlabsApiKey.value = await secureApiKeys.getApiKey(AIProvider.ELEVENLABS) || ''
  } catch (err) {
    showError('Failed to load settings. Please refresh the page and try again.')
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    // Save regular settings
    await chrome.storage.sync.set({ settings: formData.value })
    
    // Save API keys to secure storage
    if (openaiApiKey.value) {
      await secureApiKeys.setApiKey(AIProvider.OPENAI, openaiApiKey.value)
    }
    if (geminiApiKey.value) {
      await secureApiKeys.setApiKey(AIProvider.GEMINI, geminiApiKey.value)
    }
    if (elevenlabsApiKey.value) {
      await secureApiKeys.setApiKey(AIProvider.ELEVENLABS, elevenlabsApiKey.value)
    }
    
    // Notify background script that settings were saved
    // This will trigger auto-archive check if enabled
    chrome.runtime.sendMessage({ action: 'settingsSaved' }).catch(() => {
      // Ignore errors if background script doesn't respond
    })
    
    success('Settings saved successfully!')
    handleClose()
  } catch (err) {
    showError('Failed to save settings. Please try again.')
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  emit('close')
  emit('update:show', false)
}

const testOpenAIKey = async () => {
  if (!openaiApiKey.value) {
    showError('Please enter an API key first')
    return
  }

  testingOpenAI.value = true
  try {
    const isValid = await aiManager.testApiKey(AIProvider.OPENAI, openaiApiKey.value)
    
    if (isValid) {
      success('OpenAI connection successful! Your API key is valid and working.')
    } else {
      showError('OpenAI connection failed. The API key or model appears to be invalid.')
    }
  } catch (err) {
    showError(`Failed to test OpenAI: ${err instanceof Error ? err.message : 'Unknown error'}`)
  } finally {
    testingOpenAI.value = false
  }
}

const testGeminiKey = async () => {
  if (!geminiApiKey.value) {
    showError('Please enter an API key first')
    return
  }

  testingGemini.value = true
  try {
    const isValid = await aiManager.testApiKey(AIProvider.GEMINI, geminiApiKey.value)
    
    if (isValid) {
      success('Gemini connection successful! Your API key is valid and working.')
    } else {
      showError('Gemini connection failed. The API key or model appears to be invalid.')
    }
  } catch (err) {
    showError(`Failed to test Gemini: ${err instanceof Error ? err.message : 'Unknown error'}`)
  } finally {
    testingGemini.value = false
  }
}

const testElevenLabsKey = async () => {
  if (!elevenlabsApiKey.value) {
    showError('Please enter an API key first')
    return
  }

  testingElevenLabs.value = true
  try {
    const isValid = await aiManager.testApiKey(
      AIProvider.ELEVENLABS,
      elevenlabsApiKey.value,
      formData.value.elevenlabsVoiceId
    )
    
    if (isValid) {
      success('ElevenLabs connection successful! Your API key is valid and working.')
    } else {
      showError('ElevenLabs connection failed. The API key or voice ID appears to be invalid.')
    }
  } catch (err) {
    showError(`Failed to test ElevenLabs: ${err instanceof Error ? err.message : 'Unknown error'}`)
  } finally {
    testingElevenLabs.value = false
  }
}
</script>

<style scoped>
.settings-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-section {
  padding-bottom: 2rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.settings-section:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 1rem;
}

.section-description {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin: -0.5rem 0 1.25rem;
  line-height: 1.5;
}

/* Provider Selector */
.provider-selector {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.provider-card {
  position: relative;
  padding: 1.25rem;
  border: 2px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  background: var(--bg-primary, white);
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  width: 100%;
}

.provider-card:hover {
  border-color: var(--primary-color, #4285f4);
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.1);
  transform: translateY(-2px);
}

.provider-card.active {
  border-color: var(--primary-color, #4285f4);
  background: linear-gradient(to bottom, rgba(66, 133, 244, 0.05), transparent);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.provider-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 0.75rem;
}

.provider-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  flex-shrink: 0;
}

.provider-icon.openai {
  background: linear-gradient(135deg, #10a37f 0%, #1a7f64 100%);
}

.provider-icon.gemini {
  background: linear-gradient(135deg, #4285f4 0%, #1a73e8 100%);
}

.provider-icon.elevenlabs {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
}

.provider-icon.google {
  background: linear-gradient(135deg, #ea4335 0%, #fbbc04 50%, #34a853 100%);
}

.provider-info {
  flex: 1;
}

.provider-info h4 {
  margin: 0 0 0.25rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  font-size: 0.6875rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.025em;
  border-radius: 4px;
  background: var(--secondary-bg, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

[data-theme="dark"] .badge {
  background: var(--bg-secondary, #4b5563);
  color: var(--text-secondary, #d1d5db);
}

.badge.recommended {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.provider-desc {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
  line-height: 1.4;
}

/* Provider Config */
.provider-config {
  padding: 1.25rem;
  background: var(--secondary-bg, #f9fafb);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  margin-top: 1rem;
}

.info-box {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  border: 1px solid #93c5fd;
  border-radius: 8px;
  margin-bottom: 1.25rem;
  color: #1e40af;
}

.info-box svg {
  flex-shrink: 0;
  color: #2563eb;
}

.info-box strong {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.875rem;
}

.info-box p {
  margin: 0;
  font-size: 0.8125rem;
  opacity: 0.9;
  line-height: 1.4;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #111827);
  margin-bottom: 0.375rem;
}

.form-control {
  width: 100%;
  padding: 0.625rem 0.75rem;
  font-size: 0.9375rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 6px;
  background-color: var(--bg-primary, white);
  color: var(--text-primary, #111827);
  transition: border-color 0.2s;
}

.form-control:focus {
  outline: none;
  border-color: var(--primary-color, #4285f4);
  box-shadow: 0 0 0 3px rgba(66, 133, 244, 0.1);
}

.checkbox-group {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.checkbox-group label {
  margin: 0;
  cursor: pointer;
  font-weight: 400;
}

.form-hint {
  display: block;
  margin-top: 0.375rem;
  font-size: 0.8125rem;
  color: var(--text-secondary, #6b7280);
}

.form-hint a {
  color: var(--primary-color, #4285f4);
  text-decoration: none;
}

.form-hint a:hover {
  text-decoration: underline;
}

.input-group {
  display: flex;
  align-items: stretch;
}

.input-group .form-control {
  border-top-right-radius: 0;
  border-bottom-right-radius: 0;
}

.input-addon-btn {
  padding: 0.625rem 0.75rem;
  background-color: var(--secondary-bg, #f3f4f6);
  border: 1px solid var(--border-color, #d1d5db);
  border-left: none;
  border-top-right-radius: 6px;
  border-bottom-right-radius: 6px;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  transition: background-color 0.2s;
}

.input-addon-btn:hover {
  background-color: var(--hover-bg, #e5e7eb);
}

/* Dark mode */
[data-theme="dark"] .section-title {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .form-group label {
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .form-control {
  background-color: var(--bg-secondary, #374151);
  border-color: var(--border-color, #4b5563);
  color: var(--text-primary, #f9fafb);
}

[data-theme="dark"] .input-addon-btn {
  background-color: var(--secondary-bg, #4b5563);
  border-color: var(--border-color, #4b5563);
}

[data-theme="dark"] .settings-section {
  border-color: var(--border-color, #374151);
}

[data-theme="dark"] .provider-config {
  background-color: var(--bg-secondary, #374151);
  border-color: var(--border-color, #4b5563);
}

[data-theme="dark"] .info-box {
  background: linear-gradient(135deg, #1e3a5f 0%, #2d3748 100%);
  border-color: #4b5563;
  color: #93c5fd;
}

[data-theme="dark"] .info-box svg {
  color: #60a5fa;
}
</style>
