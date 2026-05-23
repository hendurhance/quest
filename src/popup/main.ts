import { createApp } from 'vue'
import App from './App.vue'
import { pinia } from '@/stores'
import { applyStoredTheme } from '@/composables/useTheme'
import '@/design/tokens.css'
import '@/design/fonts.css'
import '@/design/base.css'

applyStoredTheme()
createApp(App).use(pinia).mount('#app')
