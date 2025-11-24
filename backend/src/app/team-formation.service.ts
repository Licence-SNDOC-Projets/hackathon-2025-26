import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { challengeRegistry } from '@wizard-console/challenge';
import { TeamFormationChallenge } from '@wizard-console/challenge';
import type { TeamInfo, TeamProfile, BacklogPlayer } from '@wizard-console/challenge';
import type { PlayerProfile } from '@wizard-console/challenge';

/**
 * Service pour gérer la formation d'équipes avec persistance MQTT
 */
@Injectable()
export class TeamFormationService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(TeamFormationService.name);
  private mqttClient: mqtt.MqttClient | null = null;

  constructor(private configService: ConfigService) {}

  /**
   * Initialisation au démarrage du module
   */
  async onModuleInit() {
    this.logger.log('🔄 Initialisation du service TeamFormation...');
    await this.connectToMqtt();

    // Connecter le callback MQTT au challenge
    const challenge = this.getChallenge();
    challenge.setMQTTPublish((topic: string, message: string, options?: any) => {
      if (this.mqttClient?.connected) {
        this.mqttClient.publish(topic, message, options);
      }
    });

    this.logger.log('✅ Service TeamFormation initialisé');
  }

  /**
   * Nettoyage à l'arrêt du module
   */
  onModuleDestroy() {
    if (this.mqttClient) {
      this.mqttClient.end();
      this.logger.log('🔌 Déconnecté du broker MQTT');
    }
  }

  /**
   * Se connecte au broker MQTT et récupère l'état persisté
   */
  private async connectToMqtt(): Promise<void> {
    return new Promise((resolve) => {
      const mqttHost = this.configService.get<string>('MQTT_HOST', 'localhost');
      const mqttPort = this.configService.get<number>('MQTT_PORT', 1883);
      const mqttUsername = this.configService.get<string>('MQTT_USERNAME');
      const mqttPassword = this.configService.get<string>('MQTT_PASSWORD');
      const mqttUrl = `mqtt://${mqttHost}:${mqttPort}`;

      this.logger.log(`📡 Connexion au broker MQTT: ${mqttUrl}`);

      this.mqttClient = mqtt.connect(mqttUrl, {
        clientId: `team-formation-service-${Date.now()}`,
        clean: false,
        reconnectPeriod: 5000,
        username: mqttUsername,
        password: mqttPassword,
      });

      this.mqttClient.on('connect', () => {
        this.logger.log('✅ Connecté au broker MQTT');

        // S'abonner au topic de l'état du challenge
        const challenge = this.getChallenge();
        const stateTopic = `hackathon/challenges/${challenge.getConfig().id}/state`;

        this.mqttClient!.subscribe(stateTopic, { qos: 1 }, (err) => {
          if (err) {
            this.logger.error('❌ Erreur lors de l\'abonnement au topic:', err);
          } else {
            this.logger.log(`📬 Abonné au topic: ${stateTopic}`);
          }
          resolve();
        });
      });

      this.mqttClient.on('message', (topic, payload) => {
        const challenge = this.getChallenge();
        const stateTopic = `hackathon/challenges/${challenge.getConfig().id}/state`;

        if (topic === stateTopic) {
          try {
            const state = payload.toString().trim();
            challenge.restoreState(state as 'open' | 'closed');
            this.logger.log(`🔄 État restauré depuis MQTT: ${state.toUpperCase()}`);
          } catch (error) {
            this.logger.error('❌ Erreur lors du parsing du message MQTT:', error);
          }
        }
      });

      this.mqttClient.on('error', (error) => {
        this.logger.error('❌ Erreur MQTT:', error);
      });

      this.mqttClient.on('reconnect', () => {
        this.logger.warn('🔄 Reconnexion au broker MQTT...');
      });

      setTimeout(() => {
        if (!this.mqttClient?.connected) {
          this.logger.warn('⚠️ Timeout de connexion MQTT, démarrage sans persistance');
        }
        resolve();
      }, 10000);
    });
  }

  /**
   * Obtient l'instance du challenge Team Formation
   */
  private getChallenge(): TeamFormationChallenge {
    const challenge = challengeRegistry.getChallenge('team-formation');

    if (!challenge) {
      throw new NotFoundException('Challenge Team Formation not found');
    }

    if (!(challenge instanceof TeamFormationChallenge)) {
      throw new Error('Invalid challenge type');
    }

    return challenge as TeamFormationChallenge;
  }

  /**
   * Publie une équipe sur MQTT
   */
  private publishTeamToMQTT(team: TeamInfo): void {
    if (!this.mqttClient?.connected) {
      this.logger.warn('⚠️ MQTT non connecté, équipe non publiée');
      return;
    }

    const topic = `hackathon/teams/${team.id}`;
    const message = JSON.stringify({
      team,
      timestamp: new Date().toISOString()
    });

    this.mqttClient.publish(topic, message, { qos: 1, retain: true }, (err) => {
      if (err) {
        this.logger.error('❌ Erreur publication équipe:', err);
      } else {
        this.logger.log(`📤 Équipe publiée sur MQTT: ${team.name}`);
      }
    });
  }

  /**
   * Vérifie si le challenge est ouvert
   */
  isOpen(): boolean {
    try {
      const challenge = this.getChallenge();
      return challenge.isOpen();
    } catch (error) {
      this.logger.error('Error checking challenge status:', error);
      return false;
    }
  }

  /**
   * Ouvre le challenge (admin uniquement)
   */
  async openChallenge(): Promise<{ success: boolean; message: string }> {
    try {
      const challenge = this.getChallenge();
      challenge.open();

      this.logger.log('✅ Challenge Team Formation opened');

      return {
        success: true,
        message: 'Challenge opened successfully'
      };
    } catch (error) {
      this.logger.error('Error opening challenge:', error);
      throw error;
    }
  }

  /**
   * Ferme le challenge (admin uniquement)
   */
  async closeChallenge(): Promise<{ success: boolean; message: string }> {
    try {
      const challenge = this.getChallenge();
      challenge.close();

      this.logger.log('🔒 Challenge Team Formation closed');

      return {
        success: true,
        message: 'Challenge closed successfully'
      };
    } catch (error) {
      this.logger.error('Error closing challenge:', error);
      throw error;
    }
  }

  /**
   * Crée une nouvelle équipe
   */
  async createTeam(
    userId: string,
    userProfile: PlayerProfile,
    teamName: string
  ): Promise<TeamInfo> {
    try {
      const challenge = this.getChallenge();
      const team = await challenge.createTeam(userId, userProfile, teamName);

      // Publier sur MQTT
      this.publishTeamToMQTT(team);

      this.logger.log(`✅ Équipe "${teamName}" créée par ${userProfile.name}`);

      return team;
    } catch (error) {
      this.logger.error(`Error creating team:`, error);
      throw error;
    }
  }

  /**
   * Rejoint une équipe
   */
  async joinTeam(
    userId: string,
    userProfile: PlayerProfile,
    teamId: string
  ): Promise<TeamInfo> {
    try {
      const challenge = this.getChallenge();
      const team = await challenge.joinTeam(userId, userProfile, teamId);

      // Publier sur MQTT
      this.publishTeamToMQTT(team);

      this.logger.log(`✅ ${userProfile.name} a rejoint "${team.name}"`);

      return team;
    } catch (error) {
      this.logger.error(`Error joining team:`, error);
      throw error;
    }
  }

  /**
   * Quitte une équipe
   */
  async leaveTeam(userId: string, userProfile: PlayerProfile): Promise<void> {
    try {
      const challenge = this.getChallenge();

      // Obtenir l'équipe avant de quitter pour MQTT
      const team = challenge.getUserTeam(userId);

      await challenge.leaveTeam(userId, userProfile);

      // Publier la mise à jour ou supprimer si vide
      if (team && challenge.getTeam(team.id)) {
        this.publishTeamToMQTT(challenge.getTeam(team.id)!);
      } else if (team) {
        // Supprimer le topic MQTT si l'équipe n'existe plus
        if (this.mqttClient?.connected) {
          this.mqttClient.publish(`hackathon/teams/${team.id}`, '', { retain: true });
        }
      }

      this.logger.log(`👋 ${userProfile.name} a quitté une équipe`);
    } catch (error) {
      this.logger.error(`Error leaving team:`, error);
      throw error;
    }
  }

  /**
   * Obtient toutes les équipes
   */
  getAllTeams(): TeamInfo[] {
    try {
      const challenge = this.getChallenge();
      return challenge.getAllTeams();
    } catch (error) {
      this.logger.error('Error getting all teams:', error);
      throw error;
    }
  }

  /**
   * Obtient une équipe par son ID
   */
  getTeam(teamId: string): TeamInfo | null {
    try {
      const challenge = this.getChallenge();
      return challenge.getTeam(teamId);
    } catch (error) {
      this.logger.error(`Error getting team ${teamId}:`, error);
      return null;
    }
  }

  /**
   * Obtient l'équipe d'un utilisateur
   */
  getUserTeam(userId: string): TeamInfo | null {
    try {
      const challenge = this.getChallenge();
      return challenge.getUserTeam(userId);
    } catch (error) {
      this.logger.error(`Error getting user team:`, error);
      return null;
    }
  }

  /**
   * Obtient tous les joueurs dans le backlog
   */
  getBacklogPlayers(): BacklogPlayer[] {
    try {
      const challenge = this.getChallenge();
      return challenge.getBacklogPlayers();
    } catch (error) {
      this.logger.error('Error getting backlog players:', error);
      throw error;
    }
  }

  /**
   * Obtient le profil agrégé d'une équipe
   */
  getTeamProfile(teamId: string): TeamProfile | null {
    try {
      const challenge = this.getChallenge();
      return challenge.getTeamProfile(teamId);
    } catch (error) {
      this.logger.error(`Error getting team profile:`, error);
      return null;
    }
  }

  /**
   * Met à jour le profil d'un joueur
   */
  updatePlayerProfile(userId: string, profile: PlayerProfile): void {
    try {
      const challenge = this.getChallenge();
      challenge.updatePlayerProfile(userId, profile);

      // Republier l'équipe sur MQTT si le joueur est dans une équipe
      const team = challenge.getUserTeam(userId);
      if (team) {
        this.publishTeamToMQTT(team);
      }

      this.logger.log(`✅ Profil mis à jour pour ${profile.name}`);
    } catch (error) {
      this.logger.error('Error updating player profile:', error);
      throw error;
    }
  }
}
