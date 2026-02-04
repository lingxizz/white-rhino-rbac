import { Module, Global } from '@nestjs/common';
import { CasbinService } from './casbin.service';
import { CasbinGuard } from './guards/casbin.guard';

@Global()
@Module({
  providers: [CasbinService, CasbinGuard],
  exports: [CasbinService, CasbinGuard],
})
export class CasbinModule {}
