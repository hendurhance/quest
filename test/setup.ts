import { beforeEach, vi } from 'vitest'
import 'fake-indexeddb/auto'

// Mock Chrome API
global.chrome = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
  },
  storage: {
    local: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
    sync: {
      get: vi.fn(),
      set: vi.fn(),
      remove: vi.fn(),
      clear: vi.fn(),
    },
  },
  tabs: {
    query: vi.fn(),
    sendMessage: vi.fn(),
    create: vi.fn(),
  },
} as any

// Mock crypto subtle API for secure key storage
if (!global.crypto?.subtle) {
  Object.defineProperty(global, 'crypto', {
    value: {
      ...global.crypto,
      subtle: {
        generateKey: vi.fn(),
        encrypt: vi.fn(),
        decrypt: vi.fn(),
        exportKey: vi.fn(),
        importKey: vi.fn(),
      },
      getRandomValues: vi.fn((arr: any) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256)
        }
        return arr
      }),
    },
    writable: true,
    configurable: true,
  })
}

// Reset mocks before each test
beforeEach(() => {
  vi.clearAllMocks()
})
