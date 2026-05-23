<template>
  <label class="q-field" :class="{ 'q-field--error': !!error }">
    <span v-if="label" class="q-field__label">{{ label }}</span>
    <textarea
      v-if="multiline"
      class="q-field__control"
      :rows="rows"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />
    <input
      v-else
      class="q-field__control"
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      @input="onInput"
    />
    <span v-if="error" class="q-field__msg">{{ error }}</span>
    <span v-else-if="hint" class="q-field__hint">{{ hint }}</span>
  </label>
</template>

<script setup lang="ts">
interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  hint?: string
  error?: string
  type?: string
  multiline?: boolean
  rows?: number
  disabled?: boolean
}

withDefaults(defineProps<Props>(), {
  modelValue: '',
  type: 'text',
  multiline: false,
  rows: 4,
  disabled: false,
})

const emit = defineEmits<{ (e: 'update:modelValue', value: string): void }>()

function onInput(ev: Event): void {
  const target = ev.target as HTMLInputElement | HTMLTextAreaElement
  emit('update:modelValue', target.value)
}
</script>

<style scoped>
.q-field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.q-field__label {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  letter-spacing: var(--tracking-caps);
  text-transform: uppercase;
  color: var(--ink-muted);
}
.q-field__control {
  width: 100%;
  font-family: var(--font-serif);
  font-size: var(--text-base);
  color: var(--ink);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius);
  padding: 0.55rem 0.7rem;
  transition: border-color var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out);
}
.q-field__control:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-tint);
}
.q-field__control::placeholder {
  color: var(--ink-faint);
}
.q-field--error .q-field__control {
  border-color: var(--critical);
}
textarea.q-field__control {
  resize: vertical;
  line-height: var(--leading-normal);
}
.q-field__hint {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--ink-faint);
}
.q-field__msg {
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  color: var(--critical);
}
</style>
