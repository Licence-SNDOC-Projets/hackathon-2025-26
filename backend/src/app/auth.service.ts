import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

/**
 * Interface pour les credentials de login
 */
export interface LoginDto {
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
    role: string;
  };
  expires_in: string;
}

/**
 * Interface pour le payload JWT
 */
export interface JwtPayload {
  sub: string;
  username: string;
  role: string;
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
   * Génère un token JWT pour un utilisateur authentifié
   */
  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.validateUser(loginDto.username, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Nom d\'utilisateur ou mot de passe incorrect');
    }

    const payload: JwtPayload = {
      sub: user.username,
      username: user.username,
      role: user.role
    };

    const access_token = this.jwtService.sign(payload);
    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '24h');

    this.logger.log(`🔑 Token JWT généré pour ${user.username} (expire dans ${expiresIn})`);

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
