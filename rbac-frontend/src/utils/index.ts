import { Message } from '@arco-design/web-vue'
import type { FieldRule } from '@arco-design/web-vue'

// Storage helpers
export const storage = {
  get: (key: string): any => {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  },
  set: (key: string, value: any): void => {
    localStorage.setItem(key, JSON.stringify(value))
  },
  remove: (key: string): void => {
    localStorage.removeItem(key)
  },
  clear: (): void => {
    localStorage.clear()
  },
}

// Token management
export const token = {
  get: (): string | null => localStorage.getItem('token'),
  set: (value: string): void => localStorage.setItem('token', value),
  remove: (): void => localStorage.removeItem('token'),
}

// Form rules
export const rules = {
  required: (message: string): FieldRule => ({
    required: true,
    message,
  }),
  minLength: (min: number, message: string): FieldRule => ({
    minLength: min,
    message,
  }),
  email: (message: string = 'Please enter a valid email'): FieldRule => ({
    type: 'email',
    message,
  }),
}

// Handle API errors
export const handleError = (error: any): void => {
  const message = error?.response?.data?.message || error?.message || 'Operation failed'
  Message.error(message)
}

// Format date
export const formatDate = (date: string | Date | undefined | null): string => {
  if (!date) return '-'
  const d = new Date(date)
  if (isNaN(d.getTime())) return '-'
  return d.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Tree helpers
export const buildTree = (
  data: any[],
  parentId: string | null = null,
  parentKey: string = 'parentId',
  idKey: string = 'id'
): any[] => {
  return data
    .filter((item) => item[parentKey] === parentId)
    .map((item) => ({
      ...item,
      children: buildTree(data, item[idKey], parentKey, idKey),
    }))
}
