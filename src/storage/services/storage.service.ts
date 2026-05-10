import { ConfigService } from '@config/config.service';
import { Injectable, InternalServerErrorException, OnModuleInit, Logger } from '@nestjs/common';
import * as Minio from 'minio';
import { Readable } from 'stream';

@Injectable()
export class StorageService implements OnModuleInit {
  private minioClient: Minio.Client;
  private readonly logger = new Logger(StorageService.name);

  constructor(private readonly configService: ConfigService) {
    // Initialize Minio client with configuration
    this.minioClient = new Minio.Client({
      endPoint: this.configService.get('MINIO_ENDPOINT'),
      port: this.configService.get('MINIO_PORT'),
      useSSL: this.useSSL(),
      accessKey: this.configService.get('MINIO_ACCESS_KEY'),
      secretKey: this.configService.get('MINIO_SECRET_KEY'),
    });
  }

  /**
   * @description Lifecycle hook that is called once the module has been initialized.
   * It is automatically called by NestJS when the module implements the OnModuleInit interface.
   */
  async onModuleInit() {
    await this.validateOnInit();
  }

  /**
   * @description Validates the connection to the Minio server and checks if the specified bucket exists. 
   * If the bucket does not exist, it creates it. 
   * This method is called during module initialization to ensure that the storage service is ready 
   * to use before handling any requests.
   */
  async validateOnInit() {
    try {
      await this.minioClient.listBuckets();

      const bucketName = this.configService.get('MINIO_BUCKET_NAME');
      const bucketExists = await this.minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        await this.createBucket(bucketName, this.configService.get('MINIO_REGION'));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`Failed to connect to Minio server: ${errorMessage}`);
    }
  }

  async createBucket(bucketName: string, bucketRegion: string) {
    try {
      await this.minioClient.makeBucket(bucketName, bucketRegion);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new InternalServerErrorException(`Failed to create bucket: ${errorMessage}`);
    }
  }

  /**
   * @description Uploads a file to MinIO storage using a stream (from Multer buffer)
   * @param bucketName - The name of the bucket
   * @param objectName - The name of the object (file path in bucket)
   * @param fileStream - The file stream or buffer (provided by Multer)
   * @param metadata - Optional metadata to attach to the object
   * @returns The object name and size information
   * @example
   * @Post('upload')
   * @UseInterceptors(FileInterceptor('file'))
   * async uploadFile(@UploadedFile() file: Express.Multer.File) {
   *   return this.classService.method();
   * }
   */
  async uploadFile(
    bucketName: string,
    objectName: string,
    fileStream: Buffer | Readable,
    metadata?: Record<string, string>,
  ): Promise<{ objectName: string }> {
    try {
      this.logger.debug(`Uploading file: ${objectName} to bucket: ${bucketName}`);

      // Convert Buffer to Readable stream if needed
      const stream = Buffer.isBuffer(fileStream) ? Readable.from(fileStream) : fileStream;
      const size = Buffer.isBuffer(fileStream) ? fileStream.length : undefined;

      await this.minioClient.putObject(bucketName, objectName, stream, size, metadata || {});

      this.logger.log(`File successfully uploaded: ${objectName}`);
      return { objectName };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to upload file: ${errorMessage}`, error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException(`Failed to upload file: ${errorMessage}`);
    }
  }

  /**
   * @description Retrieves a file from MinIO storage and returns it as a Buffer
   * @param bucketName - The name of the bucket
   * @param objectName - The name of the object (file path in bucket)
   * @returns Buffer containing the file data
  */
  async getFile(bucketName: string, objectName: string): Promise<Buffer> {
    try {
      this.logger.debug(`Retrieving file: ${objectName} from bucket: ${bucketName}`);

      const stream = await this.minioClient.getObject(bucketName, objectName);

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        stream.on('data', (chunk) => chunks.push(chunk));
        stream.on('end', () => resolve(Buffer.concat(chunks)));
        stream.on('error', (err) => reject(err));
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to get file: ${errorMessage}`, error instanceof Error ? error.stack : '');
      throw new InternalServerErrorException(`Failed to get file: ${errorMessage}`);
    }
  }

  private useSSL(): boolean {
    const useSSL = this.configService.get('MINIO_USE_SSL');
    if (useSSL === 'true') return true;
    else return false;
  }
}