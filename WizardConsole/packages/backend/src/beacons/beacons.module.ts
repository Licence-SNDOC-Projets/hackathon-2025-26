import { Module } from '@nestjs/common';
import { BeaconsService } from './beacons.service';

@Module({
  providers: [BeaconsService],
  exports: [BeaconsService],
})
export class BeaconsModule {
  constructor() {
    console.log('📍 BeaconsModule initialisé');
  }
}