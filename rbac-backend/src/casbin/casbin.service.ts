import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as casbin from 'casbin';

@Injectable()
export class CasbinService implements OnModuleInit {
  private enforcer: casbin.Enforcer;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.initEnforcer();
  }

  private async initEnforcer() {
    // Use file adapter for simplicity
    const model = `
    [request_definition]
    r = sub, obj, act

    [policy_definition]
    p = sub, obj, act

    [role_definition]
    g = _, _

    [policy_effect]
    e = some(where (p.eft == allow))

    [matchers]
    m = g(r.sub, p.sub) && keyMatch2(r.obj, p.obj) && (r.act == p.act || p.act == '*')
    `;

    const m = new casbin.Model();
    m.loadModelFromText(model);
    this.enforcer = await casbin.newEnforcer(m);
    
    // Add default admin policies
    await this.addDefaultPolicies();
  }

  private async addDefaultPolicies() {
    // Admin role has all permissions
    await this.enforcer.addPolicy('admin', '*', '*');
    
    // User role policies - 普通用户可以查看但不能修改
    await this.enforcer.addPolicy('user', '/api/auth/profile', 'GET');
    await this.enforcer.addPolicy('user', '/api/users/profile/*', '*');
    await this.enforcer.addPolicy('user', '/api/users', 'GET');           // 查看用户列表
    await this.enforcer.addPolicy('user', '/api/users/:id', 'GET');       // 查看单个用户
    await this.enforcer.addPolicy('user', '/api/roles', 'GET');           // 查看角色列表
    await this.enforcer.addPolicy('user', '/api/roles/:id', 'GET');       // 查看单个角色
    await this.enforcer.addPolicy('user', '/api/permissions', 'GET');     // 查看权限列表
    
    // Manager 角色 - 可以管理用户和角色但不能删除
    await this.enforcer.addPolicy('manager', '/api/users', '*');
    await this.enforcer.addPolicy('manager', '/api/users/:id', '*');
    await this.enforcer.addPolicy('manager', '/api/roles', '*');
    await this.enforcer.addPolicy('manager', '/api/roles/:id', '*');
    await this.enforcer.addPolicy('manager', '/api/permissions', 'GET');
  }

  async syncUserRoles(userId: string, roles: any[]) {
    // Remove existing user-role mappings
    await this.enforcer.deleteRolesForUser(userId);
    
    // Add new role mappings
    for (const role of roles) {
      await this.enforcer.addRoleForUser(userId, role.code);
    }
  }

  async checkPermission(subject: string, path: string, action: string): Promise<boolean> {
    return this.enforcer.enforce(subject, path, action);
  }

  async addPolicy(role: string, path: string, action: string) {
    return this.enforcer.addPolicy(role, path, action);
  }

  async removePolicy(role: string, path: string, action: string) {
    return this.enforcer.removePolicy(role, path, action);
  }
}
