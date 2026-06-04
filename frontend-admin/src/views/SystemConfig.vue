<template>
  <div class="page-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>系统配置</span>
          <el-button type="primary" :icon="Refresh" :loading="loading" @click="fetchConfigs">刷新</el-button>
        </div>
      </template>

      <el-alert
        title="修改系统配置可能影响平台正常运行，请谨慎操作。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />

      <!-- 按分类分组展示 -->
      <div v-for="group in configGroups" :key="group.category" class="config-group">
        <div class="group-title">{{ group.category }}</div>
        <el-table :data="group.configs" stripe style="width: 100%; margin-bottom: 20px;">
          <el-table-column prop="key" label="配置项" min-width="200" show-overflow-tooltip />
          <el-table-column prop="description" label="说明" min-width="250" show-overflow-tooltip />
          <el-table-column label="当前值" min-width="250">
            <template #default="{ row }">
              <div v-if="editingKey === row.key" class="edit-inline">
                <el-input v-model="editingValue" size="small" style="width: 200px;" />
                <el-button type="primary" size="small" :icon="Check" @click="handleSaveEdit(row)" />
                <el-button size="small" :icon="Close" @click="editingKey = null" />
              </div>
              <div v-else class="value-display">
                <span class="config-value">{{ formatValue(row.value) }}</span>
                <el-button link type="primary" size="small" :icon="Edit" @click="startEdit(row)">
                  编辑
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="updatedAt" label="更新时间" width="170">
            <template #default="{ row }">
              {{ formatDate(row.updatedAt) }}
            </template>
          </el-table-column>
        </el-table>
      </div>

      <el-empty v-if="configs.length === 0 && !loading" description="暂无配置项" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Edit, Check, Close } from '@element-plus/icons-vue'
import { useSystemStore } from '@/stores/systemStore'
import dayjs from 'dayjs'

const systemStore = useSystemStore()
const configs = computed(() => systemStore.configs)
const loading = computed(() => systemStore.loading)

const editingKey = ref<string | null>(null)
const editingValue = ref('')

const configGroups = computed(() => {
  const groups: Record<string, typeof configs.value> = {}
  for (const config of configs.value) {
    if (!groups[config.category]) {
      groups[config.category] = []
    }
    groups[config.category].push(config)
  }
  return Object.entries(groups).map(([category, configs]) => ({ category, configs }))
})

const fetchConfigs = () => {
  systemStore.fetchConfigs()
}

const startEdit = (row: typeof configs.value[0]) => {
  editingKey.value = row.key
  editingValue.value = typeof row.value === 'object' ? JSON.stringify(row.value) : String(row.value)
}

const handleSaveEdit = async (row: typeof configs.value[0]) => {
  let value: any = editingValue.value
  if (typeof row.value === 'boolean') {
    value = value === 'true' || value === true
  } else if (typeof row.value === 'number') {
    value = Number(value)
  } else if (typeof row.value === 'object') {
    try {
      value = JSON.parse(value)
    } catch {
      // keep string
    }
  }
  const ok = await systemStore.updateConfig(row.key, value)
  if (ok) {
    ElMessage.success('配置更新成功')
    editingKey.value = null
  }
}

const formatValue = (val: any) => {
  if (typeof val === 'boolean') return val ? '是' : '否'
  if (typeof val === 'object') return JSON.stringify(val)
  return String(val)
}

const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')

onMounted(fetchConfigs)
</script>

<style scoped lang="scss">
.page-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
  }

  .config-group {
    .group-title {
      font-size: 16px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e4e7ed;
    }
  }

  .value-display {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .config-value {
      font-family: 'Courier New', monospace;
      color: #409EFF;
      font-size: 13px;
    }
  }

  .edit-inline {
    display: flex;
    align-items: center;
    gap: 6px;
  }
}
</style>
