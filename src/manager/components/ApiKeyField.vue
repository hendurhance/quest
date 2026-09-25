<template>
  <div class="key">
    <div class="key__row">
      <input
        :value="modelValue"
        class="key__input"
        type="password"
        autocomplete="off"
        spellcheck="false"
        :placeholder="saved ? 'Saved. Paste a new key to replace it' : placeholder"
        @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        @change="emit('commit')"
      />
      <QButton variant="secondary" size="sm" :loading="testing" :disabled="!modelValue && !saved" @click="emit('test')">
        Test
      </QButton>
    </div>
    <p class="key__state">
      <template v-if="saved">
        <span class="key__ok"><QIcon name="check" :size="12" /> Saved on this device</span>
        <span class="dot">·</span>
        <button type="button" class="key__link" @click="emit('remove')">Remove</button>
      </template>
      <template v-else>
        <span>Not set</span>
        <span class="dot">·</span>
        <a :href="consoleUrl" target="_blank" rel="noopener">Get a key ↗</a>
      </template>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { AIProvider } from '@/types'
import { QButton, QIcon } from '@/design/primitives'

const props = defineProps<{ provider: AIProvider; modelValue: string; saved: boolean; testing: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'commit'): void
  (e: 'test'): void
  (e: 'remove'): void
}>()

const CONSOLE: Record<AIProvider, { url: string; placeholder: string }> = {
  [AIProvider.OPENAI]: { url: 'https://platform.openai.com/api-keys', placeholder: 'sk-…' },
  [AIProvider.GEMINI]: { url: 'https://aistudio.google.com/apikey', placeholder: 'AIza…' },
  [AIProvider.ELEVENLABS]: { url: 'https://elevenlabs.io/app/settings/api-keys', placeholder: 'Your ElevenLabs key' },
}

const consoleUrl = computed(() => CONSOLE[props.provider].url)
const placeholder = computed(() => CONSOLE[props.provider].placeholder)
</script>

<style scoped>
.key {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}
.key__row {
  display: flex;
  gap: 0.5rem;
}
.key__input {
  flex: 1;
  min-width: 0;
  font-family: var(--font-mono);
  font-size: var(--text-sm);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.45rem 0.6rem;
  outline: none;
  transition: border-color var(--dur-fast) var(--ease-out), box-shadow var(--dur-fast) var(--ease-out);
}
.key__input::placeholder {
  font-family: var(--font-serif);
  color: var(--ink-faint);
}
.key__input:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}
.key__state {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
.key__ok {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  color: var(--positive);
}
.key__link {
  border: 0;
  background: none;
  padding: 0;
  font: inherit;
  color: var(--ink-muted);
  text-decoration: underline;
  cursor: pointer;
}
.key__link:hover {
  color: var(--critical);
}
.dot {
  color: var(--ink-faint);
}
</style>
