import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  getHealth() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'WizardConsole Backend',
      version: '0.1.0'
    };
  }

  @Get('system/status')
  getSystemStatus() {
    return {
      mqtt: 'connected', // TODO: vérifier vraiment
      challenges: 5,
      teams: ['alpha', 'beta', 'gamma', 'delta'],
      uptime: process.uptime()
    };
  }
}