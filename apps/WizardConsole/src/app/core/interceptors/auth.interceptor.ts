import { Injectable, inject } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Interceptor HTTP pour l'authentification JWT
 *
 * Cet interceptor :
 * - Injecte automatiquement le token JWT dans toutes les requêtes API
 * - Gère les erreurs 401 (non autorisé) en redirigeant vers login
 * - Exclut certaines routes publiques (login, health, etc.)
 */
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private authService = inject(AuthService);
  private router = inject(Router);

  /**
   * Routes publiques qui n'ont pas besoin d'authentification
   */
  private readonly publicRoutes = [
    '/api/auth/login',
    '/api/auth/config',
    '/api/auth/health',
    '/api/challenges/health',
    '/api/email/health',
    '/api/challenges', // Liste des challenges (lecture seule)
    '/api/challenges/stats' // Statistiques publiques
  ];

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Ne pas ajouter le token pour les routes publiques
    if (this.isPublicRoute(request.url)) {
      return next.handle(request);
    }

    // Injecter le token JWT s'il existe
    const token = this.authService.getToken();

    if (token) {
      const authRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });

      return next.handle(authRequest).pipe(
        catchError((error: HttpErrorResponse) => {
          return this.handleAuthError(error, request, next);
        })
      );
    }

    // Si pas de token, continuer sans modification
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        return this.handleAuthError(error, request, next);
      })
    );
  }

  /**
   * Vérifie si une route est publique
   */
  private isPublicRoute(url: string): boolean {
    return this.publicRoutes.some(route => {
      // Vérification exacte pour les routes spécifiques
      if (route.endsWith('/*')) {
        return url.startsWith(route.slice(0, -2));
      }
      // Vérification exacte ou commence par
      return url === route || url.startsWith(route + '/');
    });
  }

  /**
   * Gère les erreurs d'authentification
   */
  private handleAuthError(
    error: HttpErrorResponse,
    request: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {

    if (error.status === 401) {
      console.warn('⚠️ Token JWT invalide ou expiré, redirection vers login');

      // Effacer l'état d'authentification
      this.authService.logout().subscribe();

      // Rediriger vers la page de login
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
    }

    if (error.status === 403) {
      console.warn('⚠️ Permissions insuffisantes');
      // Optionnel : Rediriger vers page "accès refusé"
    }

    return throwError(() => error);
  }
}
