import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  challengeRegistry,
  TronLegacyCircuitChallenge,
  BaseChallenge,
  Team,
  ChallengeStatus,
  MQTTTopicBuilder,
  MQTTTopicParser,
  RobotTelemetry,
  ChallengeRequestEvent,
  MQTTEventType
} from '@wizard-console/challenge';

/**
 * Service NestJS pour la gestion des challenges
 *
 * Ce service fait le lien entre la librairie Challenge et l'API REST du backend.
 * Il gère l'enregistrement des challenges, les demandes des équipes et la communication MQTT.
 */
@Injectable()
export class ChallengeService implements OnModuleInit {
  private activeTeams = new Map<string, Team>();

  /**
   * Initialisation du service au démarrage du module
   */
  async onModuleInit() {
    console.log('🚀 Initialisation du service des challenges...');

    // Écouter les événements du registry
    challengeRegistry.on('challenge-registered', (event) => {
      console.log(`✅ Challenge enregistré: ${event.challengeId} v${event.registration.version}`);
    });

    // Le challenge "Tron Legacy Circuit" est automatiquement enregistré
    // grâce au décorateur @RegisterChallenge

    // Afficher les challenges disponibles
    this.logAvailableChallenges();
  }

  /**
   * Obtient la liste de tous les challenges disponibles
   */
  getAvailableChallenges() {
    return challengeRegistry.getAllChallenges();
  }

  /**
   * Obtient un challenge par son ID
   */
  getChallenge(challengeId: string): BaseChallenge | null {
    return challengeRegistry.getChallenge(challengeId);
  }

  /**
   * Enregistre une nouvelle équipe
   */
  async registerTeam(teamData: { name: string; id: string; members?: string[] }): Promise<Team> {
    const team: Team = {
      id: teamData.id,
      name: teamData.name,
      members: teamData.members || []
    };

    this.activeTeams.set(team.id, team);
    console.log(`👥 Équipe enregistrée: ${team.name} (${team.id})`);

    return team;
  }

  /**
   * Traite une demande de challenge d'une équipe
   */
  async handleChallengeRequest(teamId: string, challengeId: string): Promise<{
    status: ChallengeStatus;
    message: string;
    topics?: {
      status: string;
      countdown: string;
    };
  }> {
    const team = this.activeTeams.get(teamId);
    if (!team) {
      return {
        status: ChallengeStatus.DENIED,
        message: `Équipe ${teamId} non enregistrée`
      };
    }

    const challenge = challengeRegistry.getChallenge(challengeId);
    if (!challenge) {
      return {
        status: ChallengeStatus.DENIED,
        message: `Challenge ${challengeId} introuvable`
      };
    }

    // Vérifier si l'équipe peut participer
    const canParticipate = await challenge.canTeamParticipate(team);
    if (!canParticipate) {
      return {
        status: ChallengeStatus.DENIED,
        message: `L'équipe ${team.name} ne peut pas participer au challenge ${challengeId}`
      };
    }

    // Préparer le challenge pour l'équipe
    await challenge.prepareForTeam(team);

    // Générer les topics MQTT pertinents
    const challengeTopics = MQTTTopicBuilder.challenge(challengeId, teamId);
    const countdownTopics = MQTTTopicBuilder.challenge(challengeId);

    return {
      status: ChallengeStatus.ACCEPTED,
      message: `Challenge ${challengeId} accepté pour l'équipe ${team.name}`,
      topics: {
        status: challengeTopics.status,
        countdown: countdownTopics.countdown.value
      }
    };
  }

  /**
   * Démarre un challenge pour une équipe
   */
  async startChallenge(teamId: string, challengeId: string): Promise<{
    success: boolean;
    message: string;
    startTime?: number;
  }> {
    const team = this.activeTeams.get(teamId);
    const challenge = challengeRegistry.getChallenge(challengeId);

    if (!team || !challenge) {
      return {
        success: false,
        message: 'Équipe ou challenge introuvable'
      };
    }

    try {
      await challenge.startChallenge(team);
      const startTime = Date.now();

      console.log(`🏁 Challenge ${challengeId} démarré pour l'équipe ${team.name}`);

      return {
        success: true,
        message: `Challenge démarré pour l'équipe ${team.name}`,
        startTime
      };
    } catch (error) {
      return {
        success: false,
        message: `Erreur lors du démarrage: ${error}`
      };
    }
  }

  /**
   * Traite des données de télémétrie d'une équipe
   */
  async processTelemetry(teamId: string, challengeId: string, telemetryData: RobotTelemetry): Promise<{
    processed: boolean;
    message: string;
    events?: any[];
  }> {
    const team = this.activeTeams.get(teamId);
    const challenge = challengeRegistry.getChallenge(challengeId);

    if (!team || !challenge) {
      return {
        processed: false,
        message: 'Équipe ou challenge introuvable'
      };
    }

    try {
      await challenge.processTelemetry(team, telemetryData);

      // Analyser les données pour détecter des événements
      const events = this.analyzeTelemtryForEvents(team, challengeId, telemetryData);

      return {
        processed: true,
        message: 'Télémétrie traitée avec succès',
        events
      };
    } catch (error) {
      return {
        processed: false,
        message: `Erreur lors du traitement: ${error}`
      };
    }
  }

  /**
   * Obtient les topics MQTT pour une équipe
   */
  getTeamMQTTTopics(teamId: string) {
    return MQTTTopicBuilder.team(teamId);
  }

  /**
   * Obtient les topics MQTT pour un challenge
   */
  getChallengeMQTTTopics(challengeId: string, teamId?: string) {
    return MQTTTopicBuilder.challenge(challengeId, teamId);
  }

  /**
   * Parse un topic MQTT pour extraire les informations
   */
  parseMQTTTopic(topic: string) {
    // Essayer de parser comme topic d'équipe
    const teamTopic = MQTTTopicParser.parseTeamTopic(topic);
    if (teamTopic) {
      return { type: 'team', ...teamTopic };
    }

    // Essayer de parser comme topic de challenge
    const challengeTopic = MQTTTopicParser.parseChallengeTopic(topic);
    if (challengeTopic) {
      return { type: 'challenge', ...challengeTopic };
    }

    // Essayer de parser comme topic de balise
    const beaconTopic = MQTTTopicParser.parseBeaconTopic(topic);
    if (beaconTopic) {
      return { type: 'beacon', ...beaconTopic };
    }

    return null;
  }

  /**
   * Obtient les statistiques des challenges
   */
  getChallengeStats() {
    const challenges = challengeRegistry.getAllChallenges();
    const totalTeams = this.activeTeams.size;

    return {
      totalChallenges: challenges.length,
      totalTeams,
      challenges: challenges.map(c => ({
        id: c.id,
        name: c.config.name,
        description: c.config.description
      })),
      teams: Array.from(this.activeTeams.values()).map(t => ({
        id: t.id,
        name: t.name,
        memberCount: t.members?.length || 0
      }))
    };
  }

  /**
   * Affiche les challenges disponibles dans les logs
   */
  private logAvailableChallenges() {
    const challenges = challengeRegistry.getAllChallenges();

    console.log(`📊 Challenges disponibles: ${challenges.length}`);
    challenges.forEach(challenge => {
      console.log(`   - ${challenge.id}: ${challenge.config.name}`);
      console.log(`     ${challenge.config.description}`);
      if (challenge.config.maxLaps) {
        console.log(`     Tours max: ${challenge.config.maxLaps}`);
      }
      if (challenge.config.maxDuration) {
        console.log(`     Durée max: ${(challenge.config.maxDuration / 1000).toFixed(0)}s`);
      }
    });
  }

  /**
   * Analyse la télémétrie pour détecter des événements
   */
  private analyzeTelemtryForEvents(team: Team, challengeId: string, telemetry: RobotTelemetry): any[] {
    const events: any[] = [];

    // Détecter si le robot a terminé un tour (exemple basique)
    if (telemetry.state.following_line && telemetry.sensors.line_sensors) {
      const centerSensor = telemetry.sensors.line_sensors[1];
      if (centerSensor > 800) { // Seuil pour détection de ligne d'arrivée
        events.push({
          type: MQTTEventType.LAP_COMPLETED,
          timestamp: telemetry.timestamp,
          teamId: team.id,
          challengeId,
          data: {
            sensorValue: centerSensor
          }
        });
      }
    }

    // Détecter des erreurs
    if (telemetry.state.errors && telemetry.state.errors.length > 0) {
      events.push({
        type: MQTTEventType.ERROR,
        timestamp: telemetry.timestamp,
        teamId: team.id,
        challengeId,
        data: {
          errors: telemetry.state.errors
        }
      });
    }

    return events;
  }
}
