<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    class="q-switch"
    :class="{ 'q-switch--on': modelValue }"
    @click="emit('update:modelValue', !modelValue)"
  >
    <span class="q-switch__knob" aria-hidden="true" />
  </button>
</template>

<script setup lang="ts">
defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', value: boolean): void }>()
</script>

<style scoped>
.q-switch {
  position: relative;
  width: 38px;
  height: 22px;
  flex: none;
  padding: 0;
  border: 1px solid var(--rule-strong);
  border-radius: var(--radius-full);
  background: var(--paper-sunken);
  cursor: pointer;
  transition: background var(--dur-fast) var(--ease-out), border-color var(--dur-fast) var(--ease-out);
}
.q-switch--on {
  background: var(--accent);
  border-color: var(--accent);
}
.q-switch__knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--paper-raised);
  box-shadow: var(--shadow-sm);
  transition: transform var(--dur-fast) var(--ease-out);
}
.q-switch--on .q-switch__knob {
  transform: translateX(16px);
  background: #fff;
}
</style>
