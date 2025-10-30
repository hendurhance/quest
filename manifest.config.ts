import { defineManifest } from '@crxjs/vite-plugin'
import pkg from './package.json'

export default defineManifest({
  manifest_version: 3,
  name: 'Quest - Save & Organize Articles with AI',
  version: pkg.version,
  description: pkg.description,
  permissions: [
    'storage',
    'activeTab',
    'tabs',
    'notifications',
    'alarms',
    'contextMenus',
    'scripting'
  ],
  host_permissions: [
    'https://api.openai.com/*',
    'https://generativelanguage.googleapis.com/*',
    'https://api.elevenlabs.io/*'
  ],
  content_security_policy: {
    extension_pages: "script-src 'self'; object-src 'self'; base-uri 'self'; form-action 'self';"
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module'
  },
  action: {
    default_popup: 'src/popup/index.html',
    default_title: 'Quest',
    default_icon: {
      16: 'icons/icon16.png',
      32: 'icons/icon32.png',
      48: 'icons/icon48.png',
      128: 'icons/icon128.png'
    }
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.ts'],
      run_at: 'document_idle'
    }
  ],
  icons: {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png'
  },
  web_accessible_resources: [
    {
      resources: [
        'src/manager/index.html',
        'src/ai-dashboard/index.html'
      ],
      matches: ['<all_urls>']
    }
  ]
})
