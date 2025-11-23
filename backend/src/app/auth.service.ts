import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/**
 * Interface pour la demande de magic link
 */
export interface MagicLinkRequestDto {
  email: string;
}

/**
 * Interface pour la réponse de login
 */
export interface LoginResponse {
  access_token: string;
  user: {
    username: string;
    email?: string;
    role: string;
  };
  expires_in: string;
}

/**
 * Interface pour la réponse de demande de magic link
 */
export interface MagicLinkResponse {
  success: boolean;
  message: string;
  email: string;
  expiresIn: number;
}

/**
 * Interface pour le payload JWT
 */
export interface JwtPayload {
  sub: string;
  username: string;
  email?: string;
  role: string;
  type: 'admin' | 'student';
  iat?: number;
  exp?: number;
}

/**
 * Service d'authentification pour le hackathon
 *
 * Gère l'authentification uniquement par magic link
 * Les emails admin sont détectés automatiquement via la configuration
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
  ) {}

  /**
   * Vérifie si un email est dans la liste des administrateurs
   */
  private isAdminEmail(email: string): boolean {
    const adminEmails = this.configService.get<string>('ADMIN_EMAILS', '');
    const adminList = adminEmails.split(',').map(e => e.trim().toLowerCase());
    return adminList.includes(email.toLowerCase());
  }

  /**
   * Génère un magic link (pour admin ou étudiant selon l'email)
   */
  async generateMagicLink(email: string): Promise<{
    token: string;
    magicLink: string;
    expiresIn: number;
  }> {
    const isAdmin = this.isAdminEmail(email);
    const role = isAdmin ? 'admin' : 'student';
    const type = isAdmin ? 'admin' : 'student';

    const payload: JwtPayload = {
      sub: email,
      username: email.split('@')[0],
      email: email,
      role: role,
      type: type
    };

    // Token avec expiration plus courte pour les magic links (2 heures)
    const token = this.jwtService.sign(payload, { expiresIn: '2h' });

    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const magicLink = `${baseUrl}/auth/verify?token=${token}`;

    this.logger.log(`🪄 Magic link généré pour ${email} (rôle: ${role})`);

    return {
      token,
      magicLink,
      expiresIn: 7200 // 2 heures en secondes
    };
  }

  /**
   * Valide un token de magic link (admin ou étudiant)
   */
  async validateMagicLinkToken(token: string): Promise<LoginResponse> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;

      this.logger.log(`✅ Magic link validé pour ${payload.email} (rôle: ${payload.role})`);

      // Générer un nouveau token avec expiration normale (24h)
      const newPayload: JwtPayload = {
        sub: payload.email!,
        username: payload.username,
        email: payload.email,
        role: payload.role,
        type: payload.type
      };

      const access_token = this.jwtService.sign(newPayload);

      return {
        access_token,
        user: {
          username: payload.username,
          email: payload.email,
          role: payload.role
        },
        expires_in: '24h'
      };

    } catch (error) {
      this.logger.warn(`⚠️ Magic link invalide ou expiré: ${error.message}`);
      throw new UnauthorizedException('Magic link invalide ou expiré');
    }
  }

  /**
   * Valide un token JWT et retourne l'utilisateur
   */
  async validateJwtPayload(payload: JwtPayload): Promise<any> {
    // Vérifier si l'email est admin
    const isAdmin = payload.email ? this.isAdminEmail(payload.email) : false;

    if (isAdmin && payload.role === 'admin') {
      return {
        username: payload.username,
        email: payload.email,
        role: payload.role,
        permissions: [
          'challenges:read',
          'challenges:write',
          'challenges:start',
          'challenges:stop',
          'teams:manage',
          'emails:send',
          'system:admin'
        ]
      };
    }

    // Utilisateur étudiant
    if (payload.role === 'student') {
      return {
        username: payload.username,
        email: payload.email,
        role: payload.role,
        permissions: [
          'challenges:read'
        ]
      };
    }

    return null;
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  hasPermission(user: any, permission: string): boolean {
    return user && user.permissions && user.permissions.includes(permission);
  }

  /**
   * Obtient la configuration d'authentification
   */
  getAuthConfig(): {
    adminEmails: string[];
    jwtExpiresIn: string;
    configured: boolean;
  } {
    const adminEmails = this.configService.get<string>('ADMIN_EMAILS', '');
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    return {
      adminEmails: adminEmails.split(',').map(e => e.trim()).filter(e => e),
      jwtExpiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
      configured: !!(adminEmails && jwtSecret)
    };
  }

  /**
   * Révoque un token (pour usage futur avec une blacklist Redis)
   */
  async revokeToken(token: string): Promise<boolean> {
    // Pour l'instant on log seulement, mais on pourrait implémenter
    // une blacklist Redis pour révoquer les tokens avant expiration
    this.logger.log(`🚫 Token révoqué: ${token.substring(0, 20)}...`);
    return true;
  }
}
