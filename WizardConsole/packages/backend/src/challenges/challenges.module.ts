import { Module } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [MqttModule],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {
  constructor() {
    console.log('🏁 ChallengesModule initialisé');
  }
}