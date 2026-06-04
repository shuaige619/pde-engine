import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getSystemConfig, updateSystemConfig as updateConfigApi } from '@/api/admin'
import type { SystemConfig } from '@/types'

export const useSystemStore = defineStore('system', () => {
  const configs = ref<SystemConfig[]>([])
  const loading = ref(false)

  const fetchConfigs = async () => {
    loading.value = true
    try {
      const res: any = await getSystemConfig()
      if (res.code === 0 || res.code === 200) {
        configs.value = res.data
      }
    } finally {
      loading.value = false
    }
  }

  const updateConfig = async (key: string, value: any) => {
    const res: any = await updateConfigApi(key, value)
    if (res.code === 0 || res.code === 200) {
      const idx = configs.value.findIndex((c) => c.key === key)
      if (idx >= 0) {
        configs.value[idx] = { ...configs.value[idx], value, updatedAt: new Date().toISOString() }
      }
      return true
    }
    return false
  }

  return { configs, loading, fetchConfigs, updateConfig }
})
