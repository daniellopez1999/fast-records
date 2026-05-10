import { Module } from '@nestjs/common';
import { StorageService } from './services/storage.service';
import { ConfigService } from '@config/config.service';

@Module({
  providers: [StorageService, ConfigService],
  exports: [StorageService],
})
export class StorageModule { }
