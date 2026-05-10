import { Test, TestingModule } from '@nestjs/testing';
import { StorageModule } from '../../src/storage/storage.module';
import { StorageService } from '../../src/storage/services/storage.service';
import { ConfigService } from '../../src/config/config.service';

describe('StorageModule', () => {
  let module: TestingModule;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config = {
          MINIO_ENDPOINT: 'localhost',
          MINIO_PORT: 9000,
          MINIO_USE_SSL: 'false',
          MINIO_ACCESS_KEY: 'minioadmin',
          MINIO_SECRET_KEY: 'minioadmin',
          MINIO_BUCKET_NAME: 'test-bucket',
          MINIO_REGION: 'us-east-1',
        };
        return config[key];
      }),
    };

    module = await Test.createTestingModule({
      imports: [StorageModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();
  });

  afterEach(async () => {
    await module.close();
  });

  describe('StorageModule', () => {
    it('should be defined', () => {
      expect(module).toBeDefined();
    });

    it('should provide StorageService', () => {
      const storageService = module.get<StorageService>(StorageService);
      expect(storageService).toBeDefined();
      expect(storageService).toBeInstanceOf(StorageService);
    });

    it('should export StorageService', async () => {
      const testModule: TestingModule = await Test.createTestingModule({
        imports: [StorageModule],
      })
        .overrideProvider(ConfigService)
        .useValue({
          get: jest.fn((key: string) => {
            const config = {
              MINIO_ENDPOINT: 'localhost',
              MINIO_PORT: 9000,
              MINIO_USE_SSL: 'false',
              MINIO_ACCESS_KEY: 'minioadmin',
              MINIO_SECRET_KEY: 'minioadmin',
              MINIO_BUCKET_NAME: 'test-bucket',
              MINIO_REGION: 'us-east-1',
            };
            return config[key];
          }),
        })
        .compile();

      const storageService = testModule.get<StorageService>(StorageService);
      expect(storageService).toBeDefined();
      await testModule.close();
    });

    it('should have StorageService as a provider', () => {
      const storageService = module.get<StorageService>(StorageService);
      expect(storageService).toBeInstanceOf(StorageService);
    });
  });
});
