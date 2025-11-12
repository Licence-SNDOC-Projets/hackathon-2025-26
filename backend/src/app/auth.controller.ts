import { Controller, Post, Get, Body, HttpException, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthService, LoginDto, LoginResponse } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Contrôleur d'authentification
 *
 * Gère les endpoints de login/logout et la validation des tokens JWT
 */
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/login
   * Authentifie un utilisateur et retourne un token JWT
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    try {
      if (!loginDto.username || !loginDto.password) {
        throw new HttpException(
          'Nom d\'utilisateur et mot de passe requis',
          HttpStatus.BAD_REQUEST
        );
      }

      const result = await this.authService.login(loginDto);

      return result;

    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'authentification: ${error}`,
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
          endpoints: {
            login: '/api/auth/login',
            profile: '/api/auth/profile',
            logout: '/api/auth/logout',
            verify: '/api/auth/verify'
          },
          requirements: {
            username: 'Nom d\'utilisateur administrateur',
            password: 'Mot de passe administrateur',
            token_header: 'Authorization: Bearer <token>'
          }
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

    return {
      success: true,
      status: config.configured ? 'healthy' : 'configuration_needed',
      data: {
        configured: config.configured,
        adminUsername: config.adminUsername,
        jwtExpiresIn: config.jwtExpiresIn,
        timestamp: new Date().toISOString(),
        message: config.configured
          ? 'Service d\'authentification prêt'
          : 'Variables ADMIN_USERNAME, ADMIN_PASSWORD et JWT_SECRET requises'
      }
    };
  }
}
