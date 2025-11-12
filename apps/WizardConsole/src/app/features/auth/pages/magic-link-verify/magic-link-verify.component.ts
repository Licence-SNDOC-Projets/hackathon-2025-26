import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

/**
 * Page de vérification des magic links
 *
 * Cette page traite les liens d'accès reçus par email
 * et génère une session authentifiée pour les étudiants
 */
@Component({
  selector: 'app-magic-link-verify',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="verify-container">

      <div class="verify-card">

        <!-- En cours de vérification -->
        <div class="verifying" *ngIf="isVerifying">
          <div class="spinner"></div>
          <h2>🔍 VÉRIFICATION EN COURS</h2>
          <p>Validation de votre lien d'accès...</p>
        </div>

        <!-- Succès -->
        <div class="success" *ngIf="verificationSuccess && !isVerifying">
          <div class="success-icon">✅</div>
          <h2>🎉 ACCÈS AUTORISÉ</h2>
          <p>Bienvenue <strong>{{ userEmail }}</strong> !</p>
          <p>Redirection automatique vers les challenges...</p>
          <button class="tron-button primary" (click)="goToChallenges()">
            🚀 ACCÉDER AUX CHALLENGES
          </button>
        </div>

        <!-- Échec -->
        <div class="error" *ngIf="verificationError && !isVerifying">
          <div class="error-icon">❌</div>
          <h2>🚫 ACCÈS REFUSÉ</h2>
          <p class="error-message">{{ errorMessage }}</p>
          <div class="error-help">
            <p>Causes possibles :</p>
            <ul>
              <li>Lien expiré (valide 2 heures)</li>
              <li>Lien déjà utilisé</li>
              <li>Lien malformé ou corrompu</li>
            </ul>
          </div>
          <button class="tron-button secondary" (click)="goToLogin()">
            📧 DEMANDER UN NOUVEAU LIEN
          </button>
        </div>

      </div>

    </div>
  `,
  styles: [`
    .verify-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #000814, #001d3d, #003566);
      display: flex;
      justify-content: center;
      align-items: center;
      font-family: 'Courier New', 'Lucida Console', monospace;
      padding: 20px;
    }

    .verify-card {
      background: rgba(0, 29, 61, 0.95);
      border: 2px solid #00ffff;
      border-radius: 15px;
      padding: 40px;
      box-shadow: 0 0 30px rgba(0, 255, 255, 0.3);
      backdrop-filter: blur(10px);
      max-width: 500px;
      width: 100%;
      text-align: center;
      color: #ffffff;
    }

    .verifying, .success, .error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(0, 255, 255, 0.3);
      border-left: 4px solid #00ffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    .success-icon {
      font-size: 4rem;
      color: #00ff88;
      text-shadow: 0 0 20px #00ff88;
    }

    .error-icon {
      font-size: 4rem;
      color: #ff4444;
      text-shadow: 0 0 20px #ff4444;
    }

    h2 {
      margin: 0;
      font-size: 1.8rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .success h2 {
      color: #00ff88;
      text-shadow: 0 0 10px #00ff88;
    }

    .error h2 {
      color: #ff4444;
      text-shadow: 0 0 10px #ff4444;
    }

    .verifying h2 {
      color: #00ffff;
      text-shadow: 0 0 10px #00ffff;
    }

    p {
      margin: 0;
      font-size: 1.1rem;
      line-height: 1.6;
    }

    .error-message {
      color: #ff6b6b;
      font-weight: bold;
    }

    .error-help {
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      border-radius: 8px;
      padding: 20px;
      text-align: left;
    }

    .error-help p {
      margin: 0 0 10px;
      color: #ff6b6b;
      font-weight: bold;
    }

    .error-help ul {
      margin: 0;
      padding-left: 20px;
      color: #ffffff;
    }

    .error-help li {
      margin: 5px 0;
    }

    .tron-button {
      background: linear-gradient(45deg, #001d3d, #003566);
      border: 2px solid #00ffff;
      color: #ffffff;
      padding: 15px 30px;
      font-family: inherit;
      font-size: 1rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      outline: none;
    }

    .tron-button:hover {
      border-color: #ffd60a;
      color: #ffd60a;
      box-shadow: 0 0 20px rgba(255, 214, 10, 0.4);
      transform: translateY(-2px);
    }

    .tron-button:active {
      transform: translateY(0);
    }

    .tron-button.primary {
      background: linear-gradient(45deg, #0088ff, #00b4d8);
      border-color: #00b4d8;
    }

    .tron-button.secondary {
      border-color: #ff6b6b;
      color: #ff6b6b;
    }

    .tron-button.secondary:hover {
      box-shadow: 0 0 20px rgba(255, 107, 107, 0.4);
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .verify-card {
        padding: 30px 20px;
      }

      h2 {
        font-size: 1.5rem;
      }
    }
  `]
})
export class MagicLinkVerifyComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  isVerifying = true;
  verificationSuccess = false;
  verificationError = false;
  errorMessage = '';
  userEmail = '';

  ngOnInit() {
    this.verifyMagicLink();
  }

  /**
   * Vérifie le magic link depuis les paramètres d'URL
   */
  private verifyMagicLink() {
    const token = this.route.snapshot.queryParams['token'];

    if (!token) {
      this.showError('Token manquant dans l\'URL');
      return;
    }

    // Appeler l'endpoint de vérification backend
    this.authService.verifyMagicLinkToken(token).subscribe({
      next: (response: any) => {
        console.log('✅ Magic link vérifié:', response);

        this.userEmail = response.user?.email || response.user?.username || 'Utilisateur';
        this.isVerifying = false;
        this.verificationSuccess = true;

        // Redirection automatique après 3 secondes
        setTimeout(() => {
          this.goToChallenges();
        }, 3000);
      },
      error: (error: any) => {
        console.error('❌ Erreur vérification magic link:', error);

        this.showError(
          error.error?.message || 'Lien d\'accès invalide ou expiré'
        );
      }
    });
  }

  /**
   * Affiche une erreur de vérification
   */
  private showError(message: string) {
    this.isVerifying = false;
    this.verificationError = true;
    this.errorMessage = message;
  }

  /**
   * Redirige vers les challenges
   */
  goToChallenges() {
    this.router.navigate(['/challenges']);
  }

  /**
   * Redirige vers la page de login
   */
  goToLogin() {
    this.router.navigate(['/login']);
  }
}
