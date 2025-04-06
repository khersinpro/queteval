import { Module } from '@nestjs/common';
import { MysqlModule } from './mysql/mysql.module';
import { MongoModule } from './mongodb/mongodb.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { environment } from './config/environement';
import { AuthModule } from './auth/auth.module';
import { VillageModule } from './village/village.module';
import { GameConfigModule } from './game-config/game-config.module';
import { BuildingModule } from './building/building.module';
import { GameEventModule } from './game-event/game-event.module';
import { AttackService } from './attack/controller/attack.service';
import { AttackModule } from './attack/attack.module';
import { UnitModule } from './unit/unit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environment],
    }),
    MysqlModule,
    MongoModule,
    UserModule,
    AuthModule,
    VillageModule,
    GameConfigModule,
    BuildingModule,
    GameEventModule,
    AttackModule,
    UnitModule,
  ],
  controllers: [],
  providers: [AttackService],
})
export class AppModule {}
