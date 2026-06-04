<template>
  <div class="page-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>项目管理</span>
          <el-button type="primary" :icon="Plus">新建项目</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item>
          <el-input
            v-model="queryForm.search"
            placeholder="搜索项目名称"
            clearable
            style="width: 220px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.status" placeholder="项目状态" clearable style="width: 140px;">
            <el-option label="进行中" value="active" />
            <el-option label="已暂停" value="paused" />
            <el-option label="已归档" value="archived" />
            <el-option label="异常" value="error" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.platform" placeholder="平台" clearable style="width: 120px;">
            <el-option label="Android" value="android" />
            <el-option label="iOS" value="ios" />
            <el-option label="Web" value="web" />
            <el-option label="跨平台" value="cross" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button :icon="RefreshRight" @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        v-loading="loading"
        :data="projectList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
        <el-table-column prop="name" label="项目名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="ownerName" label="负责人" width="120" />
        <el-table-column prop="platform" label="平台" width="100">
          <template #default="{ row }">
            <el-tag :type="platformType(row.platform)" size="small">
              {{ platformLabel(row.platform) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="engineName" label="关联引擎" width="130" />
        <el-table-column prop="templateName" label="关联模板" width="130" />
        <el-table-column prop="buildCount" label="构建次数" width="90" align="center" />
        <el-table-column prop="createdAt" label="创建时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'active'" link type="warning" size="small" @click="handlePause(row)">
              暂停
            </el-button>
            <el-button v-if="row.status === 'paused'" link type="success" size="small" @click="handleResume(row)">
              恢复
            </el-button>
            <el-button link type="info" size="small" @click="handleArchive(row)">归档</el-button>
            <el-button link type="primary" size="small">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[10, 20, 50, 100]"
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
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, RefreshRight } from '@element-plus/icons-vue'
import { getProjects, updateProjectStatus } from '@/api/admin'
import type { Project } from '@/types'
import dayjs from 'dayjs'

const loading = ref(false)
const projectList = ref<Project[]>([])
const total = ref(0)

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  search: '',
  status: undefined as string | undefined,
  platform: undefined as string | undefined,
})

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getProjects(queryForm)
    if (res.code === 0 || res.code === 200) {
      projectList.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  queryForm.page = 1
  fetchData()
}

const handleReset = () => {
  queryForm.search = ''
  queryForm.status = undefined
  queryForm.platform = undefined
  queryForm.page = 1
  fetchData()
}

const handlePause = async (row: Project) => {
  try {
    await ElMessageBox.confirm(`确认暂停项目 ${row.name} 吗？`, '提示', { type: 'warning' })
    const res: any = await updateProjectStatus(row.id, 'paused')
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('项目已暂停')
      fetchData()
    }
  } catch {
    // cancelled
  }
}

const handleResume = async (row: Project) => {
  const res: any = await updateProjectStatus(row.id, 'active')
  if (res.code === 0 || res.code === 200) {
    ElMessage.success('项目已恢复')
    fetchData()
  }
}

const handleArchive = async (row: Project) => {
  try {
    await ElMessageBox.confirm(`确认归档项目 ${row.name} 吗？`, '提示', { type: 'warning' })
    const res: any = await updateProjectStatus(row.id, 'archived')
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('项目已归档')
      fetchData()
    }
  } catch {
    // cancelled
  }
}

const handleSizeChange = () => {
  queryForm.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const platformType = (p: string) => {
  const map: Record<string, string> = {
    android: 'success',
    ios: 'info',
    web: 'primary',
    cross: 'warning',
  }
  return map[p] || 'info'
}

const platformLabel = (p: string) => {
  const map: Record<string, string> = {
    android: 'Android',
    ios: 'iOS',
    web: 'Web',
    cross: '跨平台',
  }
  return map[p] || p
}

const statusType = (s: string) => {
  const map: Record<string, string> = {
    active: 'success',
    paused: 'warning',
    archived: 'info',
    error: 'danger',
  }
  return map[s] || 'info'
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    active: '进行中',
    paused: '已暂停',
    archived: '已归档',
    error: '异常',
  }
  return map[s] || s
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

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
