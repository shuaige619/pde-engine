<template>
  <el-container class="admin-layout">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <el-icon size="28"><Setting /></el-icon>
        <span v-show="!isCollapse" class="logo-text">PDE 引擎</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#1a1a2e"
        text-color="#b8b9bf"
        active-text-color="#ffffff"
      >
        <el-menu-item index="/admin/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/admin/users">
          <el-icon><User /></el-icon>
          <template #title>用户管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/projects">
          <el-icon><Folder /></el-icon>
          <template #title>项目管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/engines">
          <el-icon><Cpu /></el-icon>
          <template #title>引擎管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/templates">
          <el-icon><DocumentCopy /></el-icon>
          <template #title>模板管理</template>
        </el-menu-item>
        <el-menu-item index="/admin/config">
          <el-icon><Tools /></el-icon>
          <template #title>系统配置</template>
        </el-menu-item>
        <el-menu-item index="/admin/audit">
          <el-icon><DocumentChecked /></el-icon>
          <template #title>审计日志</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" size="20" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <breadcrumb />
        </div>
        <div class="header-right">
          <el-dropdown @command="handleCommand">
            <span class="user-info">
              {{ userStore.user?.name || '管理员' }}
              <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import {
  Setting,
  Odometer,
  User,
  Folder,
  Cpu,
  DocumentCopy,
  Tools,
  DocumentChecked,
  Fold,
  Expand,
  ArrowDown,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/userStore'
import Breadcrumb from './Breadcrumb.vue'

const route = useRoute()
const userStore = useUserStore()
const isCollapse = ref(false)

const activeMenu = computed(() => route.path)

const handleCommand = (cmd: string) => {
  if (cmd === 'logout') {
    userStore.logout()
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
  width: 100vw;
}

.sidebar {
  background: #1a1a2e;
  transition: width 0.3s;
  display: flex;
  flex-direction: column;

  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);

    .logo-text {
      font-size: 18px;
      font-weight: 600;
      letter-spacing: 1px;
    }
  }

  :deep(.el-menu) {
    border-right: none;
  }
}

.header {
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;

  .header-left {
    display: flex;
    align-items: center;
    gap: 15px;
  }

  .collapse-btn {
    cursor: pointer;
    color: #606266;
    padding: 5px;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
      background: #f0f0f0;
    }
  }

  .header-right {
    .user-info {
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 5px;
      color: #606266;
      font-size: 14px;
    }
  }
}

.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
