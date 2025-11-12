import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

/**
 * Interface pour la demande de magic link
 */
export interface MagicLinkRequestDto {
  email: string;
}

/**
 * Interface pour les credentials de login admin (gardé pour les profs)
 */
export interface AdminLoginDto {
  username: string;
  password: string;
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
 * Gère l'authentification avec login/password pour les professeurs
 * et génère des tokens JWT pour sécuriser les API
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private configService: ConfigService,
    private jwtService: JwtService
  ) {}

  /**
   * Valide les credentials utilisateur
   */
  async validateUser(username: string, password: string): Promise<any> {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');

    if (!adminUsername || !adminPassword) {
      this.logger.error('❌ Configuration d\'authentification incomplète dans .env');
      throw new UnauthorizedException('Configuration d\'authentification manquante');
    }

    // Validation des credentials
    if (username === adminUsername && password === adminPassword) {
      this.logger.log(`✅ Authentification réussie pour l'utilisateur: ${username}`);

      return {
        username,
        role: 'admin',
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

    this.logger.warn(`⚠️ Tentative d'authentification échouée pour: ${username}`);
    return null;
  }

  /**
   * Génère un token JWT pour un administrateur authentifié
   */
  async adminLogin(loginDto: AdminLoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Nom d\'utilisateur ou mot de passe incorrect');
    }

    const payload: JwtPayload = {
      sub: user.username,
      username: user.username,
      role: user.role,
      type: 'admin'
    };

    const access_token = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '24h');

    this.logger.log(`🔑 Token JWT admin généré pour ${user.username} (expire dans ${expiresIn})`);

    return {
      access_token,
      user: {
        username: user.username,
        role: user.role
      },
      expires_in: expiresIn
    };
  }

  /**
   * Génère un magic link pour un étudiant
   */
  async generateMagicLink(email: string): Promise<{
    token: string;
    magicLink: string;
    expiresIn: number;
  }> {
    const payload: JwtPayload = {
      sub: email,
      username: email.split('@')[0],
      email: email,
      role: 'student',
      type: 'student'
    };

    // Token avec expiration plus courte pour les magic links (2 heures)
    const token = this.jwtService.sign(payload, { expiresIn: '2h' });

    const baseUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:4200');
    const magicLink = `${baseUrl}/auth/verify?token=${token}`;

    this.logger.log(`🪄 Magic link généré pour ${email}`);

    return {
      token,
      magicLink,
      expiresIn: 7200 // 2 heures en secondes
    };
  }

  /**
   * Valide un token de magic link
   */
  async validateMagicLinkToken(token: string): Promise<LoginResponse> {
    try {
      const payload = this.jwtService.verify(token) as JwtPayload;

      if (payload.type !== 'student') {
        throw new UnauthorizedException('Token invalide pour un magic link');
      }

      this.logger.log(`✅ Magic link validé pour ${payload.email}`);

      // Générer un nouveau token avec expiration normale (24h)
      const newPayload: JwtPayload = {
        sub: payload.email!,
        username: payload.username,
        email: payload.email,
        role: 'student',
        type: 'student'
      };

      const access_token = this.jwtService.sign(newPayload);

      return {
        access_token,
        user: {
          username: payload.username,
          email: payload.email,
          role: 'student'
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
    // Vérifications supplémentaires si nécessaire
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');

    if (payload.username === adminUsername && payload.role === 'admin') {
      return {
        username: payload.username,
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

    return null;
  }

  /**
   * Vérifie si un utilisateur a une permission spécifique
   */
  hasPermission(user: any, permission: string): boolean {
    return user && user.permissions && user.permissions.includes(permission);
  }

  /**
   * Génère un hash du mot de passe (pour usage futur)
   */
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare un mot de passe avec son hash (pour usage futur)
   */
  async comparePasswords(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }

  /**
   * Obtient la configuration d'authentification (sans mots de passe)
   */
  getAuthConfig(): {
    adminUsername: string;
    jwtExpiresIn: string;
    configured: boolean;
  } {
    const adminUsername = this.configService.get<string>('ADMIN_USERNAME');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const jwtSecret = this.configService.get<string>('JWT_SECRET');

    return {
      adminUsername: adminUsername || 'non configuré',
      jwtExpiresIn: this.configService.get<string>('JWT_EXPIRES_IN', '24h'),
      configured: !!(adminUsername && adminPassword && jwtSecret)
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
