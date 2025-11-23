import { Controller, Post, Get, Body, HttpException, HttpStatus, UseGuards, Request, Query } from '@nestjs/common';
import { AuthService, MagicLinkRequestDto, LoginResponse } from './auth.service';
import { EmailService } from './email.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Contrôleur d'authentification
 *
 * Gère uniquement l'authentification par magic link
 * Les droits admin sont déterminés automatiquement via l'email
 */
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly emailService: EmailService
  ) {}

  /**
   * POST /api/auth/magic-link
   * Génère et envoie un magic link par email (admin ou étudiant selon l'email)
   */
  @Post('magic-link')
  async requestMagicLink(@Body() magicLinkDto: MagicLinkRequestDto): Promise<{
    success: boolean;
    message: string;
    email: string;
  }> {
    try {
      if (!magicLinkDto.email) {
        throw new HttpException(
          'Adresse email requise',
          HttpStatus.BAD_REQUEST
        );
      }

      // Valider le format email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(magicLinkDto.email)) {
        throw new HttpException(
          'Format d\'email invalide',
          HttpStatus.BAD_REQUEST
        );
      }

      // Générer le magic link (admin ou étudiant automatiquement détecté)
      const { token, magicLink, expiresIn } = await this.authService.generateMagicLink(magicLinkDto.email);

      // Envoyer l'email avec le magic link
      const emailResult = await this.emailService.sendEmail({
        to: magicLinkDto.email,
        subject: '🔑 Votre accès au Hackathon MQTT Race',
        html: this.generateMagicLinkEmailHtml(magicLink, magicLinkDto.email, expiresIn),
        text: `Votre lien d'accès au hackathon: ${magicLink} (valide ${expiresIn / 3600}h)`
      });

      if (!emailResult.success) {
        throw new HttpException(
          `Erreur lors de l'envoi de l'email: ${emailResult.error}`,
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }

      return {
        success: true,
        message: `Magic link envoyé à ${magicLinkDto.email}`,
        email: magicLinkDto.email
      };

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la génération du magic link: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/auth/verify-magic-link
   * Valide un magic link et génère un token de session
   */
  @Get('verify-magic-link')
  async verifyMagicLink(@Query('token') token: string): Promise<LoginResponse> {
    try {
      if (!token) {
        throw new HttpException(
          'Token requis',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.authService.validateMagicLinkToken(token);

      return result;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la validation du magic link: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/auth/profile
   * Obtient le profil de l'utilisateur connecté (route protégée)
   */
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return {
      success: true,
      data: {
        user: req.user,
        timestamp: new Date().toISOString(),
        message: 'Profil utilisateur récupéré avec succès'
      }
    };
  }

  /**
   * POST /api/auth/logout
   * Révoque le token JWT (route protégée)
   */
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Request() req: any): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      // Extraire le token du header Authorization
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await this.authService.revokeToken(token);
      }

      return {
        success: true,
        message: 'Déconnexion réussie'
      };

    } catch (error) {
      throw new HttpException(
        `Erreur lors de la déconnexion: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/auth/verify
   * Vérifie la validité d'un token JWT (route protégée)
   */
  @UseGuards(JwtAuthGuard)
  @Get('verify')
  verifyToken(@Request() req: any) {
    return {
      success: true,
      data: {
        valid: true,
        user: req.user,
        timestamp: new Date().toISOString(),
        message: 'Token valide'
      }
    };
  }

  /**
   * GET /api/auth/config
   * Obtient la configuration d'authentification (public)
   */
  @Get('config')
  getAuthConfig() {
    try {
      const config = this.authService.getAuthConfig();

      return {
        success: true,
        data: {
          ...config,
          authMethod: 'magic-link',
          endpoints: {
            magicLink: '/api/auth/magic-link',
            verifyMagicLink: '/api/auth/verify-magic-link',
            profile: '/api/auth/profile',
            logout: '/api/auth/logout',
            verify: '/api/auth/verify'
          },
          description: 'Authentification uniquement par magic link. Les emails admin sont configurés dans ADMIN_EMAILS.'
        }
      };

    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération de la config auth: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/auth/health
   * Vérifie l'état de santé du service d'authentification
   */
  @Get('health')
  getAuthHealth() {
    const config = this.authService.getAuthConfig();
    const emailConfigured = this.emailService.isConfigured();

    return {
      success: true,
      status: (config.configured && emailConfigured) ? 'healthy' : 'configuration_needed',
      data: {
        authConfigured: config.configured,
        emailConfigured: emailConfigured,
        adminEmailsCount: config.adminEmails.length,
        jwtExpiresIn: config.jwtExpiresIn,
        timestamp: new Date().toISOString(),
        authMethod: emailConfigured ? 'Magic link uniquement (admin/étudiant auto-détecté)' : 'Email non configuré',
        message: (config.configured && emailConfigured)
          ? 'Service d\'authentification prêt (magic link uniquement)'
          : 'Configuration manquante : emails admin et/ou email service'
      }
    };
  }

  /**
   * Génère le HTML pour l'email de magic link
   */
  private generateMagicLinkEmailHtml(magicLink: string, email: string, expiresIn: number): string {
    const expiresInHours = Math.floor(expiresIn / 3600);

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
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #003566; border: 3px solid #00b4d8; border-radius: 15px;">

                  <!-- Header -->
                  <tr>
                    <td style="padding: 40px 30px 20px; text-align: center; background-color: #001d3d; border-radius: 12px 12px 0 0;">
                      <h1 style="margin: 0; color: #00b4d8; font-size: 28px; font-weight: bold; text-transform: uppercase; letter-spacing: 2px;">
                        🎮 HACKATHON MQTT RACE 🎮
                      </h1>
                      <p style="margin: 10px 0 0; color: #ffffff; font-size: 16px;">
                        Votre accès au système WizardConsole
                      </p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding: 30px; color: #ffffff; text-align: center;">

                      <p style="margin: 0 0 20px; color: #ffffff; font-size: 18px;">
                        Bonjour <strong style="color: #ffd60a;">${email}</strong> !
                      </p>

                      <p style="margin: 0 0 30px; color: #ffffff; font-size: 16px; line-height: 1.6;">
                        Cliquez sur le bouton ci-dessous pour accéder au système de contrôle
                        des challenges du hackathon. Ce lien est valide pendant
                        <strong style="color: #ffd60a;">${expiresInHours} heures</strong>.
                      </p>

                      <!-- Bouton d'accès -->
                      <table cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                        <tr>
                          <td style="background-color: #00b4d8; padding: 18px 40px; border-radius: 8px; box-shadow: 0 4px 15px rgba(0, 180, 216, 0.3);">
                            <a href="${magicLink}" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px; text-transform: uppercase; letter-spacing: 1px; display: block;">
                              🚀 ACCÉDER AU HACKATHON
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="margin: 30px 0 20px; color: #ffffff; font-size: 14px; opacity: 0.8;">
                        Ou copiez ce lien dans votre navigateur :
                      </p>

                      <div style="background-color: rgba(0, 180, 216, 0.1); border: 1px solid #00b4d8; border-radius: 6px; padding: 15px; margin: 20px 0; word-break: break-all; font-family: monospace; font-size: 14px; color: #00b4d8;">
                        ${magicLink}
                      </div>

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="padding: 30px; text-align: center; background-color: rgba(0, 29, 61, 0.5); border-radius: 0 0 12px 12px; border-top: 1px solid #00b4d8;">
                      <p style="margin: 0 0 10px; color: #00b4d8; font-size: 14px;">
                        🤖 Accès automatique - WizardConsole
                      </p>
                      <p style="margin: 0 0 5px; color: #ffffff; font-size: 12px; opacity: 0.8;">
                        Hackathon IoT & Robot Connecté - "MQTT Race"
                      </p>
                      <p style="margin: 0; color: #ffd60a; font-size: 12px;">
                        ⚠️ Ce lien expire dans ${expiresInHours}h - Ne le partagez pas
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
}
