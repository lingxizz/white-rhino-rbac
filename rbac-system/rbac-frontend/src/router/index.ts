import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/store/user'
import { token } from '@/utils'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { public: true },
    },
    {
      path: '/',
      name: 'Layout',
      component: () => import('@/views/Layout.vue'),
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/Dashboard.vue'),
          meta: { title: '仪表盘', icon: 'icon-dashboard' },
        },
        {
          path: 'system',
          name: 'System',
          redirect: '/system/users',
          meta: { title: '系统管理', icon: 'icon-settings' },
          children: [
            {
              path: 'users',
              name: 'UserManagement',
              component: () => import('@/views/system/UserManagement.vue'),
              meta: { title: '用户管理', icon: 'icon-user' },
            },
            {
              path: 'roles',
              name: 'RoleManagement',
              component: () => import('@/views/system/RoleManagement.vue'),
              meta: { title: '角色管理', icon: 'icon-safe' },
            },
            {
              path: 'permissions',
              name: 'PermissionManagement',
              component: () => import('@/views/system/PermissionManagement.vue'),
              meta: { title: '权限管理', icon: 'icon-lock' },
            },
          ],
        },
        {
          path: 'profile',
          name: 'Profile',
          component: () => import('@/views/system/Profile.vue'),
          meta: { title: '个人中心', icon: 'icon-user' },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const userStore = useUserStore()

  // Public routes
  if (to.meta.public) {
    if (userStore.isLoggedIn) {
      next('/')
    } else {
      next()
    }
    return
  }

  // Check authentication
  if (!token.get()) {
    next('/login')
    return
  }

  // Fetch user info if not loaded
  if (!userStore.user) {
    try {
      await userStore.fetchProfile()
    } catch {
      userStore.logout()
      next('/login')
      return
    }
  }

  next()
})

export default router
