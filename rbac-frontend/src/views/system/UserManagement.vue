<template>
  <div class="user-management">
    <!-- Header -->
    <a-space class="header-actions" size="medium">
      <a-button type="primary" @click="handleCreate">
        <template #icon><icon-plus /></template>
        新增用户
      </a-button>
    </a-space>

    <!-- Table with responsive wrapper -->
    <div class="table-container">
      <a-table
        :data="users"
        :loading="loading"
        :pagination="pagination"
        @page-change="handlePageChange"
      >
      <template #columns>
        <a-table-column title="用户名" data-index="username" />
        <a-table-column title="昵称" data-index="nickname" />
        <a-table-column title="邮箱" data-index="email" />
        <a-table-column title="手机号" data-index="phone" />
        <a-table-column title="角色" class-name="roles-column">
          <template #cell="{ record }">
            <div class="roles-cell">
              <a-tag
                v-for="role in record.roles.slice(0, 2)"
                :key="role.id"
                color="arcoblue"
                class="role-tag"
              >
                {{ role.name }}
              </a-tag>
              <a-tag v-if="record.roles.length > 2" color="gray" class="role-tag">
                +{{ record.roles.length - 2 }}
              </a-tag>
            </div>
          </template>
        </a-table-column>
        <a-table-column title="状态">
          <template #cell="{ record }">
            <a-badge :status="record.status ? 'success' : 'danger'" :text="record.status ? '启用' : '禁用'" />
          </template>
        </a-table-column>
        <a-table-column title="创建时间" data-index="createdAt">
          <template #cell="{ record }">
            {{ formatDate(record.createdAt) }}
          </template>
        </a-table-column>
        <a-table-column title="操作" width="200">
          <template #cell="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-button type="text" size="small" @click="handleAssignRoles(record)">角色</a-button>
              <a-popconfirm
                content="确定要删除这个用户吗？"
                @ok="handleDelete(record)"
              >
                <a-button type="text" status="danger" size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>
    </div>

    <!-- Create/Edit Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑用户' : '新增用户'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :width="isMobile ? 'calc(100vw - 32px)' : 520"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item field="username" label="用户名">
          <a-input v-model="formData.username" placeholder="请输入用户名" />
        </a-form-item>
        <a-form-item field="password" label="密码" v-if="!isEdit">
          <a-input-password v-model="formData.password" placeholder="请输入密码" />
        </a-form-item>
        <a-form-item field="nickname" label="昵称">
          <a-input v-model="formData.nickname" placeholder="请输入昵称" />
        </a-form-item>
        <a-form-item field="email" label="邮箱">
          <a-input v-model="formData.email" placeholder="请输入邮箱" />
        </a-form-item>
        <a-form-item field="phone" label="手机号">
          <a-input v-model="formData.phone" placeholder="请输入手机号" />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-switch v-model="formData.status" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Assign Roles Modal -->
    <a-modal
      v-model:visible="rolesModalVisible"
      title="分配角色"
      @ok="handleAssignRolesOk"
      @cancel="rolesModalVisible = false"
      :width="isMobile ? 'calc(100vw - 32px)' : 400"
    >
      <a-checkbox-group v-model="selectedRoles">
        <a-space direction="vertical">
          <a-checkbox
            v-for="role in allRoles"
            :key="role.id"
            :value="role.id"
          >
            {{ role.name }} ({{ role.code }})
          </a-checkbox>
        </a-space>
      </a-checkbox-group>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { Message } from '@arco-design/web-vue'
import type { Form } from '@arco-design/web-vue'
import { userApi, roleApi } from '@/api'
import type { User, Role } from '@/types'
import { formatDate } from '@/utils'

const loading = ref(false)
const users = ref<User[]>([])
const allRoles = ref<Role[]>([])
const pagination = ref({ total: 0, current: 1, pageSize: 10 })

const modalVisible = ref(false)
const rolesModalVisible = ref(false)
const isEdit = ref(false)
const currentId = ref('')
const selectedRoles = ref<string[]>([])
const formRef = ref<InstanceType<typeof Form>>()

const formData = reactive({
  username: '',
  password: '',
  nickname: '',
  email: '',
  phone: '',
  status: true,
})

// 移动端检测
const isMobile = computed(() => window.innerWidth < 768)

const formRules = {
  username: [
    { required: true, message: '请输入用户名' },
    { minLength: 3, message: '用户名至少需要3个字符' }
  ],
  password: [
    { required: true, message: '请输入密码' },
    { minLength: 6, message: '密码至少需要6个字符' }
  ],
}

const fetchUsers = async () => {
  loading.value = true
  try {
    const data = await userApi.getUsers()
    users.value = data
    pagination.value.total = data.length
  } finally {
    loading.value = false
  }
}

const fetchRoles = async () => {
  try {
    const data = await roleApi.getRoles()
    allRoles.value = data
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '获取角色列表失败'
    Message.error(msg)
  }
}

const handleCreate = () => {
  isEdit.value = false
  currentId.value = ''
  formData.username = ''
  formData.password = ''
  formData.nickname = ''
  formData.email = ''
  formData.phone = ''
  formData.status = true
  modalVisible.value = true
}

const handleEdit = (record: User) => {
  isEdit.value = true
  currentId.value = record.id
  formData.username = record.username
  formData.nickname = record.nickname || ''
  formData.email = record.email || ''
  formData.phone = record.phone || ''
  formData.status = record.status
  modalVisible.value = true
}

const handleModalOk = async () => {
  const errors = await formRef.value?.validate()
  if (errors) return

  try {
    if (isEdit.value) {
      // 编辑时不发送密码字段
      const { password, ...updateData } = formData
      await userApi.updateUser(currentId.value, updateData)
      Message.success('用户更新成功')
    } else {
      await userApi.createUser(formData)
      Message.success('用户创建成功')
    }
    modalVisible.value = false
    fetchUsers()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '保存用户失败'
    Message.error(msg)
  }
}

const handleModalCancel = () => {
  modalVisible.value = false
  formRef.value?.resetFields()
}

const handleDelete = async (record: User) => {
  try {
    await userApi.deleteUser(record.id)
    Message.success('用户删除成功')
    fetchUsers()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '删除用户失败'
    Message.error(msg)
  }
}

const handleAssignRoles = (record: User) => {
  currentId.value = record.id
  selectedRoles.value = record.roles.map(r => r.id)
  rolesModalVisible.value = true
}

const handleAssignRolesOk = async () => {
  try {
    await userApi.assignRoles(currentId.value, selectedRoles.value)
    Message.success('角色分配成功')
    rolesModalVisible.value = false
    fetchUsers()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '分配角色失败'
    Message.error(msg)
  }
}

const handlePageChange = (current: number) => {
  pagination.value.current = current
}

onMounted(() => {
  fetchUsers()
  fetchRoles()
})
</script>

<style scoped>
.user-management {
  .header-actions {
    margin-bottom: 16px;
  }

  .table-container {
    border-radius: 8px;
    background: var(--color-bg-2);
  }
}

/* Text truncation for table cells */
:deep(.arco-table-cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.roles-cell {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-width: 150px;
}

.role-tag {
  font-size: 12px;
  padding: 0 8px;
  height: 22px;
  line-height: 22px;
}

@media (max-width: 768px) {
  .user-management {
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  /* 移动端表格横向滚动 */
  .table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  :deep(.arco-table) {
    min-width: 600px;
  }

  :deep(.arco-table-cell) {
    max-width: none;
  }

  .roles-cell {
    max-width: none;
  }

  /* 移动端弹窗适配 */
  :deep(.arco-modal-wrapper .arco-modal) {
    max-width: calc(100vw - 32px) !important;
    margin: 0 16px;
  }

  :deep(.arco-modal-wrapper) {
    padding: 16px;
  }
}
</style>
