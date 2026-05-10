import { Test, TestingModule } from '@nestjs/testing';
import { InternalServerErrorException } from '@nestjs/common';
import { Readable } from 'stream';
import * as Minio from 'minio';
import { StorageService } from '../../src/storage/services/storage.service';
import { ConfigService } from '../../src/config/config.service';

describe('StorageService', () => {
  let storageService: StorageService;
  let configService: ConfigService;
  let mockMinioClient: Partial<Minio.Client>;

  const mockConfigValues = {
    MINIO_ENDPOINT: 'localhost',
    MINIO_PORT: 9000,
    MINIO_USE_SSL: 'false',
    MINIO_ACCESS_KEY: 'minioadmin',
    MINIO_SECRET_KEY: 'minioadmin',
    MINIO_BUCKET_NAME: 'test-bucket',
    MINIO_REGION: 'us-east-1',
  };

  beforeEach(async () => {
    mockMinioClient = {
      listBuckets: jest.fn().mockResolvedValue([]),
      bucketExists: jest.fn().mockResolvedValue(true),
      makeBucket: jest.fn().mockResolvedValue(undefined),
      putObject: jest.fn().mockResolvedValue(undefined),
      getObject: jest.fn().mockReturnValue(Readable.from(['test data'])),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => mockConfigValues[key]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    storageService = module.get<StorageService>(StorageService);
    configService = module.get<ConfigService>(ConfigService);

    (storageService as any).minioClient = mockMinioClient;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should initialize Minio client with correct config', () => {
      expect(configService.get).toHaveBeenCalledWith('MINIO_ENDPOINT');
      expect(configService.get).toHaveBeenCalledWith('MINIO_PORT');
      expect(configService.get).toHaveBeenCalledWith('MINIO_ACCESS_KEY');
      expect(configService.get).toHaveBeenCalledWith('MINIO_SECRET_KEY');
    });

    it('should have minioClient initialized', () => {
      expect((storageService as any).minioClient).toBeDefined();
    });
  });

  describe('onModuleInit', () => {
    it('should call validateOnInit', async () => {
      const validateOnInitSpy = jest.spyOn(storageService, 'validateOnInit');
      await storageService.onModuleInit();
      expect(validateOnInitSpy).toHaveBeenCalled();
    });
  });

  describe('validateOnInit', () => {
    it('should validate connection and bucket existence on init', async () => {
      (mockMinioClient.listBuckets as jest.Mock).mockResolvedValue([]);
      (mockMinioClient.bucketExists as jest.Mock).mockResolvedValue(true);

      await storageService.validateOnInit();

      expect(mockMinioClient.listBuckets).toHaveBeenCalled();
      expect(mockMinioClient.bucketExists).toHaveBeenCalledWith('test-bucket');
    });

    it('should create bucket if it does not exist', async () => {
      (mockMinioClient.listBuckets as jest.Mock).mockResolvedValue([]);
      (mockMinioClient.bucketExists as jest.Mock).mockResolvedValue(false);
      (mockMinioClient.makeBucket as jest.Mock).mockResolvedValue(undefined);

      await storageService.validateOnInit();

      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('test-bucket', 'us-east-1');
    });

    it('should throw InternalServerErrorException if connection fails', async () => {
      const errorMessage = 'Connection failed';
      (mockMinioClient.listBuckets as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(storageService.validateOnInit()).rejects.toThrow(
        InternalServerErrorException,
      );
    });

    it('should throw InternalServerErrorException on bucket check error', async () => {
      const errorMessage = 'Bucket check failed';
      (mockMinioClient.listBuckets as jest.Mock).mockResolvedValue([]);
      (mockMinioClient.bucketExists as jest.Mock).mockRejectedValue(new Error(errorMessage));

      await expect(storageService.validateOnInit()).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createBucket', () => {
    it('should create a bucket successfully', async () => {
      (mockMinioClient.makeBucket as jest.Mock).mockResolvedValue(undefined);

      await storageService.createBucket('new-bucket', 'us-east-1');

      expect(mockMinioClient.makeBucket).toHaveBeenCalledWith('new-bucket', 'us-east-1');
    });

    it('should throw InternalServerErrorException if bucket creation fails', async () => {
      const errorMessage = 'Bucket already exists';
      (mockMinioClient.makeBucket as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        storageService.createBucket('existing-bucket', 'us-east-1'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('uploadFile', () => {
    it('should upload a file with Buffer successfully', async () => {
      const buffer = Buffer.from('test file content');
      (mockMinioClient.putObject as jest.Mock).mockResolvedValue(undefined);

      const result = await storageService.uploadFile(
        'test-bucket',
        'test-file.txt',
        buffer,
      );

      expect(result).toEqual({ objectName: 'test-file.txt' });
      expect(mockMinioClient.putObject).toHaveBeenCalled();
    });

    it('should upload a file with Stream successfully', async () => {
      const stream = Readable.from(['test content']);
      (mockMinioClient.putObject as jest.Mock).mockResolvedValue(undefined);

      const result = await storageService.uploadFile(
        'test-bucket',
        'test-stream-file.txt',
        stream,
      );

      expect(result).toEqual({ objectName: 'test-stream-file.txt' });
      expect(mockMinioClient.putObject).toHaveBeenCalled();
    });

    it('should upload file with metadata', async () => {
      const buffer = Buffer.from('test file content');
      const metadata = { 'Content-Type': 'text/plain' };
      (mockMinioClient.putObject as jest.Mock).mockResolvedValue(undefined);

      const result = await storageService.uploadFile(
        'test-bucket',
        'test-file.txt',
        buffer,
        metadata,
      );

      expect(result).toEqual({ objectName: 'test-file.txt' });
      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        'test-file.txt',
        expect.any(Object),
        buffer.length,
        metadata,
      );
    });

    it('should throw InternalServerErrorException on upload failure', async () => {
      const buffer = Buffer.from('test file content');
      const errorMessage = 'Upload failed';
      (mockMinioClient.putObject as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        storageService.uploadFile('test-bucket', 'test-file.txt', buffer),
      ).rejects.toThrow(InternalServerErrorException);
    });

    it('should handle Buffer to Stream conversion', async () => {
      const buffer = Buffer.from('test file content');
      (mockMinioClient.putObject as jest.Mock).mockResolvedValue(undefined);

      await storageService.uploadFile('test-bucket', 'test-file.txt', buffer);

      expect(mockMinioClient.putObject).toHaveBeenCalledWith(
        'test-bucket',
        'test-file.txt',
        expect.any(Readable),
        buffer.length,
        {},
      );
    });
  });

  describe('getFile', () => {
    it('should retrieve a file successfully', async () => {
      const testData = Buffer.from('test file content');
      const mockStream = Readable.from([testData]);

      (mockMinioClient.getObject as jest.Mock).mockReturnValue(mockStream);

      const result = await storageService.getFile('test-bucket', 'test-file.txt');

      expect(result).toEqual(testData);
      expect(mockMinioClient.getObject).toHaveBeenCalledWith(
        'test-bucket',
        'test-file.txt',
      );
    });

    it('should handle multiple chunks in stream', async () => {
      const chunk1 = Buffer.from('chunk1');
      const chunk2 = Buffer.from('chunk2');
      const mockStream = Readable.from([chunk1, chunk2]);

      (mockMinioClient.getObject as jest.Mock).mockReturnValue(mockStream);

      const result = await storageService.getFile('test-bucket', 'test-file.txt');

      expect(result.toString()).toBe('chunk1chunk2');
    });

    it('should throw InternalServerErrorException if Minio getObject fails', async () => {
      const errorMessage = 'Minio error';
      (mockMinioClient.getObject as jest.Mock).mockRejectedValue(
        new Error(errorMessage),
      );

      await expect(
        storageService.getFile('test-bucket', 'test-file.txt'),
      ).rejects.toThrow(InternalServerErrorException);
    });
  });

  describe('useSSL', () => {
    it('should return true when MINIO_USE_SSL is "true"', () => {
      (configService.get as jest.Mock).mockReturnValue('true');
      const result = (storageService as any).useSSL();
      expect(result).toBe(true);
    });

    it('should return false when MINIO_USE_SSL is not "true"', () => {
      (configService.get as jest.Mock).mockReturnValue('false');
      const result = (storageService as any).useSSL();
      expect(result).toBe(false);
    });

    it('should return false for empty string', () => {
      (configService.get as jest.Mock).mockReturnValue('');
      const result = (storageService as any).useSSL();
      expect(result).toBe(false);
    });

    it('should return false for undefined', () => {
      (configService.get as jest.Mock).mockReturnValue(undefined);
      const result = (storageService as any).useSSL();
      expect(result).toBe(false);
    });
  });

  describe('integration scenarios', () => {
    it('should handle full upload and download cycle', async () => {
      const buffer = Buffer.from('test file content');
      (mockMinioClient.putObject as jest.Mock).mockResolvedValue(undefined);
      (mockMinioClient.getObject as jest.Mock).mockReturnValue(Readable.from([buffer]));

      const uploadResult = await storageService.uploadFile(
        'test-bucket',
        'test-file.txt',
        buffer,
      );
      expect(uploadResult).toEqual({ objectName: 'test-file.txt' });

      const downloadResult = await storageService.getFile(
        'test-bucket',
        'test-file.txt',
      );
      expect(downloadResult).toEqual(buffer);
    });

    it('should handle multiple files', async () => {
      const files = [
        { name: 'file1.txt', content: Buffer.from('content1') },
        { name: 'file2.txt', content: Buffer.from('content2') },
        { name: 'file3.txt', content: Buffer.from('content3') },
      ];

      (mockMinioClient.putObject as jest.Mock).mockResolvedValue(undefined);

      for (const file of files) {
        const result = await storageService.uploadFile(
          'test-bucket',
          file.name,
          file.content,
        );
        expect(result).toEqual({ objectName: file.name });
      }

      expect(mockMinioClient.putObject).toHaveBeenCalledTimes(3);
    });
  });
});
