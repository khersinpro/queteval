import { Module } from '@nestjs/common';
import { MysqlModule } from './mysql/mysql.module';
import { MongodbModule } from './mongodb/mongodb.module';
import { UserModule } from './user/user.module';
// import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { environment } from './config/environement';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [environment],
    }),
    MysqlModule,
    MongodbModule,
    UserModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
