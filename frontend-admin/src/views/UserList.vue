<template>
  <div class="page-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>用户管理</span>
          <el-button type="primary" :icon="Plus">新增用户</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item>
          <el-input
            v-model="queryForm.search"
            placeholder="搜索邮箱/用户名"
            clearable
            style="width: 220px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.status" placeholder="状态" clearable style="width: 120px;">
            <el-option label="正常" value="active" />
            <el-option label="停用" value="inactive" />
            <el-option label="已封禁" value="banned" />
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
        :data="userList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
        <el-table-column prop="name" label="用户名" width="150" />
        <el-table-column prop="email" label="邮箱" min-width="200" show-overflow-tooltip />
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.role === 'admin'" type="danger" size="small">管理员</el-tag>
            <el-tag v-else type="info" size="small">普通用户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.status"
              active-value="active"
              inactive-value="inactive"
              @change="(val: any) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column prop="lastLoginAt" label="最后登录" width="180">
          <template #default="{ row }">
            {{ row.lastLoginAt ? formatDate(row.lastLoginAt) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small">编辑</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
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
import { getUsers, updateUserStatus, deleteUser as deleteUserApi } from '@/api/admin'
import type { User, PaginationParams } from '@/types'
import dayjs from 'dayjs'

const loading = ref(false)
const userList = ref<User[]>([])
const total = ref(0)

const queryForm = reactive<PaginationParams & { status?: string }>({
  page: 1,
  pageSize: 20,
  search: '',
  status: undefined,
})

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getUsers(queryForm)
    if (res.code === 0 || res.code === 200) {
      userList.value = res.data.list
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
  queryForm.page = 1
  fetchData()
}

const handleStatusChange = async (row: User, val: any) => {
  try {
    const res: any = await updateUserStatus(row.id, val)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('状态更新成功')
    }
  } catch {
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

const handleDelete = async (row: User) => {
  try {
    await ElMessageBox.confirm(`确认删除用户 ${row.name} 吗？`, '提示', { type: 'warning' })
    const res: any = await deleteUserApi(row.id)
    if (res.code === 0 || res.code === 200) {
      ElMessage.success('删除成功')
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
