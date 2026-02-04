import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CasbinService } from '../casbin.service';
import { REQUIRE_PERMISSION_KEY } from '../decorators/require-permission.decorator';

@Injectable()
export class CasbinGuard implements CanActivate {
  private readonly logger = new Logger(CasbinGuard.name);
  
  constructor(
    private reflector: Reflector,
    private casbinService: CasbinService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermission = this.reflector.getAllAndOverride<string>(
      REQUIRE_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermission) {
      return true; // No permission required
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    this.logger.debug(`[权限检查] 需要权限: ${requiredPermission}, 用户: ${user?.userId}, 角色: ${JSON.stringify(user?.roles)}`);

    if (!user) {
      this.logger.warn('[权限检查] 失败: 无用户信息');
      return false;
    }

    // Super admin bypass (admin role bypasses all checks)
    const roles = user.roles || [];
    const isAdmin = Array.isArray(roles) 
      ? roles.some(r => r === 'admin' || (typeof r === 'object' && r.code === 'admin'))
      : false;
    
    if (isAdmin) {
      this.logger.debug('[权限检查] 通过: Admin  bypass');
      return true;
    }

    // Check permission using Casbin (check userId directly, Casbin RBAC handles role inheritance)
    const [resource, action] = requiredPermission.split(':');
    const path = `/api/${resource}s`;
    
    this.logger.debug(`[权限检查] Casbin检查: subject=${user.userId}, obj=${path}, act=${action.toUpperCase()}`);
    
    const hasPermission = await this.casbinService.checkPermission(user.userId, path, action.toUpperCase());
    
    this.logger.debug(`[权限检查] 结果: ${hasPermission ? '通过' : '拒绝'}`);
    
    return hasPermission;
  }
}
