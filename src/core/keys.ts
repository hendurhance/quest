import { AIProvider } from '@/types'

const STORAGE_KEY = 'secure_api_keys'

const FIELD: Record<AIProvider, string> = {
  [AIProvider.OPENAI]: 'openaiApiKey',
  [AIProvider.GEMINI]: 'geminiApiKey',
  [AIProvider.ELEVENLABS]: 'elevenlabsApiKey',
}

interface Cipher {
  data: string // base64 ciphertext
  iv: string // base64 IV
}

type Vault = Partial<Record<string, Cipher>>

let cachedKey: CryptoKey | null = null

async function deriveKey(): Promise<CryptoKey> {
  if (cachedKey) return cachedKey
  const encoder = new TextEncoder()
  // Derived from the *public* extension id: this is at-rest obfuscation, not secrecy.
  // A determined local attacker can reproduce the key — it only keeps plaintext keys out of storage dumps.
  const material = await crypto.subtle.importKey(
    'raw',
    encoder.encode(`${chrome.runtime.id}_quest_pro_v1`),
    { name: 'PBKDF2' },
    false,
    ['deriveKey'],
  )
  cachedKey = await crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: encoder.encode('quest_pro_salt'), iterations: 10000, hash: 'SHA-256' },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
  return cachedKey
}

function toBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
}

function fromBase64(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
  return buffer
}

async function encrypt(value: string): Promise<Cipher> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await deriveKey(),
    new TextEncoder().encode(value),
  )
  return { data: toBase64(ciphertext), iv: toBase64(iv.buffer) }
}

async function decrypt(cipher: Cipher): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(cipher.iv) },
    await deriveKey(),
    fromBase64(cipher.data),
  )
  return new TextDecoder().decode(plaintext)
}

async function readVault(): Promise<Vault> {
  const result = await chrome.storage.local.get([STORAGE_KEY])
  return (result[STORAGE_KEY] as Vault) ?? {}
}

async function writeVault(vault: Vault): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: vault })
}

export async function setApiKey(provider: AIProvider, apiKey: string): Promise<void> {
  const vault = await readVault()
  vault[FIELD[provider]] = await encrypt(apiKey)
  await writeVault(vault)
}

export async function getApiKey(provider: AIProvider): Promise<string | null> {
  const cipher = (await readVault())[FIELD[provider]]
  if (!cipher) return null
  try {
    return await decrypt(cipher)
  } catch (error) {
    console.error('Failed to decrypt API key:', error)
    return null
  }
}

export async function hasApiKey(provider: AIProvider): Promise<boolean> {
  return Boolean((await readVault())[FIELD[provider]])
}

export async function removeApiKey(provider: AIProvider): Promise<void> {
  const vault = await readVault()
  delete vault[FIELD[provider]]
  await writeVault(vault)
}
