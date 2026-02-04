export interface User {
  id: number
  username: string
  nickname?: string
  email?: string
  phone?: string
  avatar?: string
  status: boolean
  roles: Role[]
  createdAt?: string
  updatedAt?: string
}

export interface Role {
  id: number
  code: string
  name: string
  description?: string
  status: boolean
  permissions: Permission[]
  createdAt?: string
  updatedAt?: string
}

export interface Permission {
  id: number
  name: string
  code?: string
  type: 'menu' | 'api' | 'button'
  path?: string
  component?: string
  icon?: string
  sortOrder: number
  status: boolean
  description?: string
  parent?: Permission
  children?: Permission[]
  createdAt?: string
  updatedAt?: string
}

export interface LoginForm {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  user: User
}
