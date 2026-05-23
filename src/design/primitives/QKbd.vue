<template>
  <kbd class="q-kbd"><slot /></kbd>
</template>

<style scoped>
.q-kbd {
  display: inline-block;
  min-width: 1.4em;
  text-align: center;
  font-family: var(--font-mono);
  font-size: var(--text-2xs);
  line-height: 1;
  color: var(--ink-muted);
  background: var(--paper-raised);
  border: 1px solid var(--rule-strong);
  border-bottom-width: 2px;
  border-radius: var(--radius-sm);
  padding: 0.2rem 0.4rem;
}
</style>
