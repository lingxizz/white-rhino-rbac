import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { authApi } from '@/api'
import { token } from '@/utils'

export const useUserStore = defineStore('user', () => {
  // State
  const user = ref<User | null>(null)
  const tokenValue = ref<string>(token.get() || '')

  // Getters
  const isLoggedIn = computed(() => !!tokenValue.value)
  const username = computed(() => user.value?.username || '')
  const nickname = computed(() => user.value?.nickname || user.value?.username || '')
  const avatar = computed(() => user.value?.avatar || '')
  const roles = computed(() => user.value?.roles || [])

  // Actions
  const setToken = (value: string) => {
    tokenValue.value = value
    token.set(value)
  }

  const setUser = (userData: User) => {
    user.value = userData
  }

  const login = async (username: string, password: string) => {
    const response = await authApi.login({ username, password })
    setToken(response.access_token)
    setUser(response.user)
    return response
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      user.value = null
      tokenValue.value = ''
      token.remove()
    }
  }

  const fetchProfile = async () => {
    const data = await authApi.getProfile()
    setUser(data as User)
    return data
  }

  const hasPermission = (permissionCode: string): boolean => {
    if (!user.value?.roles) return false
    return user.value.roles.some((role) =>
      role.permissions?.some((p) => p.code === permissionCode)
    )
  }

  const hasRole = (roleCode: string): boolean => {
    if (!user.value?.roles) return false
    return user.value.roles.some((role) => role.code === roleCode)
  }

  return {
    user,
    token: tokenValue,
    isLoggedIn,
    username,
    nickname,
    avatar,
    roles,
    setToken,
    setUser,
    login,
    logout,
    fetchProfile,
    hasPermission,
    hasRole,
  }
})
