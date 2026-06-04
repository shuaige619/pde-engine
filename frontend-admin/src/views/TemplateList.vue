<template>
  <div class="page-container">
    <el-card shadow="hover">
      <template #header>
        <div class="card-header">
          <span>模板管理</span>
          <el-button type="primary" :icon="Plus" @click="handleCreate">新建模板</el-button>
        </div>
      </template>

      <!-- 搜索栏 -->
      <el-form :model="queryForm" inline class="search-form">
        <el-form-item>
          <el-input
            v-model="queryForm.search"
            placeholder="搜索模板名称"
            clearable
            style="width: 220px;"
            @keyup.enter="handleSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.category" placeholder="分类" clearable style="width: 140px;">
            <el-option label="移动端" value="mobile" />
            <el-option label="Web端" value="web" />
            <el-option label="小程序" value="miniprogram" />
            <el-option label="桌面端" value="desktop" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-select v-model="queryForm.status" placeholder="状态" clearable style="width: 120px;">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已弃用" value="deprecated" />
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
        :data="templateList"
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" show-overflow-tooltip />
        <el-table-column prop="name" label="模板名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ categoryLabel(row.category) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="version" label="当前版本" width="100" align="center" />
        <el-table-column prop="latestVersion" label="最新版本" width="100" align="center" />
        <el-table-column prop="engineType" label="引擎类型" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="usageCount" label="使用次数" width="100" align="center" />
        <el-table-column prop="updatedAt" label="更新时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.updatedAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="primary" size="small" @click="handleVersion(row)">版本</el-button>
            <el-button link :type="row.status === 'published' ? 'warning' : 'success'" size="small" @click="handleToggleStatus(row)">
              {{ row.status === 'published' ? '下架' : '发布' }}
            </el-button>
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

    <!-- 版本管理对话框 -->
    <el-dialog v-model="versionDialogVisible" title="版本管理" width="600px">
      <el-table :data="versionList" stripe>
        <el-table-column prop="version" label="版本号" width="120" />
        <el-table-column prop="changelog" label="变更说明" min-width="200" />
        <el-table-column prop="createdAt" label="发布时间" width="170">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.isCurrent" type="success" size="small">当前</el-tag>
            <span v-else>-</span>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog v-model="editDialogVisible" :title="isEdit ? '编辑模板' : '新建模板'" width="560px">
      <el-form ref="formRef" :model="form" :rules="formRules" label-width="100px">
        <el-form-item label="模板名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入模板名称" />
        </el-form-item>
        <el-form-item label="分类" prop="category">
          <el-select v-model="form.category" placeholder="选择分类" style="width: 100%;">
            <el-option label="移动端" value="mobile" />
            <el-option label="Web端" value="web" />
            <el-option label="小程序" value="miniprogram" />
            <el-option label="桌面端" value="desktop" />
          </el-select>
        </el-form-item>
        <el-form-item label="引擎类型" prop="engineType">
          <el-input v-model="form.engineType" placeholder="请输入引擎类型" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saveLoading" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, RefreshRight } from '@element-plus/icons-vue'
import { getTemplates, updateTemplateStatus, deleteTemplate as deleteTemplateApi } from '@/api/admin'
import type { Template } from '@/types'
import dayjs from 'dayjs'
import type { FormInstance, FormRules } from 'element-plus'

const loading = ref(false)
const saveLoading = ref(false)
const templateList = ref<Template[]>([])
const total = ref(0)
const versionDialogVisible = ref(false)
const editDialogVisible = ref(false)
const isEdit = ref(false)
const formRef = ref<FormInstance>()
const currentId = ref('')

const form = reactive({
  name: '',
  category: '',
  engineType: '',
  description: '',
})

const formRules: FormRules = {
  name: [{ required: true, message: '请输入模板名称', trigger: 'blur' }],
  category: [{ required: true, message: '请选择分类', trigger: 'change' }],
  engineType: [{ required: true, message: '请输入引擎类型', trigger: 'blur' }],
}

const versionList = ref([
  { version: '1.2.0', changelog: '新增暗黑模式支持', createdAt: '2024-06-01T10:00:00Z', isCurrent: true },
  { version: '1.1.0', changelog: '优化构建性能', createdAt: '2024-05-15T08:30:00Z', isCurrent: false },
  { version: '1.0.0', changelog: '初始版本', createdAt: '2024-04-20T14:00:00Z', isCurrent: false },
])

const queryForm = reactive({
  page: 1,
  pageSize: 20,
  search: '',
  category: undefined as string | undefined,
  status: undefined as string | undefined,
})

const fetchData = async () => {
  loading.value = true
  try {
    const res: any = await getTemplates(queryForm)
    if (res.code === 0 || res.code === 200) {
      templateList.value = res.data.list
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
  queryForm.category = undefined
  queryForm.status = undefined
  queryForm.page = 1
  fetchData()
}

const handleCreate = () => {
  isEdit.value = false
  form.name = ''
  form.category = ''
  form.engineType = ''
  form.description = ''
  editDialogVisible.value = true
}

const handleEdit = (row: Template) => {
  isEdit.value = true
  currentId.value = row.id
  form.name = row.name
  form.category = row.category
  form.engineType = row.engineType
  form.description = row.description
  editDialogVisible.value = true
}

const handleSave = async () => {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saveLoading.value = true
  setTimeout(() => {
    ElMessage.success(isEdit.value ? '更新成功' : '创建成功')
    editDialogVisible.value = false
    saveLoading.value = false
    fetchData()
  }, 500)
}

const handleVersion = (_row: Template) => {
  versionDialogVisible.value = true
}

const handleToggleStatus = async (row: Template) => {
  const newStatus = row.status === 'published' ? 'draft' : 'published'
  const res: any = await updateTemplateStatus(row.id, newStatus)
  if (res.code === 0 || res.code === 200) {
    ElMessage.success('状态更新成功')
    fetchData()
  }
}

const handleDelete = async (row: Template) => {
  try {
    await ElMessageBox.confirm(`确认删除模板 ${row.name} 吗？`, '提示', { type: 'warning' })
    const res: any = await deleteTemplateApi(row.id)
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

const statusType = (s: string) => {
  const map: Record<string, string> = {
    published: 'success',
    draft: 'info',
    deprecated: 'danger',
  }
  return map[s] || 'info'
}

const statusLabel = (s: string) => {
  const map: Record<string, string> = {
    published: '已发布',
    draft: '草稿',
    deprecated: '已弃用',
  }
  return map[s] || s
}

const categoryLabel = (c: string) => {
  const map: Record<string, string> = {
    mobile: '移动端',
    web: 'Web端',
    miniprogram: '小程序',
    desktop: '桌面端',
  }
  return map[c] || c
}

const formatDate = (date: string) => dayjs(date).format('YYYY-MM-DD HH:mm')

fetchData()
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
