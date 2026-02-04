<template>
  <a-layout class="layout">
    <!-- Desktop Sidebar - Light Theme -->
    <a-layout-sider
      :width="220"
      collapsible
      :collapsed="collapsed"
      @collapse="handleCollapse"
      class="layout-sider desktop-sider"
    >
      <div class="logo">
        <img src="/rhino-logo.svg" alt="白犀牛" class="sidebar-logo" />
        <span v-if="!collapsed" class="logo-text">白犀牛</span>
      </div>

      <a-menu
        :selected-keys="selectedKeys"
        :open-keys="openKeys"
        @sub-menu-click="handleSubMenuClick"
        auto-open-selected
        :collapse="collapsed"
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <a-sub-menu v-if="route.children" :key="route.path">
            <template #icon>
              <component :is="route.meta?.icon" />
            </template>
            <template #title>{{ route.meta?.title }}</template>
            <a-menu-item
              v-for="child in route.children.filter(c => !c.children)"
              :key="'/' + route.path + '/' + child.path"
              @click="handleMenuClick('/' + route.path + '/' + child.path)"
            >
              {{ child.meta?.title }}
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="'/' + route.path" @click="handleMenuClick('/' + route.path)">
            <template #icon>
              <component :is="route.meta?.icon" />
            </template>
            {{ route.meta?.title }}
          </a-menu-item>
        </template>
      </a-menu>
    </a-layout-sider>

    <!-- Mobile Drawer Menu -->
    <a-drawer
      :visible="mobileMenuVisible"
      @cancel="mobileMenuVisible = false"
      :width="280"
      placement="left"
      :footer="false"
      unmount-on-close
      class="mobile-drawer"
    >
      <template #title>
        <div class="drawer-logo">
          <img src="/rhino-logo.svg" alt="白犀牛" class="sidebar-logo" />
          <span class="logo-text">白犀牛</span>
        </div>
      </template>
      <a-menu
        :selected-keys="selectedKeys"
        class="sidebar-menu"
      >
        <template v-for="route in menuRoutes" :key="route.path">
          <a-sub-menu v-if="route.children" :key="route.path">
            <template #icon>
              <component :is="route.meta?.icon" />
            </template>
            <template #title>{{ route.meta?.title }}</template>
            <a-menu-item
              v-for="child in route.children.filter(c => !c.children)"
              :key="'/' + route.path + '/' + child.path"
              @click="handleMobileMenuClick('/' + route.path + '/' + child.path)"
            >
              {{ child.meta?.title }}
            </a-menu-item>
          </a-sub-menu>
          <a-menu-item v-else :key="'/' + route.path" @click="handleMobileMenuClick('/' + route.path)">
            <template #icon>
              <component :is="route.meta?.icon" />
            </template>
            {{ route.meta?.title }}
          </a-menu-item>
        </template>
      </a-menu>
    </a-drawer>

    <a-layout class="main-layout">
      <!-- Header -->
      <a-layout-header class="layout-header">
        <div class="header-left">
          <a-button type="text" class="menu-btn" @click="toggleMenu">
            <icon-menu-unfold v-if="collapsed" />
            <icon-menu-fold v-else />
          </a-button>
          <breadcrumb class="desktop-only" />
        </div>

        <div class="header-right">
          <a-space :size="12">
            <a-button 
              type="text" 
              @click="toggleTheme" 
              class="theme-btn desktop-only"
              :title="isDark ? '切换白天模式' : '切换黑夜模式'"
            >
              <span class="theme-icon">
                <icon-moon-fill v-if="isDark" />
                <icon-sun-fill v-else />
              </span>
            </a-button>

            <a-dropdown @select="handleUserAction">
              <a-button type="text" class="user-btn">
                <a-space :size="8">
                  <a-avatar :size="32" class="user-avatar">
                    {{ nickname.charAt(0).toUpperCase() }}
                  </a-avatar>
                  <span class="desktop-only user-name">{{ nickname }}</span>
                  <icon-down class="desktop-only" />
                </a-space>
              </a-button>

              <template #content>
                <a-doption value="profile">
                  <template #icon><icon-user /></template>
                  个人中心
                </a-doption>
                <a-doption value="logout">
                  <template #icon><icon-export /></template>
                  退出登录
                </a-doption>
              </template>
            </a-dropdown>
          </a-space>
        </div>
      </a-layout-header>

      <!-- Content -->
      <a-layout-content class="layout-content">
        <div class="content-wrapper">
          <router-view />
        </div>
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/store/user'
import Breadcrumb from '@/components/Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const collapsed = ref(false)
const isDark = ref(false)
const selectedKeys = ref<string[]>([])
const openKeys = ref<string[]>([])
const mobileMenuVisible = ref(false)
const isMobile = ref(false)

const nickname = computed(() => userStore.nickname)

const menuRoutes = computed(() => {
  const layoutRoute = router.getRoutes().find(r => r.name === 'Layout')
  return layoutRoute?.children || []
})

// Check screen size
const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768
  collapsed.value = isMobile.value
}

// Check system theme preference
const checkSystemTheme = () => {
  const savedTheme = localStorage.getItem('theme')
  if (savedTheme) {
    isDark.value = savedTheme === 'dark'
  } else {
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
  }
  applyTheme()
}

const applyTheme = () => {
  if (isDark.value) {
    document.body.setAttribute('arco-theme', 'dark')
  } else {
    document.body.removeAttribute('arco-theme')
  }
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

watch(
  () => route.path,
  (path) => {
    selectedKeys.value = [path]
    const parentPath = path.split('/').slice(0, 2).join('/')
    if (parentPath && parentPath !== path && !openKeys.value.includes(parentPath)) {
      openKeys.value.push(parentPath)
    }
    if (isMobile.value) {
      mobileMenuVisible.value = false
    }
  },
  { immediate: true }
)

onMounted(() => {
  checkScreenSize()
  checkSystemTheme()
  window.addEventListener('resize', checkScreenSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
})

const toggleMenu = () => {
  if (isMobile.value) {
    mobileMenuVisible.value = true
  } else {
    collapsed.value = !collapsed.value
  }
}

const toggleCollapsed = (val: boolean) => {
  collapsed.value = val
}

const handleCollapse = (val: boolean, type: string) => {
  collapsed.value = val
}

const handleMenuClick = async (key: string) => {
  if (route.path === key) return
  try {
    await router.push(key)
  } catch (error: any) {
    if (error.name !== 'NavigationDuplicated') {
      console.error('Navigation error:', error)
    }
  }
}

const handleMobileMenuClick = async (key: string) => {
  if (route.path === key) {
    mobileMenuVisible.value = false
    return
  }
  try {
    await router.push(key)
    mobileMenuVisible.value = false
  } catch (error: any) {
    if (error.name !== 'NavigationDuplicated') {
      console.error('Navigation error:', error)
    }
    mobileMenuVisible.value = false
  }
}

const handleSubMenuClick = (key: string, open: boolean) => {
  // 允许多个菜单同时展开
  if (open) {
    if (!openKeys.value.includes(key)) {
      openKeys.value.push(key)
    }
  } else {
    openKeys.value = openKeys.value.filter(k => k !== key)
  }
}

const toggleTheme = () => {
  isDark.value = !isDark.value
  applyTheme()
}

const handleUserAction = async (value: string) => {
  if (value === 'profile') {
    router.push('/profile')
  } else if (value === 'logout') {
    await userStore.logout()
    router.push('/login')
  }
}
</script>

<style>
/* CSS Variables for consistent theming */
:root {
  --sidebar-bg: #ffffff;
  --sidebar-border: #e5e6eb;
  --sidebar-hover: #f2f3f5;
  --sidebar-active: #e8f4ff;
  --sidebar-active-text: #165dff;
  --header-bg: #ffffff;
  --content-bg: #f2f3f5;
  --card-bg: #ffffff;
}

[arco-theme="dark"] {
  --sidebar-bg: #1d2129;
  --sidebar-border: #333333;
  --sidebar-hover: #2a2e36;
  --sidebar-active: #165dff20;
  --sidebar-active-text: #3c7eff;
  --header-bg: #1d2129;
  --content-bg: #0e0e0e;
  --card-bg: #1d2129;
}

/* Global mobile fixes */
html, body {
  max-width: 100vw;
  overflow-x: hidden;
}

body {
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}
</style>

<style scoped>
.layout {
  min-height: 100vh;
  background: var(--content-bg);
}

/* Sidebar - Unified Light Theme */
.layout-sider {
  background: var(--sidebar-bg) !important;
  border-right: 1px solid var(--sidebar-border);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

:deep(.arco-layout-sider-children) {
  background: var(--sidebar-bg) !important;
  overflow-x: hidden !important;
}

.desktop-sider {
  display: block;
  border-radius: 0 16px 16px 0;
  margin: 8px 0 8px 8px;
  height: calc(100vh - 16px);
}

/* Collapsed sidebar styles */
:deep(.arco-layout-sider-collapsed) {
  width: 64px !important;
  min-width: 64px !important;
  max-width: 64px !important;
  flex: 0 0 64px !important;
  
  .logo {
    margin: 0;
    justify-content: center;
    padding: 0;
  }
  
  .sidebar-logo {
    width: 32px;
    height: 32px;
  }
  
  .sidebar-menu {
    padding: 0;
  }
  
  /* 仅第一级菜单项居中 */
  .sidebar-menu > .arco-menu-item,
  .sidebar-menu > .arco-submenu > .arco-menu-inline-header {
    justify-content: center !important;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
  
  /* 仅第一级图标居中 */
  .sidebar-menu > .arco-menu-item > .arco-menu-item-inner > .arco-menu-icon,
  .sidebar-menu > .arco-submenu > .arco-menu-inline-header > .arco-menu-inline-content > .arco-menu-icon {
    margin: 0 auto !important;
  }
  
  /* 隐藏第一级菜单文字和箭头 */
  .sidebar-menu > .arco-menu-item > .arco-menu-item-inner > .arco-menu-title-content,
  .sidebar-menu > .arco-submenu > .arco-menu-inline-header > .arco-menu-inline-content > .arco-menu-title-content,
  .sidebar-menu > .arco-submenu > .arco-menu-inline-header > .arco-icon-down {
    display: none !important;
  }
  
  /* 修复底部折叠触发器 */
  :deep(.arco-layout-sider-trigger) {
    width: 64px !important;
    min-width: 64px !important;
    max-width: 64px !important;
    padding: 0 !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    left: 0 !important;
  }
  
  /* 确保触发器图标居中 */
  :deep(.arco-layout-sider-trigger-icon) {
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    width: 24px !important;
    margin: 0 auto !important;
  }
}

.logo {
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  border-bottom: 1px solid var(--sidebar-border);
  margin: 0 16px;
}

.sidebar-logo {
  width: 36px;
  height: 36px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.1));
}

.logo-text {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-1);
  white-space: nowrap;
}

.drawer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Menu Styling */
.sidebar-menu {
  background: transparent !important;
  border: none !important;
  padding: 8px;
}

:deep(.arco-menu-inner) {
  background: transparent !important;
}

:deep(.arco-menu-item) {
  border-radius: 8px;
  margin: 4px 0;
  color: var(--color-text-2);
  display: flex;
  align-items: center;
  
  &:hover {
    background: var(--sidebar-hover) !important;
    color: var(--color-text-1);
  }
  
  &.arco-menu-selected {
    background: var(--sidebar-active) !important;
    color: var(--sidebar-active-text);
    font-weight: 500;
  }
}

:deep(.arco-menu-inline-header) {
  border-radius: 8px;
  margin: 4px 0;
  color: var(--color-text-2);
  display: flex;
  align-items: center;
  
  &:hover {
    background: var(--sidebar-hover) !important;
  }
}

:deep(.arco-menu-icon) {
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 菜单项基础样式 - 不影响子菜单布局 */
:deep(.arco-menu-item-inner),
:deep(.arco-menu-inline-content) {
  display: flex;
  align-items: center;
}

/* 子菜单容器 - 确保纵向排列 */
:deep(.arco-menu-sub-menu) {
  display: block !important;
}

/* 子菜单项 - 确保纵向显示 */
:deep(.arco-menu-sub-menu .arco-menu-item) {
  display: flex !important;
  width: 100% !important;
}

/* Main Layout */
.main-layout {
  background: var(--content-bg);
  margin: 8px;
  border-radius: 16px;
}

/* Header */
.layout-header {
  height: 64px;
  background: var(--header-bg);
  border-bottom: 1px solid var(--sidebar-border);
  border-radius: 16px 16px 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
}

.header-right {
  display: flex;
  align-items: center;
}

.menu-btn {
  padding: 0;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  color: var(--color-text-2);
  
  &:hover {
    background: var(--sidebar-hover);
    color: var(--color-text-1);
  }
}

.theme-btn {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background: var(--sidebar-hover);
  }
}

.theme-icon {
  font-size: 18px;
  color: var(--color-text-2);
  transition: transform 0.3s;
}

.theme-btn:hover .theme-icon {
  transform: rotate(15deg);
}

.user-btn {
  padding: 4px 8px;
  border-radius: 8px;
  
  &:hover {
    background: var(--sidebar-hover);
  }
}

.user-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
  font-weight: 600;
}

.user-name {
  color: var(--color-text-1);
  font-weight: 500;
}

/* Content Area */
.layout-content {
  background: var(--content-bg);
  padding: 16px;
  border-radius: 0 0 16px 16px;
}

.content-wrapper {
  background: var(--card-bg);
  border-radius: 12px;
  min-height: calc(100vh - 128px);
  padding: 20px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

/* Page Transition Animations */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile Drawer */
.mobile-drawer :deep(.arco-drawer-body) {
  background: var(--sidebar-bg);
  padding: 0;
}

.mobile-drawer :deep(.arco-drawer-header) {
  background: var(--sidebar-bg);
  border-bottom: 1px solid var(--sidebar-border);
}

/* Hide elements on mobile */
.desktop-only {
  display: inline-flex;
}

.mobile-only {
  display: none;
}

/* Responsive breakpoints */
@media (max-width: 768px) {
  .desktop-only {
    display: none;
  }

  .desktop-sider {
    display: none;
  }

  .main-layout {
    margin: 0;
    border-radius: 0;
    max-width: 100vw;
  }

  .layout-header {
    border-radius: 0;
    padding: 0 12px;
  }

  .layout-content {
    padding: 12px;
    border-radius: 0;
    max-width: 100vw;
  }

  .content-wrapper {
    padding: 12px;
    min-height: calc(100vh - 88px);
    border-radius: 12px;
    max-width: 100%;
    overflow-x: hidden;
  }

  :deep(.arco-layout) {
    overflow-x: hidden;
  }
}

@media (min-width: 769px) {
  .mobile-only {
    display: block;
  }
}
</style>
