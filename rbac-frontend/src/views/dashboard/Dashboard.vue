<template>
  <div class="dashboard">
    <!-- Stats Cards with Animation -->
    <a-row :gutter="16" class="stats-row">
      <a-col :xs="12" :md="6" v-for="(stat, index) in statCards" :key="stat.key">
        <div 
          v-motion
          :initial="{ opacity: 0, y: 20 }"
          :enter="{ opacity: 1, y: 0, transition: { delay: index * 100 } }"
        >
          <a-card class="stat-card" :bordered="false" hoverable>
            <div v-if="stat.isText" class="text-stat">
              <div class="stat-title">{{ stat.title }}</div>
              <div class="stat-value" :style="{ color: stat.color }">
                <component :is="stat.icon" class="stat-icon" :style="{ color: stat.color }" />
                {{ stat.value }}
              </div>
            </div>
            <a-statistic v-else
              :title="stat.title"
              :value="stat.value"
              :value-style="{ color: stat.color, fontWeight: 600 }"
            >
              <template #prefix>
                <component :is="stat.icon" class="stat-icon" :style="{ color: stat.color }" />
              </template>
            </a-statistic>
            <div class="stat-wave" :style="{ background: stat.waveColor }"></div>
          </a-card>
        </div>
      </a-col>
    </a-row>

    <!-- Welcome Card with Glass Effect -->
    <div
      v-motion
      :initial="{ opacity: 0, scale: 0.95 }"
      :enter="{ opacity: 1, scale: 1, transition: { delay: 400 } }"
    >
      <a-card class="welcome-card" :bordered="false">
        <div class="welcome-content">
          <div class="avatar-wrapper">
            <a-avatar :size="72" class="welcome-avatar">
              {{ userStore.nickname.charAt(0).toUpperCase() }}
            </a-avatar>
            <div class="avatar-ring"></div>
          </div>
          <div class="welcome-text">
            <h2 class="welcome-title">
              <span class="gradient-text">欢迎回来</span>，{{ userStore.nickname }}！
            </h2>            
            <div class="role-tags">
              <span class="role-label">当前角色：</span>
              <a-space wrap>
                <a-tag
                  v-for="role in userStore.roles"
                  :key="role.id"
                  class="role-tag"
                  :style="{ background: getRoleGradient(role.code) }"
                >
                  <Icon icon="heroicons:shield-check" class="role-icon" />
                  {{ role.name }}
                </a-tag>
              </a-space>
            </div>
          </div>
        </div>
        <!-- Decorative Elements -->
        <div class="deco-circle deco-1"></div>
        <div class="deco-circle deco-2"></div>
      </a-card>
    </div>

    <!-- Quick Actions with Hover Effects -->
    <div
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 500 } }"
    >
      <a-card title="快捷操作" :bordered="false" class="actions-card">
        <a-space size="large" class="quick-actions" wrap>
          <a-button 
            type="primary" 
            class="action-btn action-primary"
            @click="$router.push('/system/users')"
          >
            <template #icon>
              <Icon icon="heroicons:users" class="btn-icon" />
            </template>
            <span class="btn-text">用户管理</span>
            <div class="btn-shine"></div>
          </a-button>
          
          <a-button 
            class="action-btn action-success"
            @click="$router.push('/system/roles')"
          >
            <template #icon>
              <Icon icon="heroicons:user-group" class="btn-icon" />
            </template>
            <span class="btn-text">角色管理</span>
          </a-button>
          
          <a-button 
            class="action-btn action-warning"
            @click="$router.push('/system/permissions')"
          >
            <template #icon>
              <Icon icon="heroicons:key" class="btn-icon" />
            </template>
            <span class="btn-text">权限管理</span>
          </a-button>

          <a-button 
            class="action-btn action-info"
            @click="$router.push('/profile')"
          >
            <template #icon>
              <Icon icon="heroicons:user-circle" class="btn-icon" />
            </template>
            <span class="btn-text">个人中心</span>
          </a-button>
        </a-space>
      </a-card>
    </div>

    <!-- System Status -->
    <div
      v-motion
      :initial="{ opacity: 0, y: 20 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 600 } }"
    >
      <a-card :bordered="false" class="status-card">
        <template #title>
          <a-space>
            <Icon icon="heroicons:server" class="card-icon" />
            <span>系统状态</span>
          </a-space>
        </template>
        <a-row :gutter="16" class="status-row">
          <a-col :xs="24" :sm="8">
            <div class="status-item">
              <div class="status-dot running"></div>
              <div class="status-info">
                <div class="status-label">API 服务</div>
                <div class="status-value">运行中</div>
              </div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="8">
            <div class="status-item">
              <div class="status-dot running"></div>
              <div class="status-info">
                <div class="status-label">数据库</div>
                <div class="status-value">已连接</div>
              </div>
            </div>
          </a-col>
          <a-col :xs="24" :sm="8">
            <div class="status-item">
              <div class="status-dot running"></div>
              <div class="status-info">
                <div class="status-label">权限引擎</div>
                <div class="status-value">正常</div>
              </div>
            </div>
          </a-col>
        </a-row>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { userApi, roleApi, permissionApi } from '@/api'
import { Icon } from '@iconify/vue'

const userStore = useUserStore()

const stats = ref({
  users: 0,
  roles: 0,
  permissions: 0,
})

const statCards = computed(() => [
  {
    key: 'users',
    title: '用户总数',
    value: stats.value.users,
    color: '#6366f1',
    waveColor: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(99, 102, 241, 0.05))',
    icon: 'icon-user',
  },
  {
    key: 'roles',
    title: '角色总数',
    value: stats.value.roles,
    color: '#8b5cf6',
    waveColor: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.05))',
    icon: 'icon-safe',
  },
  {
    key: 'permissions',
    title: '权限总数',
    value: stats.value.permissions,
    color: '#a78bfa',
    waveColor: 'linear-gradient(135deg, rgba(167, 139, 250, 0.15), rgba(167, 139, 250, 0.05))',
    icon: 'icon-lock',
  },
  {
    key: 'status',
    title: '系统状态',
    value: '运行中',
    color: '#22c55e',
    waveColor: 'linear-gradient(135deg, rgba(34, 197, 94, 0.15), rgba(34, 197, 94, 0.05))',
    icon: 'icon-check-circle',
    isText: true,
  },
])

const roleGradients: Record<string, string> = {
  admin: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  user: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  default: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
}

const getRoleGradient = (code: string) => {
  return roleGradients[code] || roleGradients.default
}

const fetchStats = async () => {
  try {
    const [users, roles, permissions] = await Promise.all([
      userApi.getUsers(),
      roleApi.getRoles(),
      permissionApi.getPermissions(),
    ])
    stats.value.users = users.length
    stats.value.roles = roles.length
    stats.value.permissions = permissions.length
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '获取统计数据失败'
    console.error('Failed to fetch stats:', msg)
  }
}

onMounted(() => {
  fetchStats()
})
</script>

<style scoped>
.dashboard {
  padding-bottom: 24px;
}

/* Stat Cards */
.stat-card {
  position: relative;
  overflow: hidden;
  border-radius: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  height: 120px;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12);
  }
  
  :deep(.arco-card-body) {
    height: 100%;
    padding: 0;
  }
  
  :deep(.arco-statistic) {
    padding: 24px 20px;
    height: 100%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    box-sizing: border-box;
  }
  
  :deep(.arco-statistic-title) {
    font-size: 14px;
    color: var(--color-text-2);
    margin-bottom: 12px;
  }
  
  :deep(.arco-statistic-value) {
    font-size: 32px;
    font-weight: 700;
    line-height: 1.2;
  }
}

.text-stat {
  padding: 0 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  box-sizing: border-box;
  
  .stat-title {
    font-size: 14px;
    color: var(--color-text-2);
    margin-bottom: 12px;
    line-height: 1.4;
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    display: flex;
    align-items: center;
    gap: 8px;
    line-height: 1.2;
  }
}

.stat-icon {
  font-size: 28px;
  margin-right: 8px;
}

.stat-wave {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  border-radius: 0 0 16px 16px;
}

/* Welcome Card - 柔和蓝紫 */
.welcome-card {
  margin: 16px 0;
  border-radius: 20px;
  background: linear-gradient(135deg, #e0e7ff 0%, #c7b8ff 100%);
  color: #4338ca;
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(99, 102, 241, 0.1);
  
  :deep(.arco-card-body) {
    padding: 32px;
  }
}

.welcome-content {
  display: flex;
  align-items: center;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.avatar-wrapper {
  position: relative;
}

.welcome-avatar {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) !important;
  border: 3px solid rgba(255, 255, 255, 0.5);
  font-size: 28px;
  font-weight: 600;
  color: white;
}

.avatar-ring {
  position: absolute;
  inset: -8px;
  border: 2px solid rgba(99, 102, 241, 0.2);
  border-radius: 50%;
  animation: pulse-ring 2s ease-out infinite;
}

@keyframes pulse-ring {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(1.2);
    opacity: 0;
  }
}

.welcome-title {
  margin: 0 0 12px;
  font-size: 24px;
  font-weight: 500;
}

.gradient-text {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 700;
}

.role-label {
  font-size: 14px;
  color: #6366f1;
}

.role-tag {
  color: white;
  border: none;
  font-weight: 500;
  padding: 4px 12px;
  border-radius: 20px;
}

.role-icon {
  font-size: 14px;
  margin-right: 4px;
  vertical-align: middle;
}

/* Decorative Circles */
.deco-circle {
  position: absolute;
  border-radius: 50%;
  background: rgba(99, 102, 241, 0.08);
}

.deco-1 {
  width: 200px;
  height: 200px;
  top: -100px;
  right: -50px;
}

.deco-2 {
  width: 150px;
  height: 150px;
  bottom: -50px;
  right: 100px;
}

/* Action Buttons */
.actions-card {
  margin-bottom: 16px;
  border-radius: 16px;
  
  :deep(.arco-card-body) {
    padding: 24px;
  }
}

.action-btn {
  height: 48px;
  padding: 0 24px;
  border-radius: 12px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
  
  .btn-icon {
    font-size: 20px;
    transition: transform 0.3s;
  }
  
  &:hover .btn-icon {
    transform: scale(1.1);
  }
  
  .btn-text {
    margin-left: 8px;
  }
}

.action-primary {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  border: none;
  color: white;
}

.action-success {
  background: linear-gradient(135deg, #818cf8 0%, #a78bfa 100%);
  color: white;
  border: none;
}

.action-warning {
  background: linear-gradient(135deg, #c7b8ff 0%, #ddd6fe 100%);
  color: #5b21b6;
  border: none;
}

.action-info {
  background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
  color: #4338ca;
  border: 1px solid #c7b8ff;
}

.btn-shine {
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
  transition: left 0.5s;
}

.action-btn:hover .btn-shine {
  left: 100%;
}

/* Status Card */
.status-card {
  border-radius: 16px;
  
  :deep(.arco-card-body) {
    padding: 20px 24px;
  }
  
  .card-icon {
    font-size: 18px;
    color: #6366f1;
  }
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: var(--color-fill-2);
  border-radius: 12px;
  transition: all 0.3s;
  
  &:hover {
    background: var(--color-fill-3);
    transform: translateX(4px);
  }
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  position: relative;
  
  &.running {
    background: #00b42a;
    box-shadow: 0 0 0 4px rgba(0, 180, 42, 0.2);
    animation: pulse-dot 2s infinite;
  }
}

@keyframes pulse-dot {
  0%, 100% {
    box-shadow: 0 0 0 4px rgba(0, 180, 42, 0.2);
  }
  50% {
    box-shadow: 0 0 0 8px rgba(0, 180, 42, 0.1);
  }
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 12px;
  color: var(--color-text-3);
  margin-bottom: 2px;
}

.status-value {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-1);
}

@media (max-width: 768px) {
  .welcome-content {
    flex-direction: column;
    text-align: center;
  }
  
  .welcome-title {
    font-size: 20px;
  }
  
  .action-btn {
    width: 100%;
    justify-content: center;
  }
  
  .quick-actions {
    width: 100%;
  }
  
  .status-item {
    margin-bottom: 12px;
  }

  /* 移动端统计卡片统一 */
  .text-stat,
  :deep(.arco-statistic) {
    padding: 20px 16px;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
  }
  
  .text-stat .stat-title,
  :deep(.arco-statistic-title) {
    font-size: 13px;
    margin-bottom: 8px;
    line-height: 1.4;
  }
  
  .text-stat .stat-value,
  :deep(.arco-statistic-value) {
    font-size: 24px;
    line-height: 1.3;
  }
}
</style>
