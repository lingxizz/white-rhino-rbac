module.exports = {
  apps: [
    {
      name: 'rbac-backend',
      cwd: './rbac-backend',
      script: 'npm',
      args: 'run start:dev',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3001
      }
    },
    {
      name: 'rbac-frontend',
      cwd: './rbac-frontend',
      script: 'npm',
      args: 'run dev -- --host 0.0.0.0 --port 3000',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'development'
      }
    }
  ]
}
