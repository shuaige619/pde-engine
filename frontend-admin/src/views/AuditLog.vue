<template>
  <div class="page-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>审计日志</span>
          <el-button :icon="Download">导出</el-button>
        </div>
      </template>

      <!-- 高级搜索 -->
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="datetimerange"
            range-separator="至"
            start-placeholder="开始时间"
            end-placeholder="结束时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 360px;"
            @change="handleDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-input
            v-model="queryForm.userId"
            placeholder="操作人ID/名称"
            clearable
            style="width: 180px;"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.action" placeholder="操作类型" clearable style="width: 160px;">
            <el-option label="登录" value="login" />
            <el-option label="登出" value="logout" />
            <el-option label="创建" value="create" />
            <el-option label="更新" value="update" />
            <el-option label="删除" value="delete" />
            <el-option label="导出" value="export" />
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
        :data="logList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
        <el-table-column prop="createdAt" label="时间" width="170" sortable>
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="userName" label="操作人" width="130" />
        <el-table-column prop="action" label="操作类型" width="100">
          <template #default="{ row }">
            <el-tag :type="actionType(row.action)" size="small">{{ row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="resource" label="操作对象" width="120" />
        <el-table-column prop="resourceId" label="对象ID" width="100" show-overflow-tooltip />
        <el-table-column prop="detail" label="操作详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="showDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="queryForm.page"
          v-model:page-size="queryForm.pageSize"
          :total="total"
          :page-sizes="[20, 50, 100, 200]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>

    <!-- 详情抽屉 -->
    <el-drawer v-model="drawerVisible" title="日志详情" size="480px">
      <el-descriptions :column="1" border>
        <el-descriptions-item label="日志ID">{{ currentLog?.id }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog ? formatDate(currentLog.createdAt) : '' }}</el-descriptions-item>
        <el-descriptions-item label="操作人">
          {{ currentLog?.userName }} ({{ currentLog?.userId }})
        </el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="actionType(currentLog?.action || '')" size="small">{{ currentLog?.action }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作对象">{{ currentLog?.resource }}</el-descriptions-item>
        <el-descriptions-item label="对象ID">{{ currentLog?.resourceId }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog?.ip }}</el-descriptions-item>
        <el-descriptions-item label="操作详情">{{ currentLog?.detail }}</el-descriptions-item>
      </el-descriptions>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { Search, RefreshRight, Download } from '@element-plus/icons-vue'
import { getAuditLogs } from '@/api/admin'
import type { AuditLog, AuditLogQuery } from '@/types'
import dayjs from 'dayjs'

const loading = ref(false)
const logList = ref<AuditLog[]>([])
const total = ref(0)
const drawerVisible = ref(false)
const currentLog = ref<AuditLog | null>(null)
const dateRange = ref<[string, string] | null>(null)

const queryForm = reactive<AuditLogQuery>({
  page: 1,
  pageSize: 20,
  userId: undefined,
  action: undefined,
  startDate: undefined,
  endDate: undefined,
})

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getAuditLogs(queryForm)
    if (res.code === 0 || res.code === 200) {
      logList.value = res.data.list
      total.value = res.data.total
    }
  } finally {
    loading.value = false
  }
}

const handleDateChange = (val: [string, string] | null) => {
  if (val) {
    queryForm.startDate = val[0]
    queryForm.endDate = val[1]
  } else {
    queryForm.startDate = undefined
    queryForm.endDate = undefined
  }
}

const handleSearch = () => {
  queryForm.page = 1
  fetchData()
}

const handleReset = () => {
  queryForm.page = 1
  queryForm.pageSize = 20
  queryForm.userId = undefined
  queryForm.action = undefined
  queryForm.startDate = undefined
  queryForm.endDate = undefined
  dateRange.value = null
  fetchData()
}

const handleSizeChange = () => {
  queryForm.page = 1
  fetchData()
}

const handlePageChange = () => {
  fetchData()
}

const showDetail = (row: AuditLog) => {
  currentLog.value = row
  drawerVisible.value = true
}

const actionType = (action: string) => {
  const map: Record<string, string> = {
    login: 'success',
    logout: 'info',
    create: 'primary',
    update: 'warning',
    delete: 'danger',
    export: 'info',
  }
  return map[action] || 'info'
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
    padding: 15px;
    background: #f8f9fa;
    border-radius: 8px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-top: 20px;
  }
}
</style>
