import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Configuration CORS pour le frontend
  const corsOptions: CorsOptions = {
    origin: ['http://localhost:4200', 'http://localhost:3000'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  };
  
  app.enableCors(corsOptions);
  app.setGlobalPrefix('api');
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log('🚀 WizardConsole Backend démarré sur http://localhost:' + port);
  console.log('📡 MQTT Broker: ' + (process.env.MQTT_BROKER_URL || 'mqtt://localhost:1883'));
}

bootstrap();