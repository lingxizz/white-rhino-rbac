import api from './request'
import type { User, Role, Permission, LoginForm, LoginResponse } from '@/types'

// Auth APIs
export const authApi = {
  login: (data: LoginForm) => api.post<LoginResponse>('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  getProfile: () => api.get('/auth/profile'),
}

// User APIs
export const userApi = {
  getUsers: () => api.get<User[]>('/users'),
  getUser: (id: string) => api.get<User>(`/users/${id}`),
  createUser: (data: Partial<User>) => api.post<User>('/users', data),
  updateUser: (id: string, data: Partial<User>) => api.patch<User>(`/users/${id}`, data),
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  assignRoles: (id: string, roleIds: string[]) => api.post(`/users/${id}/roles`, { roleIds }),
  updateProfile: (data: Partial<User>) => api.patch('/users/profile/me', data),
  changePassword: (data: { oldPassword: string; newPassword: string }) =>
    api.post('/users/profile/change-password', data),
}

// Role APIs
export const roleApi = {
  getRoles: () => api.get<Role[]>('/roles'),
  getRole: (id: string) => api.get<Role>(`/roles/${id}`),
  createRole: (data: Partial<Role>) => api.post<Role>('/roles', data),
  updateRole: (id: string, data: Partial<Role>) => api.patch<Role>(`/roles/${id}`, data),
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  assignPermissions: (id: string, permissionIds: string[]) =>
    api.post(`/roles/${id}/permissions`, { permissionIds }),
}

// Permission APIs
export const permissionApi = {
  getPermissions: () => api.get<Permission[]>('/permissions'),
  getPermissionsFlat: () => api.get<Permission[]>('/permissions?flat=true'),
  getPermission: (id: string) => api.get<Permission>(`/permissions/${id}`),
  createPermission: (data: Partial<Permission>) => api.post<Permission>('/permissions', data),
  updatePermission: (id: string, data: Partial<Permission>) => api.patch<Permission>(`/permissions/${id}`, data),
  deletePermission: (id: string) => api.delete(`/permissions/${id}`),
  getMenuTree: () => api.get<Permission[]>('/permissions/menu/tree'),
}
