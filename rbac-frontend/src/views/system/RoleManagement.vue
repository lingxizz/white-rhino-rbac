<template>
  <div class="role-management">
    <!-- Header -->
    <a-space class="header-actions" size="medium">
      <a-button type="primary" @click="handleCreate">
        <template #icon><icon-plus /></template>
        新增角色
      </a-button>
    </a-space>

    <!-- Role Cards -->
    <a-row :gutter="16">
      <a-col
        v-for="role in roles"
        :key="role.id"
        :span="8"
        style="margin-bottom: 16px"
      >
        <a-card :bordered="false" class="role-card">
          <template #title>
            <a-space>
              <icon-safe style="color: #165dff" />
              <span>{{ role.name }}</span>
              <a-tag :color="role.status ? 'green' : 'red'">
                {{ role.status ? '启用' : '禁用' }}
              </a-tag>
            </a-space>
          </template>

          <template #extra>
            <a-dropdown trigger="click">
              <a-button type="text">
                <icon-more />
              </a-button>
              <template #content>
                <a-doption @click="handleEdit(role)">
                  <template #icon><icon-edit /></template>
                  编辑
                </a-doption>
                <a-doption @click="handlePermissions(role)">
                  <template #icon><icon-lock /></template>
                  权限
                </a-doption>
                <a-doption @click="handleDelete(role)" status="danger">
                  <template #icon><icon-delete /></template>
                  删除
                </a-doption>
              </template>
            </a-dropdown>
          </template>

          <p class="role-code">角色编码: {{ role.code }}</p>
          <p class="role-desc">{{ role.description || '暂无描述' }}</p>

          <div class="role-stats">
            <a-space size="large">
              <span>
                <icon-user /> {{ role.userCount || 0 }} 个用户
              </span>
              <span>
                <icon-lock /> {{ role.permissions?.length || 0 }} 个权限
              </span>
            </a-space>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <!-- Create/Edit Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑角色' : '新增角色'"
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
        <a-form-item field="code" label="角色编码">
          <a-input v-model="formData.code" placeholder="请输入角色编码（如：admin）" />
        </a-form-item>
        <a-form-item field="name" label="角色名称">
          <a-input v-model="formData.name" placeholder="请输入角色名称" />
        </a-form-item>
        <a-form-item field="description" label="描述">
          <a-textarea v-model="formData.description" placeholder="请输入描述" />
        </a-form-item>
        <a-form-item field="status" label="状态">
          <a-switch v-model="formData.status" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Assign Permissions Modal -->
    <a-modal
      v-model:visible="permissionsModalVisible"
      title="分配权限"
      :width="isMobile ? 'calc(100vw - 32px)' : 600"
      @ok="handleAssignPermissionsOk"
      @cancel="permissionsModalVisible = false"
    >
      <a-tree
        v-model:checked-keys="selectedPermissions"
        :data="permissionTree"
        checkable
        :default-expand-all="false"
      >
        <template #title="node">
          <a-space>
            <component :is="getPermissionIcon(node?.type)" />
            <span>{{ node?.title || node?.name }}</span>
            <a-tag v-if="node?.type" size="small">{{ getPermissionTypeLabel(node?.type) }}</a-tag>
          </a-space>
        </template>
      </a-tree>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { Message, Modal } from '@arco-design/web-vue'
import type { Form } from '@arco-design/web-vue'
import { roleApi, permissionApi } from '@/api'
import type { Role, Permission } from '@/types'

const loading = ref(false)
const roles = ref<Role[]>([])
const permissions = ref<Permission[]>([])

// 移动端检测
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const modalVisible = ref(false)
const permissionsModalVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const selectedPermissions = ref<string[]>([])
const formRef = ref<InstanceType<typeof Form>>()

const formData = reactive({
  code: '',
  name: '',
  description: '',
  status: true,
})

const formRules = {
  code: [{ required: true, message: '请输入角色编码' }],
  name: [{ required: true, message: '请输入角色名称' }],
}

const permissionTypeLabels: Record<string, string> = {
  menu: '菜单',
  api: '接口',
  button: '按钮',
}

const getPermissionTypeLabel = (type: string) => permissionTypeLabels[type] || type

const permissionTree = computed(() => {
  return permissions.value.map(p => ({
    key: String(p.id),
    title: p.name,
    name: p.name,
    type: p.type,
    children: p.children?.map(c => ({
      key: String(c.id),
      title: c.name,
      name: c.name,
      type: c.type,
    })) || [],
  }))
})

const getPermissionIcon = (type?: string) => {
  switch (type) {
    case 'menu':
      return 'icon-menu'
    case 'api':
      return 'icon-api'
    case 'button':
      return 'icon-button'
    default:
      return 'icon-lock'
  }
}

const fetchRoles = async () => {
  loading.value = true
  try {
    const data = await roleApi.getRoles()
    roles.value = data
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '获取角色列表失败'
    Message.error(msg)
  } finally {
    loading.value = false
  }
}

const fetchPermissions = async () => {
  try {
    const data = await permissionApi.getPermissions()
    permissions.value = data
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '获取权限列表失败'
    Message.error(msg)
  }
}

const handleCreate = () => {
  isEdit.value = false
  currentId.value = null
  formData.code = ''
  formData.name = ''
  formData.description = ''
  formData.status = true
  modalVisible.value = true
}

const handleAction = (val: string, role: Role) => {
  switch (val) {
    case 'edit':
      handleEdit(role)
      break
    case 'permissions':
      handlePermissions(role)
      break
    case 'delete':
      handleDelete(role)
      break
  }
}

const handleEdit = (role: Role) => {
  isEdit.value = true
  currentId.value = role.id
  formData.code = role.code
  formData.name = role.name
  formData.description = role.description || ''
  formData.status = role.status
  modalVisible.value = true
}

const handlePermissions = (role: Role) => {
  currentId.value = role.id
  // Tree key 是字符串，需要匹配
  selectedPermissions.value = role.permissions?.map(p => String(p.id)) || []
  console.log('Selected permissions:', selectedPermissions.value)
  permissionsModalVisible.value = true
}

const handleModalOk = async () => {
  const errors = await formRef.value?.validate()
  if (errors) return

  try {
    if (isEdit.value && currentId.value) {
      await roleApi.updateRole(String(currentId.value), formData)
      Message.success('角色更新成功')
    } else {
      await roleApi.createRole(formData)
      Message.success('角色创建成功')
    }
    modalVisible.value = false
    fetchRoles()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '保存角色失败'
    Message.error(msg)
  }
}

const handleModalCancel = () => {
  modalVisible.value = false
  formRef.value?.resetFields()
}

const handleDelete = (role: Role) => {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除角色 "${role.name}" 吗？`,
    onOk: async () => {
      try {
        await roleApi.deleteRole(role.id)
        Message.success('角色删除成功')
        fetchRoles()
      } catch (error: any) {
        const msg = error?.message || error?.response?.data?.message || '删除角色失败'
        Message.error(msg)
      }
    },
  })
}

const handleAssignPermissionsOk = async () => {
  if (!currentId.value) return
  try {
    await roleApi.assignPermissions(String(currentId.value), selectedPermissions.value)
    Message.success('权限分配成功')
    permissionsModalVisible.value = false
    fetchRoles()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '分配权限失败'
    Message.error(msg)
  }
}

onMounted(() => {
  fetchRoles()
  fetchPermissions()
})
</script>

<style scoped>
.role-management {
  .header-actions {
    margin-bottom: 16px;
  }

  .role-card {
    height: 100%;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    .role-code {
      color: var(--color-text-2);
      font-size: 12px;
      margin-bottom: 8px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-desc {
      color: var(--color-text-3);
      margin-bottom: 16px;
      min-height: 20px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .role-stats {
      padding-top: 16px;
      border-top: 1px solid var(--color-border);
      color: var(--color-text-2);
      font-size: 13px;
    }
  }
}

@media (max-width: 768px) {
  .role-management {
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    :deep(.arco-col) {
      width: 100%;
      flex: 0 0 100%;
      max-width: 100%;
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

  .role-card {
    .role-desc {
      max-width: 100%;
    }
  }
}
</style>
