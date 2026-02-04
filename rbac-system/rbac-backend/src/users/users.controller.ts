import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Req } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AssignRolesDto } from './dto/assign-roles.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CasbinGuard } from '../casbin/guards/casbin.guard';
import { RequirePermission } from '../casbin/decorators/require-permission.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, CasbinGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @RequirePermission('user:create')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @RequirePermission('user:read')
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @RequirePermission('user:read')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(Number(id));
  }

  @Patch(':id')
  @RequirePermission('user:update')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(Number(id), updateUserDto);
  }

  @Delete(':id')
  @RequirePermission('user:delete')
  remove(@Param('id') id: string) {
    return this.usersService.remove(Number(id));
  }

  @Post(':id/roles')
  @RequirePermission('user:assignRoles')
  assignRoles(@Param('id') id: string, @Body() assignRolesDto: AssignRolesDto) {
    return this.usersService.assignRoles(Number(id), assignRolesDto);
  }

  @Get('profile/me')
  async getProfile(@Req() req) {
    return this.usersService.findOne(Number(req.user.userId));
  }

  @Patch('profile/me')
  async updateProfile(@Req() req, @Body() data: { nickname?: string; email?: string; phone?: string; avatar?: string }) {
    return this.usersService.updateProfile(Number(req.user.userId), data);
  }

  @Post('profile/change-password')
  async changePassword(@Req() req, @Body() data: { oldPassword: string; newPassword: string }) {
    const user = await this.usersService.findOne(Number(req.user.userId));
    const bcrypt = require('bcrypt');
    const isMatch = await bcrypt.compare(data.oldPassword, user.password);
    if (!isMatch) {
      throw new Error('Old password is incorrect');
    }
    await this.usersService.changePassword(Number(req.user.userId), data.newPassword);
    return { message: 'Password changed successfully' };
  }
}
