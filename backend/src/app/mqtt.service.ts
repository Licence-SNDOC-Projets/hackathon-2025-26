import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface MqttStatus {
  isRunning: boolean;
  uptime?: string;
  containerName?: string;
  ports?: string[];
}

export interface MqttConfig {
  persistence: boolean;
  persistence_location: string;
  log_dest: string;
  log_type: string;
  allow_anonymous: boolean;
  password_file?: string;
  acl_file?: string;
  listeners: Array<{
    port: number;
    protocol?: string;
  }>;
}

@Injectable()
export class MqttService {
  private readonly logger = new Logger(MqttService.name);

  constructor(private configService: ConfigService) {}

  /**
   * Démarre le serveur MQTT
   */
  async startMqttServer(): Promise<{ success: boolean; message: string }> {
    try {
      const startCmd = this.configService.get<string>('MQTT_START_CMD');

      if (!startCmd) {
        throw new Error('MQTT_START_CMD non configurée dans les variables d\'environnement');
      }

      this.logger.log('Démarrage du serveur MQTT...');
      const { stdout, stderr } = await execAsync(startCmd);

      if (stderr && !stderr.includes('Creating') && !stderr.includes('Starting')) {
        this.logger.warn(`Avertissement lors du démarrage: ${stderr}`);
      }

      this.logger.log('Serveur MQTT démarré avec succès');
      return {
        success: true,
        message: 'Serveur MQTT démarré avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors du démarrage du serveur MQTT:', error);
      return {
        success: false,
        message: `Erreur lors du démarrage: ${error.message}`,
      };
    }
  }

  /**
   * Arrête le serveur MQTT
   */
  async stopMqttServer(): Promise<{ success: boolean; message: string }> {
    try {
      const stopCmd = this.configService.get<string>('MQTT_STOP_CMD');

      if (!stopCmd) {
        throw new Error('MQTT_STOP_CMD non configurée dans les variables d\'environnement');
      }

      this.logger.log('Arrêt du serveur MQTT...');
      const { stdout, stderr } = await execAsync(stopCmd);

      if (stderr && !stderr.includes('Stopping')) {
        this.logger.warn(`Avertissement lors de l'arrêt: ${stderr}`);
      }

      this.logger.log('Serveur MQTT arrêté avec succès');
      return {
        success: true,
        message: 'Serveur MQTT arrêté avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors de l\'arrêt du serveur MQTT:', error);
      return {
        success: false,
        message: `Erreur lors de l'arrêt: ${error.message}`,
      };
    }
  }

  /**
   * Redémarre le serveur MQTT
   */
  async restartMqttServer(): Promise<{ success: boolean; message: string }> {
    try {
      const restartCmd = this.configService.get<string>('MQTT_RESTART_CMD');

      if (!restartCmd) {
        throw new Error('MQTT_RESTART_CMD non configurée dans les variables d\'environnement');
      }

      this.logger.log('Redémarrage du serveur MQTT...');
      const { stdout, stderr } = await execAsync(restartCmd);

      if (stderr && !stderr.includes('Restarting')) {
        this.logger.warn(`Avertissement lors du redémarrage: ${stderr}`);
      }

      this.logger.log('Serveur MQTT redémarré avec succès');
      return {
        success: true,
        message: 'Serveur MQTT redémarré avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors du redémarrage du serveur MQTT:', error);
      return {
        success: false,
        message: `Erreur lors du redémarrage: ${error.message}`,
      };
    }
  }

  /**
   * Recharge la configuration MQTT
   */
  async reloadMqttConfig(): Promise<{ success: boolean; message: string }> {
    try {
      // D'abord, on redémarre le serveur pour prendre en compte les nouveaux paramètres
      const restartResult = await this.restartMqttServer();

      if (!restartResult.success) {
        return restartResult;
      }

      this.logger.log('Configuration MQTT rechargée avec succès');
      return {
        success: true,
        message: 'Configuration MQTT rechargée avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors du rechargement de la configuration MQTT:', error);
      return {
        success: false,
        message: `Erreur lors du rechargement: ${error.message}`,
      };
    }
  }

  /**
   * Obtient le statut du serveur MQTT
   */
  async getMqttStatus(): Promise<MqttStatus> {
    try {
      // Vérifier si le conteneur MQTT est en cours d'exécution
      const { stdout } = await execAsync('docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" --filter "name=mqtt-broker"');

      const lines = stdout.trim().split('\n');
      if (lines.length > 1 && lines[1].includes('mqtt-broker')) {
        const parts = lines[1].split('\t');
        return {
          isRunning: true,
          containerName: 'mqtt-broker',
          uptime: parts[1] || 'Unknown',
          ports: parts[2] ? parts[2].split(', ') : [],
        };
      }

      return { isRunning: false };
    } catch (error) {
      this.logger.error('Erreur lors de la vérification du statut MQTT:', error);
      return { isRunning: false };
    }
  }

  /**
   * Lit la configuration MQTT actuelle
   */
  async getMqttConfig(): Promise<{ success: boolean; config?: string; message?: string }> {
    try {
      const configPath = this.configService.get<string>('MQTT_CONFIG_PATH');

      if (!configPath) {
        throw new Error('MQTT_CONFIG_PATH non configuré dans les variables d\'environnement');
      }

      const fullConfigPath = path.resolve(configPath);
      const configContent = await fs.readFile(fullConfigPath, 'utf8');

      return {
        success: true,
        config: configContent,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la lecture de la configuration MQTT:', error);
      return {
        success: false,
        message: `Erreur lors de la lecture: ${error.message}`,
      };
    }
  }

  /**
   * Met à jour la configuration MQTT
   */
  async updateMqttConfig(newConfig: string): Promise<{ success: boolean; message: string }> {
    try {
      const configPath = this.configService.get<string>('MQTT_CONFIG_PATH');

      if (!configPath) {
        throw new Error('MQTT_CONFIG_PATH non configuré dans les variables d\'environnement');
      }

      const fullConfigPath = path.resolve(configPath);

      // Créer une sauvegarde de la configuration actuelle
      const backupPath = `${fullConfigPath}.backup.${Date.now()}`;
      const currentConfig = await fs.readFile(fullConfigPath, 'utf8');
      await fs.writeFile(backupPath, currentConfig, 'utf8');

      // Écrire la nouvelle configuration
      await fs.writeFile(fullConfigPath, newConfig, 'utf8');

      this.logger.log(`Configuration MQTT mise à jour. Sauvegarde créée: ${backupPath}`);

      return {
        success: true,
        message: 'Configuration MQTT mise à jour avec succès',
      };
    } catch (error) {
      this.logger.error('Erreur lors de la mise à jour de la configuration MQTT:', error);
      return {
        success: false,
        message: `Erreur lors de la mise à jour: ${error.message}`,
      };
    }
  }

  /**
   * Obtient les informations de santé du service MQTT
   */
  async getMqttHealth(): Promise<{
    status: 'healthy' | 'unhealthy';
    server: MqttStatus;
    configPath: string;
    lastCheck: string;
  }> {
    const status = await this.getMqttStatus();
    const configPath = this.configService.get<string>('MQTT_CONFIG_PATH') || 'Non configuré';

    return {
      status: status.isRunning ? 'healthy' : 'unhealthy',
      server: status,
      configPath,
      lastCheck: new Date().toISOString(),
    };
  }
}
