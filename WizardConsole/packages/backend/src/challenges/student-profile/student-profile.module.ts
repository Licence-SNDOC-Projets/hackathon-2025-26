import { Module } from '@nestjs/common';
import { StudentProfileService } from './student-profile.service';
import { StudentProfileController } from './student-profile.controller';
import { MqttModule } from '../../mqtt/mqtt.module';

@Module({
  imports: [MqttModule],
  providers: [StudentProfileService],
  controllers: [StudentProfileController],
  exports: [StudentProfileService],
})
export class StudentProfileModule {
  constructor() {
    console.log('🎓 StudentProfileModule initialisé');
  }
}