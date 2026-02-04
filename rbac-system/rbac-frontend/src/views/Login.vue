<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-left">
        <div class="brand-section">
          <div class="logo">
            <img src="/rhino-logo.svg" alt="白犀牛" class="rhino-logo" />
          </div>
          <h1 class="title">白犀牛权限管理</h1>
          <p class="subtitle">基于角色的访问控制系统</p>
          <div class="features">
            <div class="feature-item">
              <icon-check-circle class="feature-icon" />
              <span>用户管理</span>
            </div>
            <div class="feature-item">
              <icon-check-circle class="feature-icon" />
              <span>角色管理</span>
            </div>
            <div class="feature-item">
              <icon-check-circle class="feature-icon" />
              <span>权限控制</span>
            </div>
          </div>
        </div>
      </div>

      <div class="login-right">
        <div class="login-box">
          <h2 class="login-title">欢迎回来</h2>
          <p class="login-desc">请登录以继续</p>

          <a-form
            ref="formRef"
            :model="formData"
            :rules="formRules"
            @submit="handleSubmit"
            layout="vertical"
          >
            <a-form-item field="username" label="用户名" hide-label>
              <a-input
                v-model="formData.username"
                placeholder="请输入用户名"
                size="large"
                allow-clear
              >
                <template #prefix>
                  <icon-user />
                </template>
              </a-input>
            </a-form-item>

            <a-form-item field="password" label="密码" hide-label>
              <a-input-password
                v-model="formData.password"
                placeholder="请输入密码"
                size="large"
                allow-clear
              >
                <template #prefix>
                  <icon-lock />
                </template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <a-button
                type="primary"
                html-type="submit"
                size="large"
                long
                :loading="loading"
              >
                登录
              </a-button>
            </a-form-item>
          </a-form>

          <div class="login-hint">
            <p>默认账号：<strong>admin / admin123</strong></p>
          </div>
        </div>
      </div>
    </div>

    <div class="login-footer">
      <p>© 2024 RBAC System. All rights reserved.</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { Message } from '@arco-design/web-vue'
import { useUserStore } from '@/store/user'
import type { Form } from '@arco-design/web-vue'

const router = useRouter()
const userStore = useUserStore()
const formRef = ref<InstanceType<typeof Form>>()
const loading = ref(false)

const formData = reactive({
  username: '',
  password: '',
})

const formRules = {
  username: [{ required: true, message: '请输入用户名' }],
  password: [{ required: true, message: '请输入密码' }],
}

const handleSubmit = async ({ errors }: { errors: any }) => {
  if (errors) return

  loading.value = true
  try {
    await userStore.login(formData.username, formData.password)
    Message.success('登录成功')
    router.push('/')
  } catch (error: any) {
    // Error handled by request interceptor
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-container {
  flex: 1;
  display: flex;
  max-width: 1200px;
  margin: 0 auto;
  padding: 40px 20px;
  align-items: center;
}

.login-left {
  flex: 1;
  padding: 40px;
  color: white;
}

.brand-section {
  max-width: 500px;
}

.logo {
  width: 100px;
  height: 100px;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32px;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.rhino-logo {
  width: 80px;
  height: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.15));
}

.title {
  font-size: 48px;
  font-weight: 700;
  margin-bottom: 16px;
}

.subtitle {
  font-size: 18px;
  opacity: 0.9;
  margin-bottom: 48px;
}

.features {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 16px;
}

.feature-icon {
  color: #52c41a;
}

.login-right {
  width: 460px;
  padding: 40px;
}

.login-box {
  background: white;
  border-radius: 16px;
  padding: 48px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1d2129;
}

.login-desc {
  color: #86909c;
  margin-bottom: 32px;
}

.login-hint {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #e5e6eb;
  text-align: center;
  color: #86909c;
  font-size: 14px;
}

.login-hint strong {
  color: #165dff;
}

.login-footer {
  padding: 24px;
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

@media (max-width: 900px) {
  .login-left {
    display: none;
  }
  
  .login-right {
    width: 100%;
    padding: 20px;
  }
}
</style>
