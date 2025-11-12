import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChallengeController } from './challenge.controller';
import { ChallengeService } from './challenge.service';
import { EmailController } from './email.controller';
import { EmailService } from './email.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env'
    })
  ],
  controllers: [AppController, ChallengeController, EmailController],
  providers: [AppService, ChallengeService, EmailService],
})
export class AppModule {}
