import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Query } from '@nestjs/common';
import { PermissionsService } from './permissions.service';
import { CreatePermissionDto } from './dto/create-permission.dto';
import { UpdatePermissionDto } from './dto/update-permission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CasbinGuard } from '../casbin/guards/casbin.guard';
import { RequirePermission } from '../casbin/decorators/require-permission.decorator';

@Controller('permissions')
@UseGuards(JwtAuthGuard, CasbinGuard)
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  @Post()
  @RequirePermission('permission:create')
  create(@Body() createPermissionDto: CreatePermissionDto) {
    return this.permissionsService.create(createPermissionDto);
  }

  @Get()
  @RequirePermission('permission:read')
  findAll(@Query('flat') flat?: string) {
    if (flat === 'true') {
      return this.permissionsService.findAllFlat();
    }
    return this.permissionsService.findAll();
  }

  @Get('menu/tree')
  @RequirePermission('permission:read')
  findMenuTree() {
    return this.permissionsService.findMenuTree();
  }

  @Get(':id')
  @RequirePermission('permission:read')
  findOne(@Param('id') id: string) {
    return this.permissionsService.findOne(Number(id));
  }

  @Patch(':id')
  @RequirePermission('permission:update')
  update(@Param('id') id: string, @Body() updatePermissionDto: UpdatePermissionDto) {
    return this.permissionsService.update(Number(id), updatePermissionDto);
  }

  @Delete(':id')
  @RequirePermission('permission:delete')
  remove(@Param('id') id: string) {
    return this.permissionsService.remove(Number(id));
  }
}
