import { Module } from '@nestjs/common';
import { MysqlModule } from './mysql/mysql.module';
import { MongoModule } from './mongodb/mongodb.module';
import { UserModule } from './user/user.module';
import { ConfigModule } from '@nestjs/config';
import { environment } from './config/environement';
import { AuthModule } from './auth/auth.module';
import { VillageModule } from './village/village.module';
import { GameConfigModule } from './game-config/game-config.module';

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
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
