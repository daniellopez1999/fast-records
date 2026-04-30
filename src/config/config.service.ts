import { Injectable, Logger } from '@nestjs/common';
import { envSchema, EnvConfig } from './env.schema';
import { ZodError } from 'zod';

@Injectable()
export class ConfigService {
  private config: EnvConfig;
  private readonly logger = new Logger(ConfigService.name);

  constructor() {
  }

  /**
   * @description Validates the environment variables using Zod schema. 
   * Should be called during application initialization.
   * @throws Will throw an error if validation fails, with detailed messages about which variables are invalid or missing.
   */
  validateEnvironmentVariables(): void {
    try {
      this.config = envSchema.parse(process.env);
      this.logger.log('Environment variables validated successfully');
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join('\n  ');

        this.logger.error(
          `Environment validation failed:\n  ${formattedErrors}`,
        );
        throw new Error('Invalid environment variables');
      }
      throw error;
    }
  }

  /**
   * Gets a specific configuration value by key.
   * @param key The key of the configuration variable to retrieve.
   * @returns The value of the requested configuration variable.
   * @example const port = this.configService.get('PORT');
   */
  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    if (!this.config) {
      throw new Error(
        'ConfigService not initialized. Call validateEnvironmentVariables() first.',
      );
    }
    return this.config[key];
  }

  isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  loggingType() {
    switch (this.get('NODE_ENV')) {
      case 'development':
        return 'error';
      case 'production':
        return ['info', 'warn'];
      default:
        return false;
    }
  }
}
