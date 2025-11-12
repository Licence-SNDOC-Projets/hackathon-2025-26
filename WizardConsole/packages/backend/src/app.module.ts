import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MqttModule } from './mqtt/mqtt.module';
import { TeamsModule } from './teams/teams.module';
import { ChallengesModule } from './challenges/challenges.module';
import { BeaconsModule } from './beacons/beacons.module';

@Module({
  imports: [
    MqttModule,
    TeamsModule, 
    ChallengesModule,
    BeaconsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  constructor() {
    console.log('🧙‍♂️ WizardConsole AppModule initialisé');
  }
}