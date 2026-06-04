<template>
  <div class="page-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>引擎管理</span>
          <el-button type="primary" :icon="Plus">注册引擎</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item>
          <el-input
            v-model="queryForm.search"
            placeholder="搜索引擎名称"
            clearable
            style="width: 220px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.type" placeholder="引擎类型" clearable style="width: 140px;">
            <el-option label="构建引擎" value="build" />
            <el-option label="部署引擎" value="deploy" />
            <el-option label="测试引擎" value="test" />
            <el-option label="扫描引擎" value="scan" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.status" placeholder="引擎状态" clearable style="width: 140px;">
            <el-option label="运行中" value="running" />
            <el-option label="已停止" value="stopped" />
            <el-option label="异常" value="error" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 引擎卡片网格 -->
      <el-row :gutter="20">
        <el-col v-for="engine in engineList" :key="engine.id" :span="8">
          <el-card class="engine-card" shadow="hover">
            <div class="engine-header">
              <div class="engine-title">
                <el-icon size="20"><Cpu /></el-icon>
                <span class="engine-name">{{ engine.name }}</span>
                <el-tag :type="statusType(engine.status)" size="small">{{ statusLabel(engine.status) }}</el-tag>
              </div>
              <el-dropdown @command="(cmd) => handleCommand(cmd, engine)">
                <el-icon class="more-icon"><MoreFilled /></el-icon>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="start" :disabled="engine.status === 'running'">启动</el-dropdown-item>
                    <el-dropdown-item command="stop" :disabled="engine.status === 'stopped'">停止</el-dropdown-item>
                    <el-dropdown-item command="restart">重启</el-dropdown-item>
                    <el-dropdown-item command="maintain" :disabled="engine.status === 'maintenance'">
                      维护模式
                    </el-dropdown-item>
                    <el-dropdown-item command="edit">编辑</el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>

            <div class="engine-meta">
              <div class="meta-item">
                <span class="meta-label">版本</span>
                <span class="meta-value">{{ engine.version }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">类型</span>
                <span class="meta-value">{{ typeLabel(engine.type) }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">任务数</span>
                <span class="meta-value">{{ engine.taskCount }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">健康检查</span>
                <el-tag :type="engine.healthCheck ? 'success' : 'danger'" size="small">
                  {{ engine.healthCheck ? '正常' : '异常' }}
                </el-tag>
              </div>
            </div>

            <div class="engine-endpoint">
              <el-icon><Link /></el-icon>
              <span>{{ engine.endpoint }}</span>
            </div>

            <div class="engine-desc">{{ engine.description }}</div>

            <div class="engine-footer">
              <span>更新于 {{ formatDate(engine.updatedAt) }}</span>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[9, 18, 36]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Search, RefreshRight, Cpu, MoreFilled, Link } from '@element-plus/icons-vue'
import { getEngines, updateEngineStatus } from '@/api/admin'
import type { Engine } from '@/types'
import dayjs from 'dayjs'

const loading = ref(false)
const engineList = ref<Engine[]>([])
const total = ref(0)

const queryForm = reactive({
  page: 1,
  pageSize: 9,
  search: '',
  type: undefined as string | undefined,
  status: undefined as string | undefined,
})

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getEngines()
    if (res.code === 0 || res.code === 200) {
      let list: Engine[] = res.data
      if (queryForm.search) {
        list = list.filter((e) => e.name.toLowerCase().includes(queryForm.search!.toLowerCase()))
      }
      if (queryForm.type) {
        list = list.filter((e) => e.type === queryForm.type)
      }
      if (queryForm.status) {
        list = list.filter((e) => e.status === queryForm.status)
      }
      total.value = list.length
      const start = (queryForm.page - 1) * queryForm.pageSize
      engineList.value = list.slice(start, start + queryForm.pageSize)
    }
  } finally {
    loading.value = false
  }
}

const handleCommand = async (cmd: string, engine: Engine) => {
  const statusMap: Record<string, string> = {
    start: 'running',
    stop: 'stopped',
    restart: 'running',
    maintain: 'maintenance',
  }
  if (statusMap[cmd]) {
    const res: any = await updateEngineStatus(engine.id, statusMap[cmd])
    if (res.code === 0 || res.code === 200) {
      ElMessage.success(`引擎已${cmd === 'start' ? '启动' : cmd === 'stop' ? '停止' : cmd === 'restart' ? '重启' : '进入维护模式'}`)
      fetchData()
    }
  }
}

const handleSearch = () => {
  queryForm.page = 1
  fetchData()
}

const handleReset = () => {
  queryForm.search = ''
  queryForm.type = undefined
  queryForm.status = undefined
  queryForm.page = 1
  fetchData()
}

const handleSizeChange = () => {
  queryForm.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const statusType = (s: string) => {
  const map: Record<string, string> = {
    running: 'success',
    stopped: 'info',
    error: 'danger',
    maintenance: 'warning',
  }
  return map[s] || 'info'
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    running: '运行中',
    stopped: '已停止',
    error: '异常',
    maintenance: '维护中',
  }
  return map[s] || s
}

const typeLabel = (t: string) => {
  const map: Record<string, string> = {
    build: '构建引擎',
    deploy: '部署引擎',
    test: '测试引擎',
    scan: '扫描引擎',
  }
  return map[t] || t
}

const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')

onMounted(fetchData)
</script>

<style scoped lang="scss">
.page-container {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 500;
  }

  .search-form {
    margin-bottom: 15px;
  }

  .engine-card {
    margin-bottom: 20px;

    :deep(.el-card__body) {
      padding: 18px;
    }
  }

  .engine-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 14px;

    .engine-title {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .engine-name {
      font-weight: 600;
      font-size: 15px;
    }

    .more-icon {
      cursor: pointer;
      color: #909399;
      padding: 4px;
      border-radius: 4px;

      &:hover {
        background: #f0f0f0;
      }
    }
  }

  .engine-meta {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 16px;
    margin-bottom: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f0f0f0;

    .meta-item {
      display: flex;
      gap: 8px;
      font-size: 13px;
    }

    .meta-label {
      color: #909399;
    }

    .meta-value {
      color: #303133;
      font-weight: 500;
    }
  }

  .engine-endpoint {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #409EFF;
    margin-bottom: 8px;
    word-break: break-all;
  }

  .engine-desc {
    font-size: 12px;
    color: #606266;
    line-height: 1.5;
    margin-bottom: 10px;
    min-height: 36px;
  }

  .engine-footer {
    font-size: 12px;
    color: #909399;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
