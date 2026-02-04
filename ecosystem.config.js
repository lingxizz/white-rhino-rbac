module.exports = {
  apps: [
    {
      name: 'rbac-backend',
      cwd: '/root/.openclaw/workspace/rbac-system/rbac-backend',
      script: 'npm',
      args: 'run start:dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      },
      log_file: '/tmp/rbac-backend.log',
      out_file: '/tmp/rbac-backend-out.log',
      error_file: '/tmp/rbac-backend-error.log'
    },
    {
      name: 'rbac-frontend',
      cwd: '/root/.openclaw/workspace/rbac-system/rbac-frontend',
      script: 'npm',
      args: 'run dev -- --host 0.0.0.0 --port 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development'
      },
      log_file: '/tmp/rbac-frontend.log',
      out_file: '/tmp/rbac-frontend-out.log',
      error_file: '/tmp/rbac-frontend-error.log'
    }
  ]
}
