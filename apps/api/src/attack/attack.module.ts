import { Module } from '@nestjs/common';
import { AttackController } from './service/attack.controller';

@Module({
  controllers: [AttackController]
})
export class AttackModule {}
