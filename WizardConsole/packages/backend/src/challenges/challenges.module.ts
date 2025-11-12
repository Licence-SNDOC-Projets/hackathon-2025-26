import { Module } from '@nestjs/common';
import { ChallengesService } from './challenges.service';
import { StudentProfileModule } from './student-profile/student-profile.module';
import { MqttModule } from '../mqtt/mqtt.module';

@Module({
  imports: [
    MqttModule,
    StudentProfileModule
  ],
  providers: [ChallengesService],
  exports: [ChallengesService],
})
export class ChallengesModule {
  constructor() {
    console.log('🏁 ChallengesModule initialisé');
  }
}