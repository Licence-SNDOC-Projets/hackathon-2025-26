import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User } from '../../../core/services/auth.service';
import { Observable } from 'rxjs';

/**
 * Composant d'affichage de l'état d'authentification
 *
 * Affiche l'utilisateur connecté et permet la déconnexion
 * À inclure dans le header de l'application
 */
@Component({
  selector: 'app-auth-status',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="auth-status">

      <ng-container *ngIf="isAuthenticated$ | async; else notAuthenticated">
        <!-- Utilisateur connecté -->
        <div class="user-info">
          <span class="user-icon">👨‍💻</span>
          <div class="user-details">
            <div class="username">{{ (currentUser$ | async)?.username }}</div>
            <div class="role">{{ (currentUser$ | async)?.role }}</div>
          </div>
        </div>

        <button class="logout-btn" (click)="logout()" title="Se déconnecter">
          <span class="logout-icon">🚪</span>
          <span class="logout-text">LOGOUT</span>
        </button>
      </ng-container>

      <ng-template #notAuthenticated>
        <!-- Non connecté -->
        <div class="not-authenticated">
          <span class="warning-icon">🔒</span>
          <span class="not-auth-text">NON CONNECTÉ</span>
          <button class="login-btn" (click)="goToLogin()">
            <span class="login-icon">🔑</span>
            <span class="login-text">LOGIN</span>
          </button>
        </div>
      </ng-template>

    </div>
  `,
  styles: [`
    .auth-status {
      display: flex;
      align-items: center;
      gap: 15px;
      padding: 10px 15px;
      background: rgba(0, 29, 61, 0.8);
      border: 1px solid #00ffff;
      border-radius: 8px;
      color: #ffffff;
      font-family: 'Courier New', monospace;
      backdrop-filter: blur(5px);
    }

    .user-info {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .user-icon {
      font-size: 1.5rem;
    }

    .user-details {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
    }

    .username {
      font-weight: bold;
      color: #00ffff;
      font-size: 0.9rem;
      text-transform: uppercase;
      text-shadow: 0 0 5px #00ffff;
    }

    .role {
      font-size: 0.7rem;
      color: #ffd60a;
      text-transform: uppercase;
      opacity: 0.8;
    }

    .logout-btn, .login-btn {
      background: transparent;
      border: 1px solid #00ffff;
      color: #00ffff;
      padding: 8px 12px;
      border-radius: 5px;
      cursor: pointer;
      font-family: inherit;
      font-size: 0.8rem;
      font-weight: bold;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 5px;
      transition: all 0.3s ease;
      outline: none;
    }

    .logout-btn:hover, .login-btn:hover {
      background: rgba(0, 255, 255, 0.1);
      box-shadow: 0 0 10px rgba(0, 255, 255, 0.3);
      transform: translateY(-1px);
    }

    .logout-btn:active, .login-btn:active {
      transform: translateY(0);
    }

    .logout-icon, .login-icon {
      font-size: 1rem;
    }

    .logout-text, .login-text {
      font-size: 0.8rem;
    }

    .not-authenticated {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .warning-icon {
      font-size: 1.2rem;
      color: #ff6b6b;
    }

    .not-auth-text {
      color: #ff6b6b;
      font-size: 0.8rem;
      font-weight: bold;
      text-transform: uppercase;
    }

    .login-btn {
      border-color: #ffd60a;
      color: #ffd60a;
    }

    .login-btn:hover {
      background: rgba(255, 214, 10, 0.1);
      box-shadow: 0 0 10px rgba(255, 214, 10, 0.3);
    }

    /* Responsive */
    @media (max-width: 768px) {
      .auth-status {
        padding: 8px 10px;
        gap: 10px;
      }

      .user-details {
        display: none; /* Cacher les détails sur mobile */
      }

      .logout-text, .login-text, .not-auth-text {
        display: none; /* Ne garder que les icônes */
      }
    }
  `]
})
export class AuthStatusComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  isAuthenticated$: Observable<boolean> = this.authService.isAuthenticated$;
  currentUser$: Observable<User | null> = this.authService.currentUser$;

  /**
   * Déconnecte l'utilisateur
   */
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        console.log('✅ Déconnexion réussie');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la déconnexion:', error);
        // Rediriger quand même vers login
        this.router.navigate(['/login']);
      }
    });
  }

  /**
   * Redirige vers la page de login
   */
  goToLogin() {
    this.router.navigate(['/login'], {
      queryParams: { returnUrl: this.router.url }
    });
  }
}
