import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, TreeRepository } from 'typeorm';
import { Permission, PermissionType } from './entities/permission.entity';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';

@Injectable()
export class PermissionsService {
  constructor(
    @InjectRepository(Permission)
    private permissionRepository: TreeRepository<Permission>,
  ) {}

  async create(createPermissionDto: CreatePermissionDto): Promise<Permission> {
    const permission = this.permissionRepository.create(createPermissionDto);
    
    if (createPermissionDto.parentId) {
      const parent = await this.permissionRepository.findOne({
        where: { id: Number(createPermissionDto.parentId) },
      });
      if (parent) {
        permission.parent = parent;
      }
    }

    return this.permissionRepository.save(permission);
  }

  async findAll(): Promise<Permission[]> {
    const trees = await this.permissionRepository.findTrees({
      relations: ['children'],
    });
    return trees;
  }

  async findAllFlat(): Promise<Permission[]> {
    return this.permissionRepository.find({
      relations: ['parent'],
    });
  }

  async findOne(id: number): Promise<Permission> {
    const permission = await this.permissionRepository.findOne({
      where: { id },
      relations: ['parent', 'children'],
    });

    if (!permission) {
      throw new NotFoundException('Permission not found');
    }

    return permission;
  }

  async findMenuTree(): Promise<Permission[]> {
    const allMenus = await this.permissionRepository.find({
      where: { type: PermissionType.MENU, status: true },
    });
    
    return this.permissionRepository.findTrees();
  }

  async update(id: number, updatePermissionDto: UpdatePermissionDto): Promise<Permission> {
    const permission = await this.findOne(id);
    
    if (updatePermissionDto.parentId) {
      const parent = await this.permissionRepository.findOne({
        where: { id: Number(updatePermissionDto.parentId) },
      });
      if (parent) {
        permission.parent = parent;
      }
    }

    Object.assign(permission, updatePermissionDto);
    return this.permissionRepository.save(permission);
  }

  async remove(id: number): Promise<void> {
    const permission = await this.findOne(id);
    await this.permissionRepository.softRemove(permission);
  }
}
