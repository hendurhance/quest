<template>
  <svg
    class="q-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="markup"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ICONS, type IconName } from './icons'

interface Props {
  name: IconName
  size?: number | string
  strokeWidth?: number
}

const props = withDefaults(defineProps<Props>(), { size: 18, strokeWidth: 2 })

// ICONS is a trusted local constant (our curated path data), never user input.
const markup = computed(() => ICONS[props.name])
</script>

<style scoped>
.q-icon {
  display: inline-block;
  vertical-align: middle;
  flex: none;
}
</style>
