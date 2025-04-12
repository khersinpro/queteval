import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      name: 'mongodb',
      useFactory: (configService: ConfigService) => ({
        type: 'mongodb',
        url: configService.get<string>('MONGODB_URI'),
        autoLoadEntities: true,
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
  ],
})
export class MongoModule {}
