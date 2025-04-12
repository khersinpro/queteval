import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Queteval API')
    .setDescription('API Documentation pour Queteval App')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const configService = app.get(ConfigService);

  await app.listen(
    configService.get<number>('PORT', 3000),
    configService.get<string>('HOST', '0.0.0.0'),
    () => {
      console.log(
        `Server running on port ${process.env.PORT ?? 3000}, 
        http://localhost:${process.env.PORT ?? 3000}/api`,
      );
    },
  );
}
bootstrap().catch((error) => console.error(error));
