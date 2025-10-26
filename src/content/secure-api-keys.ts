/**
 * Secure API Key Storage
 * 
 * Encrypts API keys with AES-256-GCM before storing them.
 * Key derived from extension ID - transparent to users.
 * 
 * Protection:
 * - Encrypted at rest in chrome.storage.local
 * - Not synced to cloud
 * - Protected against XSS and casual inspection
 */

import { AIProvider } from '@/types'

interface EncryptedValue {
  data: string // Base64 encrypted data
  iv: string   // Base64 initialization vector
}

interface SecureApiKeys {
  openaiApiKey?: EncryptedValue
  geminiApiKey?: EncryptedValue
  elevenlabsApiKey?: EncryptedValue
}

class SecureApiKeyStorage {
  private encryptionKey: CryptoKey | null = null

  /**
   * Initialize encryption key (derived from extension ID)
   */
  private async getEncryptionKey(): Promise<CryptoKey> {
    if (this.encryptionKey) {
      return this.encryptionKey
    }

    // Use extension ID as key material (unique per extension)
    const extensionId = chrome.runtime.id
    const encoder = new TextEncoder()
    const keyMaterial = encoder.encode(extensionId + '_quest_pro_v1')

    // Import key material
    const material = await crypto.subtle.importKey(
      'raw',
      keyMaterial,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    )

    // Derive AES-GCM key
    this.encryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('quest_pro_salt'),
        iterations: 10000,
        hash: 'SHA-256',
      },
      material,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    )

    return this.encryptionKey
  }

  /**
   * Encrypt a string value
   */
  private async encrypt(value: string): Promise<EncryptedValue> {
    const key = await this.getEncryptionKey()
    const encoder = new TextEncoder()
    const data = encoder.encode(value)

    // Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12))

    // Encrypt
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    return {
      data: this.arrayBufferToBase64(encrypted),
      iv: this.arrayBufferToBase64(iv.buffer),
    }
  }

  /**
   * Decrypt a value
   */
  private async decrypt(encrypted: EncryptedValue): Promise<string> {
    const key = await this.getEncryptionKey()
    const data = this.base64ToArrayBuffer(encrypted.data)
    const iv = this.base64ToArrayBuffer(encrypted.iv)

    // Decrypt
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    )

    const decoder = new TextDecoder()
    return decoder.decode(decrypted)
  }

  /**
   * Save an API key (automatically encrypted)
   */
  async setApiKey(
    provider: AIProvider,
    apiKey: string
  ): Promise<void> {
    const encrypted = await this.encrypt(apiKey)
    const result = await chrome.storage.local.get(['secure_api_keys'])
    const keys: SecureApiKeys = result.secure_api_keys || {}

    switch (provider) {
      case AIProvider.OPENAI:
        keys.openaiApiKey = encrypted
        break
      case AIProvider.GEMINI:
        keys.geminiApiKey = encrypted
        break
      case AIProvider.ELEVENLABS:
        keys.elevenlabsApiKey = encrypted
        break
    }

    await chrome.storage.local.set({ secure_api_keys: keys })
  }

  /**
   * Get an API key (automatically decrypted)
   */
  async getApiKey(
    provider: AIProvider
  ): Promise<string | null> {
    const result = await chrome.storage.local.get(['secure_api_keys'])
    const keys: SecureApiKeys = result.secure_api_keys || {}

    let encrypted: EncryptedValue | undefined

    switch (provider) {
      case AIProvider.OPENAI:
        encrypted = keys.openaiApiKey
        break
      case AIProvider.GEMINI:
        encrypted = keys.geminiApiKey
        break
      case AIProvider.ELEVENLABS:
        encrypted = keys.elevenlabsApiKey
        break
    }

    if (!encrypted) {
      return null
    }

    try {
      return await this.decrypt(encrypted)
    } catch (error) {
      console.error('Failed to decrypt API key:', error)
      return null
    }
  }

  /**
   * Remove an API key
   */
  async removeApiKey(provider: AIProvider): Promise<void> {
    const result = await chrome.storage.local.get(['secure_api_keys'])
    const keys: SecureApiKeys = result.secure_api_keys || {}

    switch (provider) {
      case AIProvider.OPENAI:
        delete keys.openaiApiKey
        break
      case AIProvider.GEMINI:
        delete keys.geminiApiKey
        break
      case AIProvider.ELEVENLABS:
        delete keys.elevenlabsApiKey
        break
    }

    await chrome.storage.local.set({ secure_api_keys: keys })
  }

  // Helper methods
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary = atob(base64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i)
    }
    return bytes.buffer
  }
}

// Export singleton
export const secureApiKeys = new SecureApiKeyStorage()
