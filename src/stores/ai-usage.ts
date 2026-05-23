import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { db } from '@/core/db'
import type { AuditLog } from '@/core/db'

export interface UsageTotals {
  summaries: number
  podcasts: number
  cost: number
  requests: number
}

export const useAiUsageStore = defineStore('aiUsage', () => {
  const logs = ref<AuditLog[]>([])
  const isLoading = ref(false)

  async function load(limit = 500): Promise<void> {
    isLoading.value = true
    try {
      await db.init()
      logs.value = await db.audit.list(limit)
    } finally {
      isLoading.value = false
    }
  }

  const totals = computed<UsageTotals>(() => {
    let summaries = 0
    let podcasts = 0
    let cost = 0
    let requests = 0
    for (const log of logs.value) {
      if (!log.success) continue
      requests++
      const estimated = log.details?.estimatedCost
      if (typeof estimated === 'number') cost += estimated
      if (log.action === 'generate_summary') summaries++
      if (log.action === 'generate_podcast') podcasts++
    }
    return { summaries, podcasts, cost, requests }
  })

  return { logs, isLoading, load, totals }
})
