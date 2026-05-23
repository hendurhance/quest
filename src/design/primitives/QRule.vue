<template>
  <div class="q-rule" :class="{ 'q-rule--vertical': vertical }" role="separator" />
</template>

<script setup lang="ts">
interface Props {
  vertical?: boolean
}

withDefaults(defineProps<Props>(), { vertical: false })
</script>

<style scoped>
.q-rule {
  height: 1px;
  width: 100%;
  background: var(--rule);
  border: 0;
}
.q-rule--vertical {
  width: 1px;
  height: auto;
  align-self: stretch;
}
</style>
