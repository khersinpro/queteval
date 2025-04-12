import { Module } from '@nestjs/common';
import { UnitController } from './controller/unit.controller';
import { UnitService } from './service/unit.service';

@Module({
  controllers: [UnitController],
  providers: [UnitService]
})
export class UnitModule {}
