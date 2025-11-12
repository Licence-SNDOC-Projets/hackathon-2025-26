import { Injectable, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

/**
 * Guard JWT pour protéger les routes sensibles
 *
 * Ce guard utilise la stratégie JWT pour vérifier que l'utilisateur
 * est authentifié avec un token valide dans le header Authorization
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

  /**
   * Gère les erreurs d'authentification
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      throw err || new UnauthorizedException(
        info?.message || 'Token JWT invalide ou manquant'
      );
    }
    return user;
  }

  /**
   * Détermine si la route peut être activée
   */
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
