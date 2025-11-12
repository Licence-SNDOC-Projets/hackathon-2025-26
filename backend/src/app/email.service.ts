import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

/**
 * Interface pour les options d'envoi d'email
 */
export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html?: string;
  text?: string;
  attachments?: Array<{
    filename: string;
    content?: Buffer;
    path?: string;
    contentType?: string;
  }>;
}

/**
 * Interface pour les données de template
 */
export interface EmailTemplateData {
  challengeName?: string;
  teamName?: string;
  finalScore?: number;
  position?: number;
  bestLapTime?: string;
  totalTime?: string;
  dateTime?: string;
  additionalInfo?: Record<string, any>;
}

/**
 * Service d'envoi d'emails avec Office365
 *
 * Ce service gère l'envoi d'emails via Office365 SMTP pour :
 * - Notifications de fin de challenges
 * - Résultats de courses
 * - Communications avec les équipes
 * - Rapports d'activité
 */
@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private simulationMode = false;

  constructor(private configService: ConfigService) {
    this.createTransporter();
  }

  /**
   * Crée le transporteur nodemailer avec les paramètres Office365
   */
  private createTransporter() {
    const emailConfig = {
      host: this.configService.get<string>('EMAIL_HOST', 'smtp-mail.outlook.com'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      secure: false, // false pour TLS (587), true pour SSL (465)
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD')
      },
      tls: {
        ciphers: 'SSLv3',
        rejectUnauthorized: false
      }
    };

    this.transporter = nodemailer.createTransport(emailConfig);

    // Vérifier la connexion au démarrage
    this.verifyConnection();
  }

  /**
   * Vérifie la connexion SMTP
   */
  private async verifyConnection() {
    try {
      await this.transporter.verify();
      this.logger.log('✅ Connexion SMTP Office365 établie avec succès');
      this.simulationMode = false;
    } catch (error) {
      this.logger.warn('⚠️ Connexion SMTP échouée, activation du mode simulation');
      this.logger.warn('Raison:', error.message);
      this.logger.log('💡 Pour utiliser les vraies emails, configurez un App Password Gmail ou contactez l\'admin IT');
      this.simulationMode = true;
    }
  }

  /**
   * Envoie un email simple
   */
  async sendEmail(options: SendEmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    // Mode simulation si la connexion SMTP a échoué
    if (this.simulationMode) {
      const simulatedMessageId = `sim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      this.logger.log('🎭 MODE SIMULATION - Email simulé:');
      this.logger.log(`   📧 À: ${Array.isArray(options.to) ? options.to.join(', ') : options.to}`);
      this.logger.log(`   📝 Sujet: ${options.subject}`);
      this.logger.log(`   🕐 Heure: ${new Date().toLocaleString('fr-FR')}`);
      this.logger.log(`   🆔 MessageID simulé: ${simulatedMessageId}`);

      if (options.html && options.html.length > 100) {
        this.logger.log(`   📄 Contenu HTML: ${options.html.substring(0, 100)}...`);
      }

      return {
        success: true,
        messageId: simulatedMessageId
      };
    }

    // Mode réel avec SMTP
    try {
      const fromAddress = this.configService.get<string>('EMAIL_FROM_ADDRESS');
      const fromName = this.configService.get<string>('EMAIL_FROM_NAME', 'Hackathon MQTT Race');

      const mailOptions = {
        from: `"${fromName}" <${fromAddress}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments
      };

      const info = await this.transporter.sendMail(mailOptions);

      this.logger.log(`📧 Email envoyé avec succès à ${options.to} - MessageID: ${info.messageId}`);

      return {
        success: true,
        messageId: info.messageId
      };

    } catch (error) {
      this.logger.error('❌ Erreur lors de l\'envoi d\'email:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Envoie un email de test
   */
  async sendTestEmail(recipient: string): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const testHtml = this.generateTestEmailHtml();

    return this.sendEmail({
      to: recipient,
      subject: '🚀 Test Email - Hackathon MQTT Race',
      html: testHtml,
      text: 'Email de test depuis le backend WizardConsole du hackathon MQTT Race!'
    });
  }

  /**
   * Envoie un email de notification de fin de challenge
   */
  async sendChallengeCompletionEmail(
    recipient: string,
    templateData: EmailTemplateData
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const html = this.generateChallengeCompletionHtml(templateData);

    return this.sendEmail({
      to: recipient,
      subject: `🏁 Challenge ${templateData.challengeName} - Résultats finaux`,
      html,
      text: `Challenge ${templateData.challengeName} terminé ! Équipe: ${templateData.teamName}, Position: ${templateData.position}, Score: ${templateData.finalScore}`
    });
  }

  /**
   * Envoie un rapport d'activité journalier
   */
  async sendDailyReport(
    recipient: string,
    challengeStats: {
      totalChallenges: number;
      totalTeams: number;
      completedRuns: number;
      averageTime: number;
      errors: string[];
    }
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    const html = this.generateDailyReportHtml(challengeStats);

    return this.sendEmail({
      to: recipient,
      subject: `📊 Rapport quotidien - Hackathon MQTT Race ${new Date().toLocaleDateString('fr-FR')}`,
      html,
      text: `Rapport quotidien: ${challengeStats.totalChallenges} challenges, ${challengeStats.totalTeams} équipes, ${challengeStats.completedRuns} runs complétés.`
    });
  }

  /**
   * Génère le HTML pour l'email de test
   */
  private generateTestEmailHtml(): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f0f0f0;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f0f0f0; padding: 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #003566; border: 3px solid #00b4d8; border-radius: 15px; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);">

                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 30px 20px; text-align: center; background-color: #001d3d; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #00b4d8; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                        🚀 HACKATHON MQTT RACE 🚀
                      </h1>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px; color: #ffffff; font-size: 16px; line-height: 1.6;">

                      <p style="margin: 0 0 20px; color: #ffffff;">
                        <strong>Salut !</strong>
                      </p>

                      <p style="margin: 0 0 20px; color: #ffffff;">
                        Ceci est un <strong style="color: #ffd60a;">email de test</strong> depuis le backend
                        <strong style="color: #00b4d8;">WizardConsole</strong> du hackathon "MQTT Race".
                      </p>

                      <p style="margin: 0 0 15px; color: #ffffff;">
                        Si vous recevez cet email, cela signifie que :
                      </p>

                      <table width="100%" style="margin: 20px 0;">
                        <tr>
                          <td style="padding: 8px; background-color: rgba(0, 180, 216, 0.1); border-left: 4px solid #00b4d8; margin-bottom: 5px;">
                            <span style="color: #00ff88; font-size: 18px;">✅</span>
                            <span style="color: #ffffff; margin-left: 10px;">La configuration Office365 est correcte</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; background-color: rgba(0, 180, 216, 0.1); border-left: 4px solid #00b4d8; margin-bottom: 5px;">
                            <span style="color: #00ff88; font-size: 18px;">✅</span>
                            <span style="color: #ffffff; margin-left: 10px;">Le service d'emails fonctionne</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; background-color: rgba(0, 180, 216, 0.1); border-left: 4px solid #00b4d8; margin-bottom: 5px;">
                            <span style="color: #00ff88; font-size: 18px;">✅</span>
                            <span style="color: #ffffff; margin-left: 10px;">Les challenges peuvent envoyer des notifications</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding: 8px; background-color: rgba(0, 180, 216, 0.1); border-left: 4px solid #00b4d8;">
                            <span style="color: #00ff88; font-size: 18px;">✅</span>
                            <span style="color: #ffffff; margin-left: 10px;">Le système est prêt pour le hackathon !</span>
                          </td>
                        </tr>
                      </table>

                      <table width="100%" style="margin: 30px 0; background-color: rgba(255, 214, 10, 0.1); border: 1px solid #ffd60a; border-radius: 8px;">
                        <tr>
                          <td style="padding: 20px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #ffd60a; font-weight: bold;">INFORMATIONS SYSTÈME</p>
                            <p style="margin: 0 0 5px; color: #ffffff;">
                              <strong>Timestamp :</strong>
                              <span style="color: #ffd60a;">${new Date().toLocaleString('fr-FR')}</span>
                            </p>
                            <p style="margin: 0; color: #ffffff;">
                              <strong>Serveur :</strong>
                              <span style="color: #ffd60a;">WizardConsole Backend</span>
                            </p>
                          </td>
                        </tr>
                      </table>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: rgba(0, 29, 61, 0.5); border-radius: 0 0 12px 12px; border-top: 1px solid #00b4d8;">
                      <p style="margin: 0 0 10px; color: #00b4d8; font-size: 14px;">
                        🤖 Message automatique du système WizardConsole
                      </p>
                      <p style="margin: 0; color: #ffffff; font-size: 14px; opacity: 0.8;">
                        Hackathon IoT & Robot Connecté - "MQTT Race"
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  /**
   * Génère le HTML pour l'email de fin de challenge
   */
  private generateChallengeCompletionHtml(data: EmailTemplateData): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Courier New', monospace; background: #000814; color: #00ffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #001d3d; border: 2px solid #00ff88; border-radius: 10px; padding: 30px; box-shadow: 0 0 20px rgba(0, 255, 136, 0.3); }
            .header { text-align: center; font-size: 2rem; margin-bottom: 30px; text-shadow: 0 0 10px #00ff88; }
            .trophy { font-size: 3rem; text-align: center; margin: 20px 0; }
            .results { background: rgba(0, 255, 255, 0.1); padding: 20px; border-radius: 5px; margin: 20px 0; }
            .stat { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px; background: rgba(0, 136, 255, 0.1); border-radius: 3px; }
            .highlight { color: #ffd60a; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; font-size: 0.9rem; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">🏁 CHALLENGE TERMINÉ 🏁</div>
            <div class="trophy">
              ${data.position === 1 ? '🥇' : data.position === 2 ? '🥈' : data.position === 3 ? '🥉' : '🏆'}
            </div>
            <div class="results">
              <h2 style="color: #00ff88; text-align: center;">Résultats finaux</h2>
              <div class="stat"><span>Challenge :</span><span class="highlight">${data.challengeName}</span></div>
              <div class="stat"><span>Équipe :</span><span class="highlight">${data.teamName}</span></div>
              <div class="stat"><span>Position :</span><span class="highlight">${data.position}${data.position === 1 ? 'er' : 'ème'}</span></div>
              <div class="stat"><span>Score final :</span><span class="highlight">${data.finalScore} points</span></div>
              <div class="stat"><span>Meilleur tour :</span><span class="highlight">${data.bestLapTime}</span></div>
              <div class="stat"><span>Temps total :</span><span class="highlight">${data.totalTime}</span></div>
            </div>
            <div class="footer">
              <p>🤖 Résultats automatiques - ${data.dateTime}</p>
              <p>Hackathon MQTT Race - WizardConsole</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Génère le HTML pour le rapport quotidien
   */
  private generateDailyReportHtml(stats: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: 'Courier New', monospace; background: #000814; color: #00ffff; margin: 0; padding: 20px; }
            .container { max-width: 600px; margin: 0 auto; background: #001d3d; border: 2px solid #ffd60a; border-radius: 10px; padding: 30px; }
            .header { text-align: center; font-size: 2rem; margin-bottom: 30px; color: #ffd60a; }
            .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
            .stat-box { background: rgba(0, 255, 255, 0.1); padding: 15px; border-radius: 5px; text-align: center; }
            .stat-value { font-size: 2rem; font-weight: bold; color: #ffd60a; display: block; }
            .stat-label { font-size: 0.8rem; opacity: 0.8; }
            .errors { background: rgba(255, 68, 68, 0.1); padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { margin-top: 30px; text-align: center; font-size: 0.9rem; opacity: 0.8; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">📊 RAPPORT QUOTIDIEN</div>
            <div class="stats-grid">
              <div class="stat-box">
                <span class="stat-value">${stats.totalChallenges}</span>
                <span class="stat-label">CHALLENGES</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">${stats.totalTeams}</span>
                <span class="stat-label">ÉQUIPES</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">${stats.completedRuns}</span>
                <span class="stat-label">RUNS COMPLÉTÉS</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">${(stats.averageTime / 1000).toFixed(1)}s</span>
                <span class="stat-label">TEMPS MOYEN</span>
              </div>
            </div>
            ${stats.errors.length > 0 ? `
              <div class="errors">
                <h3>⚠️ Erreurs détectées :</h3>
                ${stats.errors.map(error => `<p>• ${error}</p>`).join('')}
              </div>
            ` : '<p style="color: #00ff88; text-align: center;">✅ Aucune erreur détectée aujourd\'hui</p>'}
            <div class="footer">
              <p>🤖 Rapport automatique - ${new Date().toLocaleString('fr-FR')}</p>
              <p>Hackathon MQTT Race - WizardConsole</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Obtient les informations de configuration email (pour debug)
   */
  getEmailConfig(): {
    host: string;
    port: number;
    user: string;
    fromAddress: string;
    fromName: string;
  } {
    return {
      host: this.configService.get<string>('EMAIL_HOST', 'smtp-mail.outlook.com'),
      port: this.configService.get<number>('EMAIL_PORT', 587),
      user: this.configService.get<string>('EMAIL_USER') || 'non configuré',
      fromAddress: this.configService.get<string>('EMAIL_FROM_ADDRESS') || 'non configuré',
      fromName: this.configService.get<string>('EMAIL_FROM_NAME', 'Hackathon MQTT Race')
    };
  }

  /**
   * Vérifie si le service email est correctement configuré
   */
  isConfigured(): boolean {
    const user = this.configService.get<string>('EMAIL_USER');
    const password = this.configService.get<string>('EMAIL_PASSWORD');

    return !!(user && password);
  }

  /**
   * Indique si le service fonctionne en mode simulation
   */
  isSimulationMode(): boolean {
    return this.simulationMode;
  }

  /**
   * Force le mode simulation (utile pour les tests)
   */
  enableSimulationMode(enable: boolean = true) {
    this.simulationMode = enable;
    this.logger.log(`🎭 Mode simulation ${enable ? 'activé' : 'désactivé'}`);
  }
}
