# 🦏 白犀牛权限管理系统 (White Rhino RBAC)

一个基于 **Vue3 + NestJS + PostgreSQL + Casbin** 的现代化 RBAC 权限管理系统。

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ 特性

- 🔐 **JWT 认证** - 安全的 Token 登录机制
- 🎨 **蓝紫主题** - 统一的视觉设计 (#6366f1 ~ #8b5cf6)
- 📱 **移动端适配** - 全面响应式设计
- 🌳 **树形权限** - 支持菜单/API/按钮三级权限结构
- ⚡ **PM2 部署** - 生产级进程管理
- 🌍 **中文界面** - 完整本地化

## 🛠 技术栈

### 前端
| 技术 | 版本 | 说明 |
|------|------|------|
| Vue | 3.4+ | 渐进式框架 |
| TypeScript | 5.x | 类型安全 |
| Arco Design Vue | 2.x | UI 组件库 |
| Pinia | 2.x | 状态管理 |
| Vue Router | 4.x | 路由管理 |
| Vite | 5.x | 构建工具 |

### 后端
| 技术 | 版本 | 说明 |
|------|------|------|
| NestJS | 10.x | Node 框架 |
| TypeScript | 5.x | 类型安全 |
| TypeORM | 0.3.x | ORM 框架 |
| PostgreSQL | 15+ | 数据库 |
| Casbin | 5.x | 权限引擎 |
| JWT | - | 认证机制 |
| bcryptjs | - | 密码加密 |

## 📁 项目结构

```
rbac-system/
├── rbac-backend/          # NestJS 后端
│   ├── src/
│   │   ├── auth/          # JWT 认证模块
│   │   ├── casbin/        # 权限引擎
│   │   ├── users/         # 用户管理
│   │   ├── roles/         # 角色管理
│   │   └── permissions/   # 权限管理 (树形)
│   └── public/            # 前端构建产物
│
├── rbac-frontend/         # Vue3 前端
│   ├── src/
│   │   ├── api/           # API 接口
│   │   ├── components/    # 公共组件
│   │   ├── router/        # 路由配置
│   │   ├── store/         # Pinia 状态管理
│   │   ├── types/         # TypeScript 类型
│   │   ├── views/         # 页面视图
│   │   └── styles/        # 全局样式
│   └── public/            # 静态资源 (白犀牛 Logo)
│
└── ecosystem.config.js    # PM2 进程配置
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- PostgreSQL 15+
- npm 或 pnpm

### 1. 克隆项目

```bash
git clone https://github.com/lingxizz/white-rhino-rbac.git
cd rbac-system
```

### 2. 配置数据库

```bash
# 创建 PostgreSQL 数据库
createdb rbac_db

# 配置后端环境变量
cd rbac-backend
cp .env.example .env
# 编辑 .env 修改数据库配置
```

### 3. 安装依赖

```bash
# 安装后端依赖
cd rbac-backend
npm install

# 安装前端依赖
cd ../rbac-frontend
npm install
```

### 4. 启动开发服务器

```bash
# 方式一：手动启动
cd rbac-backend && npm run start:dev
cd rbac-frontend && npm run dev

# 方式二：PM2 启动 (推荐)
pm2 start ecosystem.config.js
```

### 5. 访问系统

- 前端: http://localhost:3000
- 后端 API: http://localhost:3001

**默认账号:**
- 用户名: `admin`
- 密码: `admin123`

## 📝 功能模块

### 用户管理
- ✅ 用户 CRUD 操作
- ✅ 分配角色
- ✅ 密码修改
- ✅ 头像上传 (预留)

### 角色管理
- ✅ 角色 CRUD 操作
- ✅ 分配权限 (树形选择)
- ✅ 状态管理

### 权限管理
- ✅ 三级权限类型: 菜单 / 接口 / 按钮
- ✅ 树形结构展示
- ✅ 父子级关联
- ✅ 展开/折叠交互

### 个人中心
- ✅ 个人信息展示
- ✅ 修改密码

## 🔧 部署配置

### PM2 配置文件 (`ecosystem.config.js`)

```javascript
module.exports = {
  apps: [
    {
      name: 'rbac-backend',
      script: 'npm',
      args: 'run start:dev',
      cwd: './rbac-backend',
      instances: 1,
      autorestart: true,
    },
    {
      name: 'rbac-frontend',
      script: 'npm',
      args: 'run dev -- --host 0.0.0.0 --port 3000',
      cwd: './rbac-frontend',
      instances: 1,
      autorestart: true,
    }
  ]
}
```

### 常用命令

```bash
# 查看状态
pm2 status

# 查看日志
pm2 logs

# 重启服务
pm2 restart all

# 停止服务
pm2 stop all

# 开机自启
pm2 startup
pm2 save
```

## 🎨 设计规范

### 颜色主题
```css
--primary-gradient: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
--primary-blue: #165dff;
--success: #00b42a;
--warning: #ff7d00;
--danger: #f53f3f;
```

### 响应式断点
- Desktop: > 768px
- Mobile: ≤ 768px

## 📄 许可证

[MIT License](LICENSE)

## 🙏 致谢

- [NestJS](https://nestjs.com/)
- [Vue.js](https://vuejs.org/)
- [Arco Design](https://arco.design/)
- [Casbin](https://casbin.org/)

---

**白犀牛 🦏** -  Enterprise RBAC Solution
