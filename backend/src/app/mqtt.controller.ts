import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  HttpException,
  HttpStatus,
  UseGuards
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { MqttService, MqttStatus } from './mqtt.service';

interface UpdateConfigDto {
  config: string;
}

interface MqttResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
}

/**
 * Contrôleur MQTT pour la gestion du serveur Mosquitto
 * Fournit des endpoints pour démarrer, arrêter, redémarrer et configurer le serveur MQTT
 */
@Controller('mqtt')
@UseGuards(JwtAuthGuard)
export class MqttController {
  constructor(private readonly mqttService: MqttService) {}

  /**
   * Démarre le serveur MQTT
   * @returns Statut de l'opération
   */
  @Post('start')
  async startServer(): Promise<MqttResponse> {
    try {
      const result = await this.mqttService.startMqttServer();

      return {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Erreur lors du démarrage du serveur MQTT: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Arrête le serveur MQTT
   * @returns Statut de l'opération
   */
  @Post('stop')
  async stopServer(): Promise<MqttResponse> {
    try {
      const result = await this.mqttService.stopMqttServer();

      return {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Erreur lors de l'arrêt du serveur MQTT: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Redémarre le serveur MQTT
   * @returns Statut de l'opération
   */
  @Post('restart')
  async restartServer(): Promise<MqttResponse> {
    try {
      const result = await this.mqttService.restartMqttServer();

      return {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Erreur lors du redémarrage du serveur MQTT: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Recharge la configuration MQTT
   * @returns Statut de l'opération
   */
  @Post('reload')
  async reloadConfig(): Promise<MqttResponse> {
    try {
      const result = await this.mqttService.reloadMqttConfig();

      return {
        success: result.success,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Erreur lors du rechargement de la configuration: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtient le statut actuel du serveur MQTT
   * @returns Statut du serveur MQTT
   */
  @Get('status')
  async getStatus(): Promise<MqttResponse<MqttStatus>> {
    try {
      const status = await this.mqttService.getMqttStatus();

      return {
        success: true,
        message: status.isRunning ? 'Serveur MQTT en cours d\'exécution' : 'Serveur MQTT arrêté',
        data: status,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Erreur lors de la vérification du statut: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtient la configuration MQTT actuelle
   * @returns Configuration actuelle
   */
  @Get('config')
  async getConfig(): Promise<MqttResponse<{ config: string }>> {
    try {
      const result = await this.mqttService.getMqttConfig();

      if (!result.success) {
        throw new HttpException(
          {
            success: false,
            message: result.message || 'Erreur lors de la lecture de la configuration',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: 'Configuration MQTT récupérée avec succès',
        data: { config: result.config || '' },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: `Erreur lors de la lecture de la configuration: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Met à jour la configuration MQTT
   * @param updateConfigDto Nouvelle configuration
   * @returns Statut de l'opération
   */
  @Put('config')
  async updateConfig(@Body() updateConfigDto: UpdateConfigDto): Promise<MqttResponse> {
    try {
      if (!updateConfigDto.config) {
        throw new HttpException(
          {
            success: false,
            message: 'Le contenu de la configuration est requis',
            timestamp: new Date().toISOString(),
          },
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.mqttService.updateMqttConfig(updateConfigDto.config);

      if (!result.success) {
        throw new HttpException(
          {
            success: false,
            message: result.message,
            timestamp: new Date().toISOString(),
          },
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: result.message,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          success: false,
          message: `Erreur lors de la mise à jour de la configuration: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtient les informations de santé du service MQTT
   * @returns Informations de santé
   */
  @Get('health')
  async getHealth(): Promise<MqttResponse<any>> {
    try {
      const health = await this.mqttService.getMqttHealth();

      return {
        success: true,
        message: `Service MQTT: ${health.status}`,
        data: health,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw new HttpException(
        {
          success: false,
          message: `Erreur lors de la vérification de la santé: ${error.message}`,
          timestamp: new Date().toISOString(),
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtient des informations détaillées sur les endpoints disponibles
   * @returns Liste des endpoints avec descriptions
   */
  @Get('endpoints')
  getEndpoints(): MqttResponse<any> {
    const endpoints = [
      {
        method: 'POST',
        path: '/mqtt/start',
        description: 'Démarre le serveur MQTT',
        authentication: 'Requise (JWT)'
      },
      {
        method: 'POST',
        path: '/mqtt/stop',
        description: 'Arrête le serveur MQTT',
        authentication: 'Requise (JWT)'
      },
      {
        method: 'POST',
        path: '/mqtt/restart',
        description: 'Redémarre le serveur MQTT',
        authentication: 'Requise (JWT)'
      },
      {
        method: 'POST',
        path: '/mqtt/reload',
        description: 'Recharge la configuration MQTT',
        authentication: 'Requise (JWT)'
      },
      {
        method: 'GET',
        path: '/mqtt/status',
        description: 'Obtient le statut du serveur MQTT',
        authentication: 'Requise (JWT)'
      },
      {
        method: 'GET',
        path: '/mqtt/config',
        description: 'Obtient la configuration MQTT actuelle',
        authentication: 'Requise (JWT)'
      },
      {
        method: 'PUT',
        path: '/mqtt/config',
        description: 'Met à jour la configuration MQTT',
        authentication: 'Requise (JWT)',
        body: { config: 'string - Contenu de la nouvelle configuration' }
      },
      {
        method: 'GET',
        path: '/mqtt/health',
        description: 'Obtient les informations de santé du service',
        authentication: 'Requise (JWT)'
      },
      {
        method: 'GET',
        path: '/mqtt/endpoints',
        description: 'Liste tous les endpoints disponibles',
        authentication: 'Requise (JWT)'
      }
    ];

    return {
      success: true,
      message: 'Endpoints MQTT disponibles',
      data: { endpoints, totalEndpoints: endpoints.length },
      timestamp: new Date().toISOString(),
    };
  }
}
