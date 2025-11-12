import { Controller, Post, Get, Body, HttpException, HttpStatus } from '@nestjs/common';
import { EmailService, SendEmailOptions, EmailTemplateData } from './email.service';

/**
 * DTO pour envoyer un email personnalisé
 */
interface SendEmailDto {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

/**
 * DTO pour envoyer un email de fin de challenge
 */
interface ChallengeEmailDto {
  recipient: string;
  challengeName: string;
  teamName: string;
  finalScore: number;
  position: number;
  bestLapTime: string;
  totalTime: string;
}

/**
 * Contrôleur pour l'envoi d'emails
 *
 * Ce contrôleur expose les endpoints pour :
 * - Envoyer des emails de test
 * - Notifier les fins de challenges
 * - Envoyer des rapports d'activité
 * - Configuration et debug des emails
 */
@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * GET /api/email/test
   * Envoie un email de test à l'adresse spécifiée
   */
  @Get('test')
  async sendTestEmail() {
    try {
      const result = await this.emailService.sendTestEmail('s.brissy@lasalle84.org');

      if (!result.success) {
        throw new HttpException(
          `Erreur lors de l'envoi du test: ${result.error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: 'Email de test envoyé avec succès à s.brissy@lasalle84.org',
        data: {
          messageId: result.messageId,
          recipient: 's.brissy@lasalle84.org',
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      throw new HttpException(
        `Erreur lors de l'envoi du test email: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/email/send
   * Envoie un email personnalisé
   */
  @Post('send')
  async sendCustomEmail(@Body() sendEmailDto: SendEmailDto) {
    try {
      if (!sendEmailDto.to || !sendEmailDto.subject) {
        throw new HttpException(
          'Les champs "to" et "subject" sont obligatoires',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.emailService.sendEmail(sendEmailDto);

      if (!result.success) {
        throw new HttpException(
          `Erreur lors de l'envoi: ${result.error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: 'Email envoyé avec succès',
        data: {
          messageId: result.messageId,
          recipients: Array.isArray(sendEmailDto.to) ? sendEmailDto.to : [sendEmailDto.to],
          subject: sendEmailDto.subject,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'envoi d'email: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/email/challenge-completion
   * Envoie un email de notification de fin de challenge
   */
  @Post('challenge-completion')
  async sendChallengeCompletionEmail(@Body() challengeEmailDto: ChallengeEmailDto) {
    try {
      const templateData: EmailTemplateData = {
        challengeName: challengeEmailDto.challengeName,
        teamName: challengeEmailDto.teamName,
        finalScore: challengeEmailDto.finalScore,
        position: challengeEmailDto.position,
        bestLapTime: challengeEmailDto.bestLapTime,
        totalTime: challengeEmailDto.totalTime,
        dateTime: new Date().toLocaleString('fr-FR')
      };

      const result = await this.emailService.sendChallengeCompletionEmail(
        challengeEmailDto.recipient,
        templateData
      );

      if (!result.success) {
        throw new HttpException(
          `Erreur lors de l'envoi: ${result.error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: 'Email de fin de challenge envoyé avec succès',
        data: {
          messageId: result.messageId,
          recipient: challengeEmailDto.recipient,
          challengeName: challengeEmailDto.challengeName,
          teamName: challengeEmailDto.teamName,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'envoi d'email de challenge: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/email/daily-report
   * Envoie un rapport quotidien d'activité
   */
  @Post('daily-report')
  async sendDailyReport(@Body() body: { recipient: string }) {
    try {
      // Récupérer les statistiques actuelles (simulation pour l'exemple)
      const challengeStats = {
        totalChallenges: 1,
        totalTeams: 4,
        completedRuns: 12,
        averageTime: 45000, // 45 secondes
        errors: []
      };

      const result = await this.emailService.sendDailyReport(
        body.recipient,
        challengeStats
      );

      if (!result.success) {
        throw new HttpException(
          `Erreur lors de l'envoi: ${result.error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: 'Rapport quotidien envoyé avec succès',
        data: {
          messageId: result.messageId,
          recipient: body.recipient,
          stats: challengeStats,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'envoi du rapport: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/email/config
   * Obtient la configuration email (sans mots de passe)
   */
  @Get('config')
  getEmailConfig() {
    try {
      const config = this.emailService.getEmailConfig();
      const isConfigured = this.emailService.isConfigured();

      return {
        success: true,
        data: {
          ...config,
          user: config.user.replace(/(.{2}).*(@.*)/, '$1***$2'), // Masquer le mot de passe
          isConfigured,
          status: isConfigured ? 'Configuré' : 'Configuration incomplète'
        }
      };

    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération de la config: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/email/health
   * Vérifie l'état de santé du service email
   */
  @Get('health')
  getEmailHealth() {
    const isConfigured = this.emailService.isConfigured();
    const config = this.emailService.getEmailConfig();

    return {
      success: true,
      status: isConfigured ? 'healthy' : 'configuration_needed',
      data: {
        configured: isConfigured,
        host: config.host,
        port: config.port,
        fromAddress: config.fromAddress,
        timestamp: new Date().toISOString(),
        message: isConfigured
          ? 'Service email prêt à envoyer des messages'
          : 'Configuration EMAIL_USER et EMAIL_PASSWORD requise dans .env'
      }
    };
  }
}
