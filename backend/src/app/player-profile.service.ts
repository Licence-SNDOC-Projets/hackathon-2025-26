import { Injectable, Logger, NotFoundException, BadRequestException, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as mqtt from 'mqtt';
import { challengeRegistry } from '@wizard-console/challenge';
import { PlayerProfileChallenge } from '@wizard-console/challenge';
import type { PlayerProfile, SubmitProfileDto } from '@wizard-console/challenge';

/**
 * Service pour gérer les profils joueurs avec persistance MQTT
 */
@Injectable()
export class PlayerProfileService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlayerProfileService.name);
  private mqttClient: mqtt.MqttClient | null = null;
  private readonly MQTT_TOPIC_CHALLENGE_STATE = 'hackathon/challenges/player-profile/state';
  private readonly MQTT_TOPIC_PROFILES_BASE = 'hackathon/challenges/player-profile/user-profiles';

  constructor(private configService: ConfigService) {}

  /**
   * Initialisation au démarrage du module
   */
  async onModuleInit() {
    this.logger.log('🔄 Initialisation du service PlayerProfile...');
    await this.connectToMqtt();

    // Connecter le callback MQTT au challenge
    const challenge = this.getChallenge();
    challenge.setMQTTPublish((topic: string, message: string, options?: any) => {
      if (this.mqttClient?.connected) {
        this.mqttClient.publish(topic, message, options);
      }
    });

    this.logger.log('✅ Service PlayerProfile initialisé');
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
        clientId: `player-profile-service-${Date.now()}`,
        clean: false, // Persister la session
        reconnectPeriod: 5000,
        username: mqttUsername,
        password: mqttPassword,
      });

      this.mqttClient.on('connect', () => {
        this.logger.log('✅ Connecté au broker MQTT');

        // S'abonner au topic de l'état du challenge (nouvelle structure)
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
            // Le message est maintenant en texte brut : "open" ou "closed"
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

      // Timeout de 10 secondes pour la connexion
      setTimeout(() => {
        if (!this.mqttClient?.connected) {
          this.logger.warn('⚠️ Timeout de connexion MQTT, démarrage sans persistance');
        }
        resolve();
      }, 10000);
    });
  }


  /**
   * Publie la soumission d'un profil sur MQTT
   */
  private publishProfileSubmission(email: string, profile: PlayerProfile): void {
    if (!this.mqttClient?.connected) {
      this.logger.warn('⚠️ MQTT non connecté, profil non publié');
      return;
    }

    const message = {
      profile,
      timestamp: new Date().toISOString(),
    };

    // Publier sur hackathon/player-profile/<email>
    const topic = `${this.MQTT_TOPIC_PROFILES_BASE}/${email}`;

    this.mqttClient.publish(
      topic,
      JSON.stringify(message),
      { qos: 1, retain: true },
      (err) => {
        if (err) {
          this.logger.error('❌ Erreur lors de la publication du profil:', err);
        } else {
          this.logger.log(`📤 Profil publié sur MQTT: ${topic}`);
        }
      }
    );
  }

  /**
   * Obtient l'instance du challenge Player Profile
   */
  private getChallenge(): PlayerProfileChallenge {
    const challenge = challengeRegistry.getChallenge('player-profile');

    if (!challenge) {
      throw new NotFoundException('Challenge Player Profile not found');
    }

    if (!(challenge instanceof PlayerProfileChallenge)) {
      throw new Error('Invalid challenge type');
    }

    return challenge as PlayerProfileChallenge;
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
      challenge.open(); // Publie automatiquement sur MQTT via BaseChallenge

      this.logger.log('✅ Challenge Player Profile opened (persisté via MQTT)');

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
      challenge.close(); // Publie automatiquement sur MQTT via BaseChallenge

      this.logger.log('🔒 Challenge Player Profile closed (persisté via MQTT)');

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
   * Soumet ou met à jour le profil d'un joueur
   */
  async submitProfile(
    userId: string,
    email: string,
    profileData: SubmitProfileDto
  ): Promise<PlayerProfile> {
    try {
      const challenge = this.getChallenge();

      // Créer une "équipe" fictive représentant l'étudiant
      const team = {
        id: userId,
        name: profileData.name
      };

      // Préparer le challenge si nécessaire
      const canParticipate = await challenge.canTeamParticipate(team);
      if (!canParticipate) {
        throw new BadRequestException('Cannot participate in this challenge');
      }

      await challenge.prepareForTeam(team);
      await challenge.startChallenge(team);

      // Soumettre le profil
      const profileToSubmit: Partial<PlayerProfile> = {
        ...profileData,
        userId,
        email
      };

      await challenge.submitProfile(team, profileToSubmit);

      // Récupérer le profil complet
      const profile = await challenge.getProfile(team);

      if (!profile) {
        throw new Error('Failed to retrieve submitted profile');
      }

      // Publier le profil sur MQTT pour persistance
      this.publishProfileSubmission(email, profile);

      this.logger.log(`✅ Profile submitted for ${email} (${profileData.name}) - persisté via MQTT`);

      return profile;

    } catch (error) {
      this.logger.error(`Error submitting profile for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère le profil d'un joueur
   */
  async getProfile(userId: string): Promise<PlayerProfile | null> {
    try {
      const challenge = this.getChallenge();

      const team = { id: userId, name: '' };
      const profile = await challenge.getProfile(team);

      return profile;

    } catch (error) {
      this.logger.error(`Error getting profile for user ${userId}:`, error);
      return null;
    }
  }

  /**
   * Récupère tous les profils (admin uniquement)
   */
  async getAllProfiles(): Promise<PlayerProfile[]> {
    try {
      const challenge = this.getChallenge();
      return challenge.getAllProfiles();
    } catch (error) {
      this.logger.error('Error getting all profiles:', error);
      throw error;
    }
  }

  /**
   * Obtient les statistiques des profils (admin)
   */
  async getProfileStats(): Promise<{
    totalProfiles: number;
    averageSkills: {
      development: number;
      electronics: number;
      iot: number;
      mechanics: number;
    };
    roleDistribution: Record<string, number>;
    workStyleDistribution: Record<string, number>;
  }> {
    try {
      const challenge = this.getChallenge();
      const profiles = challenge.getAllProfiles();

      if (profiles.length === 0) {
        return {
          totalProfiles: 0,
          averageSkills: { development: 0, electronics: 0, iot: 0, mechanics: 0 },
          roleDistribution: {},
          workStyleDistribution: {}
        };
      }

      // Calculer les moyennes
      const skillsSums = profiles.reduce(
        (acc, p) => ({
          development: acc.development + p.skills.development,
          electronics: acc.electronics + p.skills.electronics,
          iot: acc.iot + p.skills.iot,
          mechanics: acc.mechanics + p.skills.mechanics
        }),
        { development: 0, electronics: 0, iot: 0, mechanics: 0 }
      );

      const averageSkills = {
        development: skillsSums.development / profiles.length,
        electronics: skillsSums.electronics / profiles.length,
        iot: skillsSums.iot / profiles.length,
        mechanics: skillsSums.mechanics / profiles.length
      };

      // Distribution des rôles
      const roleDistribution = profiles.reduce((acc, p) => {
        acc[p.preferredRole] = (acc[p.preferredRole] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      // Distribution des styles de travail
      const workStyleDistribution = profiles.reduce((acc, p) => {
        acc[p.motivation.workStyle] = (acc[p.motivation.workStyle] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return {
        totalProfiles: profiles.length,
        averageSkills,
        roleDistribution,
        workStyleDistribution
      };

    } catch (error) {
      this.logger.error('Error getting profile stats:', error);
      throw error;
    }
  }

  /**
   * Obtient les détails enrichis d'un profil (avec classe, suggestions, etc.)
   */
  async getEnrichedProfile(userId: string): Promise<{
    profile: PlayerProfile;
    playerClass: string;
    overallScore: number;
    suggestions: string[];
  } | null> {
    try {
      const challenge = this.getChallenge();
      const team = { id: userId, name: '' };
      const profile = await challenge.getProfile(team);

      if (!profile) {
        return null;
      }

      return {
        profile,
        playerClass: challenge.identifyPlayerClass(profile),
        overallScore: challenge.calculateOverallScore(profile),
        suggestions: challenge.generateSuggestions(profile)
      };

    } catch (error) {
      this.logger.error(`Error getting enriched profile for user ${userId}:`, error);
      throw error;
    }
  }
}
