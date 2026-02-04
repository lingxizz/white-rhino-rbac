<template>
  <div class="profile-page">
    <a-row :gutter="24">
      <!-- Left: Profile Card -->
      <a-col :span="8">
        <a-card :bordered="false" class="profile-card">
          <div class="profile-header">
            <a-avatar :size="80" :style="{ backgroundColor: '#165dff' }">
              {{ userStore.nickname.charAt(0).toUpperCase() }}
            </a-avatar>
            <h2>{{ userStore.nickname }}</h2>
            <p>{{ userStore.username }}</p>
            <a-space wrap>
              <a-tag
                v-for="role in userStore.roles"
                :key="role.id"
                color="arcoblue"
              >
                {{ role.name }}
              </a-tag>
            </a-space>
          </div>

          <a-divider />

          <div class="profile-info">
            <p>
              <icon-email />
              <span>{{ userStore.user?.email || '未设置' }}</span>
            </p>
            <p>
              <icon-phone />
              <span>{{ userStore.user?.phone || '未设置' }}</span>
            </p>
            <p>
              <icon-clock-circle />
              <span>加入时间：{{ formatDate(userStore.user?.createdAt) }}</span>
            </p>
          </div>
        </a-card>
      </a-col>

      <!-- Right: Edit Forms -->
      <a-col :span="16">
        <a-card title="编辑资料" :bordered="false" class="edit-card">
          <a-form
            ref="profileFormRef"
            :model="profileForm"
            :rules="profileRules"
            layout="vertical"
          >
            <a-row :gutter="16">
              <a-col :span="12">
                <a-form-item field="nickname" label="昵称">
                  <a-input v-model="profileForm.nickname" placeholder="请输入昵称">
                    <template #prefix><icon-user /></template>
                  </a-input>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item field="email" label="邮箱">
                  <a-input v-model="profileForm.email" placeholder="请输入邮箱">
                    <template #prefix><icon-email /></template>
                  </a-input>
                </a-form-item>
              </a-col>
            </a-row>

            <a-form-item field="phone" label="手机号">
              <a-input v-model="profileForm.phone" placeholder="请输入手机号">
                <template #prefix><icon-phone /></template>
              </a-input>
            </a-form-item>

            <a-form-item>
              <a-button type="primary" @click="handleUpdateProfile" :loading="profileLoading">
                保存修改
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>

        <a-card title="修改密码" :bordered="false" class="password-card">
          <a-form
            ref="passwordFormRef"
            :model="passwordForm"
            :rules="passwordRules"
            layout="vertical"
          >
            <a-form-item field="oldPassword" label="当前密码">
              <a-input-password
                v-model="passwordForm.oldPassword"
                placeholder="请输入当前密码"
              >
                <template #prefix><icon-lock /></template>
              </a-input-password>
            </a-form-item>

            <a-form-item field="newPassword" label="新密码">
              <a-input-password
                v-model="passwordForm.newPassword"
                placeholder="请输入新密码"
              >
                <template #prefix><icon-lock /></template>
              </a-input-password>
            </a-form-item>

            <a-form-item field="confirmPassword" label="确认密码">
              <a-input-password
                v-model="passwordForm.confirmPassword"
                placeholder="确认新密码"
              >
                <template #prefix><icon-lock /></template>
              </a-input-password>
            </a-form-item>

            <a-form-item>
              <a-button type="primary" @click="handleChangePassword" :loading="passwordLoading">
                更新密码
              </a-button>
            </a-form-item>
          </a-form>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { Form } from '@arco-design/web-vue'
import { useUserStore } from '@/store/user'
import { userApi } from '@/api'
import { formatDate } from '@/utils'

const userStore = useUserStore()
const profileFormRef = ref<InstanceType<typeof Form>>()
const passwordFormRef = ref<InstanceType<typeof Form>>()
const profileLoading = ref(false)
const passwordLoading = ref(false)

const profileForm = reactive({
  nickname: '',
  email: '',
  phone: '',
})

const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const profileRules = {
  email: [{ type: 'email', message: '请输入有效的邮箱地址' }],
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入当前密码' }],
  newPassword: [
    { required: true, message: '请输入新密码' },
    { minLength: 6, message: '密码至少需要 6 个字符' },
  ],
  confirmPassword: [
    { required: true, message: '请确认新密码' },
    {
      validator: (value: string, cb: any) => {
        if (value !== passwordForm.newPassword) {
          cb('两次输入的密码不一致')
        } else {
          cb()
        }
      },
    },
  ],
}

const initFormData = () => {
  const user = userStore.user
  if (user) {
    profileForm.nickname = user.nickname || ''
    profileForm.email = user.email || ''
    profileForm.phone = user.phone || ''
  }
}

const handleUpdateProfile = async () => {
  const errors = await profileFormRef.value?.validate()
  if (errors) return

  profileLoading.value = true
  try {
    await userApi.updateProfile(profileForm)
    Message.success('资料更新成功')
    await userStore.fetchProfile()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '更新资料失败'
    Message.error(msg)
  } finally {
    profileLoading.value = false
  }
}

const handleChangePassword = async () => {
  const errors = await passwordFormRef.value?.validate()
  if (errors) return

  passwordLoading.value = true
  try {
    await userApi.changePassword({
      oldPassword: passwordForm.oldPassword,
      newPassword: passwordForm.newPassword,
    })
    Message.success('密码修改成功')
    passwordFormRef.value?.resetFields()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '修改密码失败'
    Message.error(msg)
  } finally {
    passwordLoading.value = false
  }
}

onMounted(() => {
  initFormData()
})
</script>

<style scoped>
.profile-page {
  .profile-card {
    .profile-header {
      text-align: center;
      padding: 24px 0;

      h2 {
        margin: 16px 0 4px;
        font-size: 20px;
      }

      p {
        color: var(--color-text-2);
        margin-bottom: 12px;
      }
    }

    .profile-info {
      p {
        display: flex;
        align-items: center;
        gap: 12px;
        margin: 12px 0;
        color: var(--color-text-2);

        span {
          flex: 1;
        }
      }
    }
  }

  .edit-card {
    margin-bottom: 16px;
  }
}
</style>
