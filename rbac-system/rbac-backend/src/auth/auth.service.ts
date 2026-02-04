import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { CasbinService } from '../casbin/casbin.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private casbinService: CasbinService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.status) {
      throw new UnauthorizedException('User account is disabled');
    }

    const payload = { 
      username: user.username, 
      sub: user.id,
      roles: user.roles.map(r => r.code),
    };

    // Sync user roles to Casbin
    await this.casbinService.syncUserRoles(user.id, user.roles);

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        nickname: user.nickname,
        email: user.email,
        avatar: user.avatar,
        roles: user.roles.map(r => ({ id: r.id, name: r.name, code: r.code })),
      },
    };
  }

  async getProfile(userId: number) {
    const user = await this.usersService.findOne(userId);
    const { password, ...result } = user;
    return result;
  }
}
