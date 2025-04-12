import { Module } from '@nestjs/common';
import { MysqlModule } from './mysql/mysql.module';
import { MongoModule } from './mongodb/mongodb.module';
import { UserModule } from './user/user.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { environment } from './config/environement';
import { AuthModule } from './auth/auth.module';
import { VillageModule } from './village/village.module';
import { GameConfigModule } from './game-config/game-config.module';
import { BuildingModule } from './building/building.module';
import { AttackService } from './attack/controller/attack.service';
import { AttackModule } from './attack/attack.module';
import { UnitModule } from './unit/unit.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environment],
    }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),
    MysqlModule,
    MongoModule,
    UserModule,
    AuthModule,
    VillageModule,
    GameConfigModule,
    BuildingModule,
    AttackModule,
    UnitModule,
  ],
  controllers: [],
  providers: [AttackService],
})
export class AppModule {}
