import { Module } from '@nestjs/common';
import { ScraperService } from './scraper.service';
import { ScraperProcessor } from './scraper.processor';
import { BullModule } from '@nestjs/bullmq';
import { CronService } from './cron.service';
import { EncryptionModule } from '../encryption/encryption.module';

import { ScraperController } from './scraper.controller';

@Module({
  imports: [
    EncryptionModule,
    BullModule.registerQueue({
      name: 'sunat-scraper-queue',
    }),
  ],
  controllers: [ScraperController],
  providers: [ScraperService, ScraperProcessor, CronService]
})
export class ScraperModule {}
