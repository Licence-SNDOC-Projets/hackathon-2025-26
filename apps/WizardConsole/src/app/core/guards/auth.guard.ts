import { Injectable, inject } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Guard Angular pour protéger les routes sensibles
 *
 * Ce guard vérifie que l'utilisateur est authentifié avant d'accéder
 * aux pages protégées. Redirige vers /login si non connecté.
 */
@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    return this.authService.isAuthenticated$.pipe(
      take(1),
      map(isAuthenticated => {
        if (isAuthenticated) {
          console.log('✅ Accès autorisé à:', state.url);
          return true;
        } else {
          console.warn('🔒 Accès refusé à:', state.url, '- Redirection vers login');

          // Rediriger vers login avec URL de retour
          this.router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
          });

          return false;
        }
      })
    );
  }
}
