import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getStats } from '@/api/admin'
import type { SystemStats } from '@/types'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<SystemStats | null>(null)
  const loading = ref(false)

  const fetchStats = async () => {
    loading.value = true
    try {
      const res: any = await getStats()
      if (res.code === 0 || res.code === 200) {
        stats.value = res.data
      }
    } finally {
      loading.value = false
    }
  }

  return { stats, loading, fetchStats }
})
