import { NestFactory } from '@nestjs/core';
import { WorkerModule } from './worker.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(WorkerModule);
  const configService = app.get(ConfigService);
  await app.listen(
    configService.get<number>('PORT', 3001),
    configService.get<string>('HOST', '0.0.0.0'),
  );
}

bootstrap().then(() => console.log('Worker is running on port 3001'));
