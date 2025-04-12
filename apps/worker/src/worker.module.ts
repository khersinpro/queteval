import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';
import { QueueModuleModule } from './queue-module/queue-module.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
      imports: [ConfigModule],
    }),
    QueueModuleModule,
    HealthModule,
  ],
})
export class WorkerModule {}
