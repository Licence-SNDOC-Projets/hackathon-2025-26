import { Controller, Get, Post, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ChallengeService } from './challenge.service';
import {
  Team,
  ChallengeStatus,
  RobotTelemetry,
  MQTTTopicBuilder
} from '@wizard-console/challenge';

/**
 * DTO pour l'enregistrement d'une équipe
 */
interface RegisterTeamDto {
  name: string;
  id: string;
  members?: string[];
}

/**
 * DTO pour une demande de challenge
 */
interface ChallengeRequestDto {
  teamId: string;
  challengeId: string;
}

/**
 * DTO pour démarrer un challenge
 */
interface StartChallengeDto {
  teamId: string;
  challengeId: string;
}

/**
 * DTO pour les données de télémétrie
 */
interface TelemetryDto {
  teamId: string;
  challengeId: string;
  telemetry: RobotTelemetry;
}

/**
 * Contrôleur REST pour l'API des challenges
 *
 * Ce contrôleur expose les fonctionnalités de la librairie Challenge
 * via une API REST pour le frontend et les intégrations externes.
 */
@Controller('api/challenges')
export class ChallengeController {
  constructor(private readonly challengeService: ChallengeService) {}

  /**
   * GET /api/challenges
   * Obtient la liste de tous les challenges disponibles
   */
  @Get()
  getAvailableChallenges() {
    try {
      const challenges = this.challengeService.getAvailableChallenges();
      return {
        success: true,
        data: challenges,
        count: challenges.length
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des challenges: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/challenges/:challengeId
   * Obtient les détails d'un challenge spécifique
   */
  @Get(':challengeId')
  getChallenge(@Param('challengeId') challengeId: string) {
    try {
      const challenge = this.challengeService.getChallenge(challengeId);

      if (!challenge) {
        throw new HttpException(
          `Challenge ${challengeId} introuvable`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: {
          id: challengeId,
          config: challenge.getConfig(),
          topics: {
            team: MQTTTopicBuilder.team('TEAM_ID'),
            challenge: MQTTTopicBuilder.challenge(challengeId)
          }
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération du challenge: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/challenges/teams/register
   * Enregistre une nouvelle équipe dans le système
   */
  @Post('teams/register')
  async registerTeam(@Body() registerTeamDto: RegisterTeamDto) {
    try {
      const team = await this.challengeService.registerTeam(registerTeamDto);

      return {
        success: true,
        data: {
          team,
          mqttTopics: this.challengeService.getTeamMQTTTopics(team.id)
        },
        message: `Équipe ${team.name} enregistrée avec succès`
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'enregistrement de l'équipe: ${error}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * POST /api/challenges/request
   * Traite une demande de challenge d'une équipe
   */
  @Post('request')
  async requestChallenge(@Body() challengeRequestDto: ChallengeRequestDto) {
    try {
      const result = await this.challengeService.handleChallengeRequest(
        challengeRequestDto.teamId,
        challengeRequestDto.challengeId
      );

      const statusCode = result.status === ChallengeStatus.ACCEPTED
        ? HttpStatus.OK
        : HttpStatus.BAD_REQUEST;

      return {
        success: result.status === ChallengeStatus.ACCEPTED,
        data: {
          status: result.status,
          topics: result.topics,
          challengeId: challengeRequestDto.challengeId,
          teamId: challengeRequestDto.teamId
        },
        message: result.message
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la demande de challenge: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/challenges/start
   * Démarre un challenge pour une équipe
   */
  @Post('start')
  async startChallenge(@Body() startChallengeDto: StartChallengeDto) {
    try {
      const result = await this.challengeService.startChallenge(
        startChallengeDto.teamId,
        startChallengeDto.challengeId
      );

      if (!result.success) {
        throw new HttpException(result.message, HttpStatus.BAD_REQUEST);
      }

      return {
        success: true,
        data: {
          startTime: result.startTime,
          challengeId: startChallengeDto.challengeId,
          teamId: startChallengeDto.teamId,
          topics: {
            telemetry: this.challengeService.getTeamMQTTTopics(startChallengeDto.teamId).debug.telemetry,
            scores: this.challengeService.getChallengeMQTTTopics(
              startChallengeDto.challengeId,
              startChallengeDto.teamId
            )
          }
        },
        message: result.message
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors du démarrage du challenge: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/challenges/telemetry
   * Traite des données de télémétrie d'une équipe
   */
  @Post('telemetry')
  async processTelemetry(@Body() telemetryDto: TelemetryDto) {
    try {
      const result = await this.challengeService.processTelemetry(
        telemetryDto.teamId,
        telemetryDto.challengeId,
        telemetryDto.telemetry
      );

      return {
        success: result.processed,
        data: {
          events: result.events,
          teamId: telemetryDto.teamId,
          challengeId: telemetryDto.challengeId,
          timestamp: telemetryDto.telemetry.timestamp
        },
        message: result.message
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors du traitement de la télémétrie: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/challenges/mqtt/topics/team/:teamId
   * Obtient les topics MQTT pour une équipe
   */
  @Get('mqtt/topics/team/:teamId')
  getTeamMQTTTopics(@Param('teamId') teamId: string) {
    try {
      const topics = this.challengeService.getTeamMQTTTopics(teamId);

      return {
        success: true,
        data: {
          teamId,
          topics
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la génération des topics MQTT: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/challenges/mqtt/topics/challenge/:challengeId
   * Obtient les topics MQTT pour un challenge
   */
  @Get('mqtt/topics/challenge/:challengeId')
  getChallengeMQTTTopics(@Param('challengeId') challengeId: string) {
    try {
      const topics = this.challengeService.getChallengeMQTTTopics(challengeId);

      return {
        success: true,
        data: {
          challengeId,
          topics
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la génération des topics MQTT: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/challenges/mqtt/parse-topic
   * Parse un topic MQTT pour extraire les informations
   */
  @Post('mqtt/parse-topic')
  parseMQTTTopic(@Body() body: { topic: string }) {
    try {
      const parsedTopic = this.challengeService.parseMQTTTopic(body.topic);

      if (!parsedTopic) {
        throw new HttpException(
          `Topic MQTT non reconnu: ${body.topic}`,
          HttpStatus.BAD_REQUEST
        );
      }

      return {
        success: true,
        data: {
          originalTopic: body.topic,
          parsed: parsedTopic
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors du parsing du topic MQTT: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/challenges/stats
   * Obtient les statistiques globales des challenges
   */
  @Get('stats')
  getChallengeStats() {
    try {
      const stats = this.challengeService.getChallengeStats();

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération des statistiques: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/challenges/health
   * Endpoint de santé pour vérifier le bon fonctionnement du service
   */
  @Get('health')
  getHealthCheck() {
    const stats = this.challengeService.getChallengeStats();

    return {
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      data: {
        challengesAvailable: stats.totalChallenges,
        teamsRegistered: stats.totalTeams,
        uptime: process.uptime()
      }
    };
  }
}
