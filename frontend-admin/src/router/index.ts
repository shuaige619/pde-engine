import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/admin/login',
      name: 'AdminLogin',
      component: () => import('@/views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      children: [
        { path: '', redirect: '/admin/dashboard' },
        { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/Dashboard.vue') },
        { path: 'users', name: 'UserList', component: () => import('@/views/UserList.vue') },
        { path: 'projects', name: 'ProjectList', component: () => import('@/views/ProjectList.vue') },
        { path: 'engines', name: 'EngineList', component: () => import('@/views/EngineList.vue') },
        { path: 'templates', name: 'TemplateList', component: () => import('@/views/TemplateList.vue') },
        { path: 'config', name: 'SystemConfig', component: () => import('@/views/SystemConfig.vue') },
        { path: 'audit', name: 'AuditLog', component: () => import('@/views/AuditLog.vue') },
      ],
    },
  ],
})

router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()
  if (!to.meta.public && !userStore.isAuthenticated) {
    next('/admin/login')
  } else {
    next()
  }
})

export default router
