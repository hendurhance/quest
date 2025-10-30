import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { crx } from '@crxjs/vite-plugin'
import path from 'path'
import manifest from './manifest.config'
import zip from 'vite-plugin-zip-pack'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  plugins: [
    vue(),
    crx({ manifest }),
    zip({ outDir: 'release', outFileName: 'release.zip' }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173,
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: 'src/popup/index.html',
        manager: 'src/manager/index.html',
        'ai-dashboard': 'src/ai-dashboard/index.html',
      },
    },
  },
  publicDir: 'public',
})
