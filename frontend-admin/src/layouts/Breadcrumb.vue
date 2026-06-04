<template>
  <el-breadcrumb separator="/">
    <el-breadcrumb-item :to="{ path: '/admin/dashboard' }">首页</el-breadcrumb-item>
    <el-breadcrumb-item v-if="currentTitle">{{ currentTitle }}</el-breadcrumb-item>
  </el-breadcrumb>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const titleMap: Record<string, string> = {
  Dashboard: '仪表盘',
  UserList: '用户管理',
  ProjectList: '项目管理',
  EngineList: '引擎管理',
  TemplateList: '模板管理',
  SystemConfig: '系统配置',
  AuditLog: '审计日志',
}

const currentTitle = computed(() => {
  return titleMap[route.name as string] || ''
})
</script>
