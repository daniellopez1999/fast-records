import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from './config/config.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Validate environment variables with Zod
  const configService = app.get(ConfigService);
  configService.validateEnvironmentVariables();

  const port = configService.get('PORT');
  const nodeEnv = configService.get('NODE_ENV');

  // Configure CORS based on environment
  const corsOptions =
    nodeEnv === 'development'
      ? { origin: '*', credentials: false } // Allow all origins in development
      : {
        origin: configService.get('CORS_ORIGIN') || 'https://fast-records.com',
        credentials: true,
      };

  app.enableCors(corsOptions);

  // Global validation pipe for request validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const logger = new Logger('Bootstrap');

  await app.listen(port);
  logger.log(`Server running on port: ${port}`);
}

bootstrap().catch((error) => {
  const logger = new Logger('Bootstrap');
  logger.error('Failed to start server:', error);
  process.exit(1);
});
