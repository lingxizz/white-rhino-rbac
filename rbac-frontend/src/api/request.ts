import axios from 'axios'
import { Message } from '@arco-design/web-vue'
import { token } from '@/utils'

// Create axios instance
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const accessToken = token.get()
    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const { response, config } = error
    
    // 登录接口特殊处理
    if (config?.url === '/auth/login') {
      const message = response?.data?.message || '登录失败'
      Message.error(message)
      return Promise.reject(error)
    }
    
    if (response?.status === 401) {
      Message.error('会话已过期，请重新登录')
      token.remove()
      window.location.href = '/login'
    } else if (response?.status === 400) {
      const message = response?.data?.message || '请求参数错误'
      Message.error(message)
    } else if (response?.status === 403) {
      Message.error('没有权限，请联系管理员')
    } else if (response?.status === 404) {
      Message.error('请求的资源不存在')
    } else {
      const message = response?.data?.message || error?.message || '请求失败，请稍后重试'
      Message.error(message)
    }
    
    return Promise.reject(error)
  }
)

export default api
