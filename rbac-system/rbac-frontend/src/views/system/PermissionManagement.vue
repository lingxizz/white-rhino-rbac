<template>
  <div class="permission-management">
    <!-- Header -->
    <a-space class="header-actions" size="medium">
      <a-button type="primary" @click="handleCreate">
        <template #icon><icon-plus /></template>
        新增权限
      </a-button>
    </a-space>

    <!-- Permission Table -->
    <a-table
      :data="tableData"
      :loading="loading"
      :pagination="false"
      :expanded-row-keys="expandedRowKeys"
      @expand="handleExpand"
      row-key="id"
    >
      <template #columns>
        <a-table-column title="名称" data-index="name">
          <template #cell="{ record }">
            <a-space>
              <component :is="getTypeIcon(record.type)" :style="{ color: getTypeColor(record.type) }" />
              <span>{{ record.name }}</span>
            </a-space>
          </template>
        </a-table-column>

        <a-table-column title="编码" data-index="code" />

        <a-table-column title="类型">
          <template #cell="{ record }">
            <a-tag :color="getTypeColor(record.type)">
              {{ getTypeLabel(record.type) }}
            </a-tag>
          </template>
        </a-table-column>

        <a-table-column title="路径" data-index="path">
          <template #cell="{ record }">
            <span class="path-text">{{ record.path || '-' }}</span>
          </template>
        </a-table-column>

        <a-table-column title="排序" data-index="sortOrder" width="80" />

        <a-table-column title="状态" width="100">
          <template #cell="{ record }">
            <a-badge
              :status="record.status ? 'success' : 'danger'"
              :text="record.status ? '启用' : '禁用'"
            />
          </template>
        </a-table-column>

        <a-table-column title="操作" width="180">
          <template #cell="{ record }">
            <a-space>
              <a-button type="text" size="small" @click="handleCreateChild(record)">添加子项</a-button>
              <a-button type="text" size="small" @click="handleEdit(record)">编辑</a-button>
              <a-popconfirm
                content="确定要删除这个权限吗？"
                @ok="handleDelete(record)"
              >
                <a-button type="text" status="danger" size="small">删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </a-table-column>
      </template>
    </a-table>

    <!-- Create/Edit Modal -->
    <a-modal
      v-model:visible="modalVisible"
      :title="isEdit ? '编辑权限' : '新增权限'"
      @ok="handleModalOk"
      @cancel="handleModalCancel"
      :width="isMobile ? 'calc(100vw - 32px)' : 520"
      :body-style="{ maxHeight: 'calc(90vh - 120px)', overflowY: 'auto' }"
    >
      <a-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        layout="vertical"
      >
        <a-form-item field="name" label="名称">
          <a-input v-model="formData.name" placeholder="请输入权限名称" />
        </a-form-item>

        <a-form-item field="code" label="编码">
          <a-input v-model="formData.code" placeholder="请输入权限编码" />
        </a-form-item>

        <a-form-item field="type" label="类型">
          <a-select v-model="formData.type" placeholder="请选择类型">
            <a-option value="menu">菜单</a-option>
            <a-option value="api">接口</a-option>
            <a-option value="button">按钮</a-option>
          </a-select>
        </a-form-item>

        <template v-if="formData.type === 'menu'">
          <a-form-item field="path" label="路径">
            <a-input v-model="formData.path" placeholder="请输入路由路径（如：/system/users）" />
          </a-form-item>

          <a-form-item field="component" label="组件">
            <a-input v-model="formData.component" placeholder="请输入组件路径" />
          </a-form-item>

          <a-form-item field="icon" label="图标">
            <a-input v-model="formData.icon" placeholder="请输入图标名称" />
          </a-form-item>
        </template>

        <a-form-item field="sortOrder" label="排序">
          <a-input-number v-model="formData.sortOrder" :min="0" />
        </a-form-item>

        <a-form-item field="status" label="状态">
          <a-switch v-model="formData.status" />
        </a-form-item>

        <a-form-item field="description" label="描述">
          <a-textarea v-model="formData.description" placeholder="请输入描述" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useWindowSize } from '@vueuse/core'
import { Message } from '@arco-design/web-vue'
import type { Form } from '@arco-design/web-vue'
import { permissionApi } from '@/api'
import type { Permission } from '@/types'

const loading = ref(false)
const permissions = ref<Permission[]>([])
const expandedRowKeys = ref<number[]>([])

// 移动端检测
const { width } = useWindowSize()
const isMobile = computed(() => width.value < 768)

const modalVisible = ref(false)
const isEdit = ref(false)
const currentId = ref<number | null>(null)
const parentId = ref<number | undefined>(undefined)
const formRef = ref<InstanceType<typeof Form>>()

const formData = reactive({
  name: '',
  code: '',
  type: 'menu',
  path: '',
  component: '',
  icon: '',
  sortOrder: 0,
  status: true,
  description: '',
})

const formRules = {
  name: [{ required: true, message: '请输入权限名称' }],
}

const typeLabels: Record<string, string> = {
  menu: '菜单',
  api: '接口',
  button: '按钮',
}

const getTypeLabel = (type?: string) => typeLabels[type || ''] || type || '-'

const tableData = computed(() => {
  return permissions.value
})

const handleExpand = (rowKey: number, expanded: boolean) => {
  if (expanded) {
    if (!expandedRowKeys.value.includes(rowKey)) {
      expandedRowKeys.value.push(rowKey)
    }
  } else {
    expandedRowKeys.value = expandedRowKeys.value.filter(key => key !== rowKey)
  }
}

const getTypeIcon = (type?: string) => {
  switch (type) {
    case 'menu':
      return 'icon-menu'
    case 'api':
      return 'icon-api'
    case 'button':
      return 'icon-desktop'
    default:
      return 'icon-lock'
  }
}

const getTypeColor = (type?: string) => {
  switch (type) {
    case 'menu':
      return 'arcoblue'
    case 'api':
      return 'green'
    case 'button':
      return 'orange'
    default:
      return 'gray'
  }
}

const fetchPermissions = async () => {
  loading.value = true
  try {
    const data = await permissionApi.getPermissions()
    permissions.value = data
    // Expand all by default - convert id to number
    expandedRowKeys.value = data.map(p => Number(p.id))
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '获取权限列表失败'
    Message.error(msg)
  } finally {
    loading.value = false
  }
}

const resetForm = () => {
  formData.name = ''
  formData.code = ''
  formData.type = 'menu'
  formData.path = ''
  formData.component = ''
  formData.icon = ''
  formData.sortOrder = 0
  formData.status = true
  formData.description = ''
  parentId.value = undefined
}

const handleCreate = () => {
  isEdit.value = false
  currentId.value = null
  resetForm()
  modalVisible.value = true
}

const handleCreateChild = (record: Permission) => {
  isEdit.value = false
  currentId.value = null
  resetForm()
  parentId.value = Number(record.id)
  modalVisible.value = true
}

const handleEdit = (record: Permission) => {
  isEdit.value = true
  currentId.value = Number(record.id)
  parentId.value = record.parent?.id ? Number(record.parent.id) : undefined
  formData.name = record.name
  formData.code = record.code || ''
  formData.type = record.type
  formData.path = record.path || ''
  formData.component = record.component || ''
  formData.icon = record.icon || ''
  formData.sortOrder = record.sortOrder
  formData.status = record.status
  formData.description = record.description || ''
  modalVisible.value = true
}

const handleModalOk = async () => {
  const errors = await formRef.value?.validate()
  if (errors) return

  try {
    const data = { ...formData } as any
    if (parentId.value) {
      data.parentId = parentId.value
    }

    if (isEdit.value && currentId.value) {
      await permissionApi.updatePermission(String(currentId.value), data)
      Message.success('权限更新成功')
    } else {
      await permissionApi.createPermission(data)
      Message.success('权限创建成功')
    }
    modalVisible.value = false
    fetchPermissions()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '保存权限失败'
    Message.error(msg)
  }
}

const handleModalCancel = () => {
  modalVisible.value = false
  formRef.value?.resetFields()
}

const handleDelete = async (record: Permission) => {
  try {
    await permissionApi.deletePermission(String(record.id))
    Message.success('权限删除成功')
    fetchPermissions()
  } catch (error: any) {
    const msg = error?.message || error?.response?.data?.message || '删除权限失败'
    Message.error(msg)
  }
}

onMounted(() => {
  fetchPermissions()
})
</script>

<style scoped>
.permission-management {
  .header-actions {
    margin-bottom: 16px;
  }

  .path-text {
    font-family: monospace;
    color: var(--color-text-2);
    font-size: 13px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 200px;
    display: inline-block;
  }
}

/* Text truncation for table cells */
:deep(.arco-table-cell) {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

@media (max-width: 768px) {
  .permission-management {
    .header-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    /* 移动端表格横向滚动 */
    :deep(.arco-table-container) {
      overflow-x: auto;
      -webkit-overflow-scrolling: touch;
    }

    :deep(.arco-table) {
      min-width: 500px;
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

  :deep(.arco-table-cell) {
    max-width: none;
    font-size: 13px;
  }

  .path-text {
    max-width: 150px;
  }

}
</style>
