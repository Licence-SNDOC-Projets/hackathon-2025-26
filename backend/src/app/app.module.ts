import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';

@Module({
  imports: [],
  controllers: [AppController, ChallengeController],
  providers: [AppService, ChallengeService],
})
export class AppModule {}
