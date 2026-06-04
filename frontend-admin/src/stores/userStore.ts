import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi } from '@/api/auth'
import type { User } from '@/types'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('admin_token'))
  const isAuthenticated = computed(() => !!token.value)

  const login = async (email: string, password: string) => {
    const res: any = await loginApi({ email, password })
    if (res.code === 0 || res.code === 200) {
      const data = res.data
      token.value = data.token
      localStorage.setItem('admin_token', data.token)
      user.value = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: data.user.role as 'admin' | 'user',
        status: 'active',
        createdAt: new Date().toISOString(),
      }
      return true
    }
    return false
  }

  const logout = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('admin_token')
    window.location.href = '/admin/login'
  }

  const setUser = (userData: User) => {
    user.value = userData
  }

  return { user, token, isAuthenticated, login, logout, setUser }
})
