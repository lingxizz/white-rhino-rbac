import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { Role } from '../roles/entities/role.entity';
import { Permission, PermissionType } from '../permissions/entities/permission.entity';

@Injectable()
export class DatabaseSeeder implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Role)
    private roleRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionRepository: Repository<Permission>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    try {
      // Check if data already exists
      const adminExists = await this.userRepository.findOne({
        where: { username: 'admin' },
      });

      if (adminExists) {
        console.log('Database already seeded, skipping...');
        return;
      }

      console.log('Starting database seeding...');

      // Create permissions
      const permissions = await this.createPermissions();
      console.log(`Created ${permissions.length} permissions`);

      // Create roles
      const roles = await this.createRoles(permissions);
      console.log(`Created ${roles.length} roles`);

      // Create admin user
      await this.createAdminUser(roles);
      console.log('Created admin user');

      console.log('Database seeding completed successfully!');
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  }

  private async createPermissions(): Promise<Permission[]> {
    const permissionData = [
      // Dashboard
      { name: 'Dashboard', code: 'dashboard', type: PermissionType.MENU, path: '/dashboard', component: 'Dashboard', icon: 'icon-dashboard', sortOrder: 1 },
      
      // System Management
      { name: 'System', code: 'system', type: PermissionType.MENU, path: '/system', component: 'Layout', icon: 'icon-settings', sortOrder: 2 },
      { name: 'User Management', code: 'user:menu', type: PermissionType.MENU, path: '/system/users', component: 'system/user/index', icon: 'icon-user', sortOrder: 1, parentCode: 'system' },
      { name: 'Role Management', code: 'role:menu', type: PermissionType.MENU, path: '/system/roles', component: 'system/role/index', icon: 'icon-safe', sortOrder: 2, parentCode: 'system' },
      { name: 'Permission Management', code: 'permission:menu', type: PermissionType.MENU, path: '/system/permissions', component: 'system/permission/index', icon: 'icon-lock', sortOrder: 3, parentCode: 'system' },
      
      // User API permissions
      { name: 'User Create', code: 'user:create', type: PermissionType.API },
      { name: 'User Read', code: 'user:read', type: PermissionType.API },
      { name: 'User Update', code: 'user:update', type: PermissionType.API },
      { name: 'User Delete', code: 'user:delete', type: PermissionType.API },
      { name: 'User Assign Roles', code: 'user:assignRoles', type: PermissionType.API },
      
      // Role API permissions
      { name: 'Role Create', code: 'role:create', type: PermissionType.API },
      { name: 'Role Read', code: 'role:read', type: PermissionType.API },
      { name: 'Role Update', code: 'role:update', type: PermissionType.API },
      { name: 'Role Delete', code: 'role:delete', type: PermissionType.API },
      { name: 'Role Assign Permissions', code: 'role:assignPermissions', type: PermissionType.API },
      
      // Permission API permissions
      { name: 'Permission Create', code: 'permission:create', type: PermissionType.API },
      { name: 'Permission Read', code: 'permission:read', type: PermissionType.API },
      { name: 'Permission Update', code: 'permission:update', type: PermissionType.API },
      { name: 'Permission Delete', code: 'permission:delete', type: PermissionType.API },
    ];

    const permissions: Permission[] = [];
    const menuMap = new Map<string, Permission>();

    // Create menu permissions first
    for (const data of permissionData.filter(p => p.type === PermissionType.MENU)) {
      const permission = this.permissionRepository.create({
        name: data.name,
        code: data.code,
        type: data.type,
        path: data.path,
        component: data.component,
        icon: data.icon,
        sortOrder: data.sortOrder,
        status: true,
      });
      
      if (data.parentCode) {
        const parent = menuMap.get(data.parentCode);
        if (parent) {
          permission.parent = parent;
        }
      }
      
      const saved = await this.permissionRepository.save(permission);
      menuMap.set(data.code, saved);
      permissions.push(saved);
    }

    // Create API permissions
    for (const data of permissionData.filter(p => p.type === PermissionType.API)) {
      const permission = this.permissionRepository.create({
        name: data.name,
        code: data.code,
        type: data.type,
        status: true,
      });
      const saved = await this.permissionRepository.save(permission);
      permissions.push(saved);
    }

    return permissions;
  }

  private async createRoles(permissions: Permission[]): Promise<Role[]> {
    const roles: Role[] = [];

    // Admin role - has all permissions
    const adminRole = this.roleRepository.create({
      code: 'admin',
      name: 'Administrator',
      description: 'System administrator with full access',
      status: true,
      permissions: permissions,
    });
    roles.push(await this.roleRepository.save(adminRole));

    // User role - has limited permissions
    const userPermissions = permissions.filter(p => 
      p.code === 'dashboard' || 
      p.code === 'user:read' ||
      p.code === 'role:read'
    );
    
    const userRole = this.roleRepository.create({
      code: 'user',
      name: 'User',
      description: 'Regular user with limited access',
      status: true,
      permissions: userPermissions,
    });
    roles.push(await this.roleRepository.save(userRole));

    return roles;
  }

  private async createAdminUser(roles: Role[]): Promise<void> {
    const adminRole = roles.find(r => r.code === 'admin');
    
    const adminUser = this.userRepository.create({
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      nickname: 'Administrator',
      email: 'admin@example.com',
      phone: '13800138000',
      status: true,
      roles: adminRole ? [adminRole] : [],
    });

    await this.userRepository.save(adminUser);
  }
}
