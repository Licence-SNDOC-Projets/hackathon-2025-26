import { Injectable } from '@nestjs/common';

@Injectable()
export class BeaconsService {
  private beacons = [
    { id: 'start-line', status: 'active', lastTriggered: null as Date | null },
    { id: 'checkpoint1', status: 'active', lastTriggered: null as Date | null },
    { id: 'checkpoint2', status: 'active', lastTriggered: null as Date | null },
    { id: 'finish-line', status: 'active', lastTriggered: null as Date | null },
  ];

  getAllBeacons() {
    return this.beacons;
  }

  getBeacon(id: string) {
    return this.beacons.find(beacon => beacon.id === id);
  }
}