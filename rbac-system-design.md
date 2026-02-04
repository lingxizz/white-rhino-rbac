# RBAC 权限管理系统 - 架构设计方案

## 技术栈

| 层级 | 技术 | 选型理由 |
|------|------|----------|
| 前端 | Vue 3 + TypeScript + Pinia + Element Plus | 现代化组合，类型安全 |
| 后端 | NestJS + TypeORM + JWT | 模块化架构，企业级首选 |
| 数据库 | PostgreSQL 15+ | 高级特性支持，性能优秀 |
| 缓存 | Redis | 会话、权限缓存 |

---

## 核心功能模块

### 1. RBAC 数据模型

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│    User     │◄────┤ UserRole    │────►│    Role     │
│  (用户表)    │     │  (关联表)    │     │  (角色表)    │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                                               │
                                        ┌──────┴──────┐
                                        │ RolePermission│
                                        │   (关联表)    │
                                        └──────┬──────┘
                                               │
                                               │
                                        ┌──────┴──────┐
                                        │  Permission │
                                        │  (权限表)    │
                                        └─────────────┘
```

**核心表结构：**

```sql
-- 用户表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- active, disabled, locked
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 角色表
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL, -- 角色编码，如：admin, editor
    description TEXT,
    is_system BOOLEAN DEFAULT false, -- 系统内置角色不可删除
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 权限表（支持菜单、按钮、API 三种类型）
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) UNIQUE NOT NULL, -- 权限编码，如：user:create
    type VARCHAR(20) NOT NULL, -- menu, button, api
    parent_id UUID REFERENCES permissions(id), -- 父子结构
    path VARCHAR(255), -- 菜单路径或 API 路径
    icon VARCHAR(50), -- 菜单图标
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 用户-角色关联表
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, role_id)
);

-- 角色-权限关联表
CREATE TABLE role_permissions (
    role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (role_id, permission_id)
);
```

---

## 扩展性设计

### 1. 多租户支持（预留）

```sql
-- 在每张业务表添加 tenant_id
ALTER TABLE users ADD COLUMN tenant_id UUID;
ALTER TABLE roles ADD COLUMN tenant_id UUID;
-- 创建租户表
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(100) UNIQUE
);
```

### 2. 数据权限（行级）

```sql
-- 数据权限规则表
CREATE TABLE data_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID REFERENCES roles(id),
    resource_type VARCHAR(50), -- 如：order, user
    rule_type VARCHAR(20), -- own, dept, all, custom
    custom_rule JSONB -- 自定义规则
);
```

### 3. 操作日志审计

```sql
CREATE TABLE operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(50), -- CREATE, UPDATE, DELETE, LOGIN
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    old_value JSONB,
    new_value JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API 设计（RESTful）

### 认证模块

```
POST   /api/v1/auth/login              # 登录
POST   /api/v1/auth/logout             # 登出
POST   /api/v1/auth/refresh            # 刷新 Token
GET    /api/v1/auth/profile            # 获取当前用户信息
PUT    /api/v1/auth/password           # 修改密码
```

### 用户管理

```
GET    /api/v1/users                   # 用户列表（分页+搜索）
POST   /api/v1/users                   # 创建用户
GET    /api/v1/users/:id               # 用户详情
PUT    /api/v1/users/:id               # 更新用户
DELETE /api/v1/users/:id               # 删除用户
PUT    /api/v1/users/:id/roles         # 分配角色
PUT    /api/v1/users/:id/status        # 启用/禁用
```

### 角色管理

```
GET    /api/v1/roles                   # 角色列表
POST   /api/v1/roles                   # 创建角色
GET    /api/v1/roles/:id               # 角色详情
PUT    /api/v1/roles/:id               # 更新角色
DELETE /api/v1/roles/:id               # 删除角色
PUT    /api/v1/roles/:id/permissions   # 分配权限
```

### 权限管理

```
GET    /api/v1/permissions             # 权限树（菜单树）
POST   /api/v1/permissions             # 创建权限
PUT    /api/v1/permissions/:id         # 更新权限
DELETE /api/v1/permissions/:id         # 删除权限
```

---

## 前端架构

### 目录结构

```
frontend/
├── src/
│   ├── api/                    # API 封装
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── role.ts
│   │   └── permission.ts
│   ├── components/             # 公共组件
│   │   ├── Layout/
│   │   │   ├── Sidebar.vue     # 动态菜单
│   │   │   ├── Header.vue      # 顶部栏
│   │   │   └── index.vue
│   │   ├── Permission/         # 权限控制组件
│   │   │   ├── v-permission.ts # 指令权限
│   │   │   └── AuthButton.vue  # 按钮权限
│   │   └── Table/              # 通用表格
│   ├── views/                  # 页面
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── system/
│   │   │   ├── user/
│   │   │   ├── role/
│   │   │   └── permission/
│   │   └── profile/
│   ├── router/
│   │   ├── index.ts
│   │   └── guard.ts            # 路由守卫
│   ├── store/                  # Pinia Store
│   │   ├── user.ts             # 用户信息
│   │   ├── permission.ts       # 权限菜单
│   │   └── app.ts              # 应用状态
│   ├── utils/
│   │   ├── request.ts          # Axios 封装
│   │   ├── auth.ts             # Token 管理
│   │   └── permission.ts       # 权限校验工具
│   └── App.vue
├── package.json
└── vite.config.ts
```

### 核心功能实现

#### 1. 动态路由 + 菜单

```typescript
// router/guard.ts
router.beforeEach(async (to, from, next) => {
  const token = getToken();
  
  if (to.path === '/login') {
    token ? next('/') : next();
    return;
  }
  
  if (!token) {
    next('/login');
    return;
  }
  
  // 获取用户信息和权限菜单
  const userStore = useUserStore();
  if (!userStore.permissions.length) {
    await userStore.fetchUserInfo();
    await userStore.fetchPermissionMenus();
    
    // 动态添加路由
    const asyncRoutes = generateRoutes(userStore.menus);
    asyncRoutes.forEach(route => router.addRoute(route));
    
    next({ ...to, replace: true });
  } else {
    next();
  }
});
```

#### 2. 权限指令

```typescript
// directives/permission.ts
import { Directive } from 'vue';

export const permission: Directive = {
  mounted(el, binding) {
    const { value } = binding;
    const userStore = useUserStore();
    const hasPermission = userStore.permissions.includes(value);
    
    if (!hasPermission) {
      el.parentNode?.removeChild(el);
    }
  }
};

// 使用：<el-button v-permission="'user:create'">新增</el-button>
```

---

## 界面设计建议

### 风格：现代化 Admin Dashboard

- **UI 库**: Element Plus / Ant Design Vue 3
- **配色**: 深蓝/紫色主色调 + 亮色背景
- **布局**: 侧边栏 + 顶部栏 + 内容区
- **响应式**: 支持移动端折叠菜单

### 关键页面

1. **登录页** - 居中卡片，渐变背景，简洁大气
2. **Dashboard** - 数据卡片 + 图表 + 快捷入口
3. **用户管理** - 表格 + 筛选 + 批量操作 + 分页
4. **角色管理** - 卡片列表 + 权限树选择
5. **权限管理** - 树形表格 + 拖拽排序

### 推荐组件库搭配

```json
{
  "dependencies": {
    "vue": "^3.4.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "element-plus": "^2.5.0",
    "@element-plus/icons-vue": "^2.3.0",
    "axios": "^1.6.0",
    "@vueuse/core": "^10.7.0"
  }
}
```

---

## 后端架构建议

### NestJS 模块划分

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/               # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── guards/
│   │   │   │   ├── jwt.guard.ts
│   │   │   │   └── permission.guard.ts
│   │   │   └── strategies/
│   │   │       └── jwt.strategy.ts
│   │   ├── user/               # 用户模块
│   │   ├── role/               # 角色模块
│   │   ├── permission/         # 权限模块
│   │   └── log/                # 日志模块
│   ├── common/                 # 公共工具
│   │   ├── decorators/         # 装饰器
│   │   ├── filters/            # 异常过滤器
│   │   └── interceptors/       # 拦截器
│   ├── database/
│   │   └── database.module.ts  # TypeORM 配置
│   └── main.ts
├── package.json
└── docker-compose.yml
```

### 核心装饰器

```typescript
// 权限装饰器
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class UserController {
  
  @Get()
  @RequirePermission('user:read')  // 需要 user:read 权限
  findAll() {
    return this.userService.findAll();
  }
  
  @Post()
  @RequirePermission('user:create')
  create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }
}
```

---

## 推荐实现顺序

1. **基础框架搭建** - NestJS + TypeORM + PostgreSQL 连接
2. **认证模块** - JWT 登录/登出/刷新 Token
3. **权限模型** - 用户/角色/权限表 + 关联关系
4. **用户管理 API** - CRUD + 分配角色
5. **角色管理 API** - CRUD + 分配权限
6. **权限管理 API** - 菜单树管理
7. **前端基础** - Vue 3 项目 + 路由 + Axios
8. **登录页面** - 表单验证 + Token 存储
9. **Layout 布局** - 动态菜单 + 顶部栏
10. **各管理页面** - 用户/角色/权限管理界面

---

需要我从零开始逐步实现这个系统吗？我可以按上面的顺序，先搭后端框架，再搞前端界面。🦀
