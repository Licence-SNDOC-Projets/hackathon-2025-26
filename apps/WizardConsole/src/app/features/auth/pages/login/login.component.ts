import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, LoginCredentials } from '../../../../core/services/auth.service';

/**
 * Page de connexion pour les professeurs/administrateurs
 *
 * Interface simple avec formulaire login/mot de passe
 * Style Tron Legacy pour cohérence avec le reste de l'application
 */
@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">

      <div class="login-card">
        <!-- Header -->
        <div class="login-header">
          <h1 class="login-title">
            <span class="tron-glow">🎮 WIZARD CONSOLE</span>
          </h1>
          <p class="login-subtitle">Hackathon MQTT Race - Système de Contrôle</p>
        </div>

        <!-- Sélecteur de mode -->
        <div class="mode-selector">
          <button
            class="mode-btn"
            [class.active]="loginMode === 'admin'"
            (click)="setLoginMode('admin')">
            👨‍💻 PROFESSEUR
          </button>
          <button
            class="mode-btn"
            [class.active]="loginMode === 'student'"
            (click)="setLoginMode('student')">
            🎓 ÉTUDIANT
          </button>
        </div>

        <!-- Formulaire Professeur -->
        <form class="login-form" *ngIf="loginMode === 'admin'" (ngSubmit)="onAdminLogin()" #adminForm="ngForm">

          <div class="form-group">
            <label for="username" class="form-label">NOM D'UTILISATEUR</label>
            <input
              id="username"
              type="text"
              class="tron-input"
              [(ngModel)]="adminCredentials.username"
              name="username"
              placeholder="admin"
              required
              autocomplete="username"
              [disabled]="isLoading"
            >
          </div>

          <div class="form-group">
            <label for="password" class="form-label">MOT DE PASSE</label>
            <input
              id="password"
              type="password"
              class="tron-input"
              [(ngModel)]="adminCredentials.password"
              name="password"
              placeholder="••••••••"
              required
              autocomplete="current-password"
              [disabled]="isLoading"
            >
          </div>

          <!-- Message d'erreur -->
          <div class="error-message" *ngIf="errorMessage">
            <span class="error-icon">⚠️</span>
            {{ errorMessage }}
          </div>

          <!-- Message d'information -->
          <div class="info-message" *ngIf="!errorMessage">
            <span class="info-icon">ℹ️</span>
            Accès administrateur avec credentials professeur
          </div>

          <!-- Bouton de connexion -->
          <button
            type="submit"
            class="tron-button primary"
            [disabled]="!adminForm.form.valid || isLoading"
            [class.loading]="isLoading"
          >
            <span *ngIf="!isLoading">🔐 CONNEXION ADMIN</span>
            <span *ngIf="isLoading">🔄 CONNEXION...</span>
          </button>

        </form>

        <!-- Formulaire Étudiant -->
        <form class="login-form" *ngIf="loginMode === 'student'" (ngSubmit)="onStudentLogin()" #studentForm="ngForm">

          <div class="form-group">
            <label for="email" class="form-label">ADRESSE EMAIL</label>
            <input
              id="email"
              type="email"
              class="tron-input"
              [(ngModel)]="studentEmail"
              name="email"
              placeholder="votre.email@exemple.com"
              required
              autocomplete="email"
              [disabled]="isLoading"
            >
          </div>

          <!-- Message d'erreur -->
          <div class="error-message" *ngIf="errorMessage">
            <span class="error-icon">⚠️</span>
            {{ errorMessage }}
          </div>

          <!-- Message de succès -->
          <div class="success-message" *ngIf="magicLinkSent">
            <span class="success-icon">✅</span>
            Magic link envoyé ! Vérifiez votre boîte email.
          </div>

          <!-- Message d'information -->
          <div class="info-message" *ngIf="!errorMessage && !magicLinkSent">
            <span class="info-icon">📧</span>
            Vous recevrez un lien d'accès sécurisé par email
          </div>

          <!-- Bouton d'envoi -->
          <button
            type="submit"
            class="tron-button secondary"
            [disabled]="!studentForm.form.valid || isLoading || magicLinkSent"
            [class.loading]="isLoading"
          >
            <span *ngIf="!isLoading && !magicLinkSent">📧 ENVOYER LIEN D'ACCÈS</span>
            <span *ngIf="isLoading">🔄 ENVOI EN COURS...</span>
            <span *ngIf="magicLinkSent">✅ LIEN ENVOYÉ</span>
          </button>

        </form>


        <!-- Footer -->
        <div class="login-footer">
          <p>🎮 Système d'arbitrage et de contrôle</p>
          <p>Hackathon IoT & Robot Connecté</p>
        </div>
      </div>

      <!-- Animation de fond -->
      <div class="background-animation">
        <div class="grid-line horizontal" *ngFor="let line of gridLines" [style.top.%]="line"></div>
        <div class="grid-line vertical" *ngFor="let line of gridLines" [style.left.%]="line"></div>
      </div>

    </div>
  `,
  styles: [`
    .login-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #000814, #001d3d, #003566);
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
      overflow: hidden;
      font-family: 'Courier New', 'Lucida Console', monospace;
    }

    .background-animation {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      opacity: 0.1;
    }

    .grid-line {
      position: absolute;
      background: linear-gradient(90deg, transparent, #00ffff, transparent);
      animation: tron-grid 4s ease-in-out infinite alternate;
    }

    .grid-line.horizontal {
      width: 100%;
      height: 1px;
    }

    .grid-line.vertical {
      height: 100%;
      width: 1px;
    }

    .login-card {
      background: rgba(0, 29, 61, 0.95);
      border: 2px solid #00ffff;
      border-radius: 15px;
      padding: 40px;
      box-shadow:
        0 0 30px rgba(0, 255, 255, 0.3),
        inset 0 0 30px rgba(0, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      max-width: 500px;
      width: 90%;
      position: relative;
      z-index: 2;
    }

    .login-header {
      text-align: center;
      margin-bottom: 40px;
    }

    .login-title {
      font-size: 2.5rem;
      margin: 0 0 15px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .tron-glow {
      color: #00ffff;
      text-shadow:
        0 0 5px #00ffff,
        0 0 10px #00ffff,
        0 0 15px #00ffff;
      animation: tron-pulse 2s ease-in-out infinite alternate;
    }

    .login-subtitle {
      color: #ffffff;
      opacity: 0.8;
      margin: 0;
      font-size: 1.1rem;
    }

    .login-form {
      display: flex;
      flex-direction: column;
      gap: 25px;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .form-label {
      color: #00ffff;
      font-size: 0.9rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .tron-input {
      background: rgba(0, 8, 20, 0.8);
      border: 2px solid #00ffff;
      color: #ffffff;
      padding: 15px 20px;
      font-family: inherit;
      font-size: 1.1rem;
      border-radius: 8px;
      outline: none;
      transition: all 0.3s ease;
    }

    .tron-input:focus {
      border-color: #ffd60a;
      box-shadow: 0 0 15px rgba(255, 214, 10, 0.4);
      text-shadow: 0 0 5px #ffd60a;
    }

    .tron-input:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .tron-input::placeholder {
      color: rgba(255, 255, 255, 0.5);
    }

    .tron-button {
      background: linear-gradient(45deg, #001d3d, #003566);
      border: 2px solid #00ffff;
      color: #ffffff;
      padding: 18px 30px;
      font-family: inherit;
      font-size: 1.1rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 2px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      outline: none;
      position: relative;
      overflow: hidden;
    }

    .tron-button:hover:not(:disabled) {
      border-color: #ffd60a;
      color: #ffd60a;
      box-shadow: 0 0 20px rgba(255, 214, 10, 0.4);
      transform: translateY(-2px);
    }

    .tron-button:active {
      transform: translateY(0);
    }

    .tron-button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .tron-button.primary {
      background: linear-gradient(45deg, #0088ff, #00b4d8);
      border-color: #00b4d8;
    }

    .tron-button.primary:hover:not(:disabled) {
      box-shadow: 0 0 25px rgba(0, 180, 216, 0.6);
    }

    .tron-button.loading {
      animation: tron-loading 1.5s ease-in-out infinite;
    }

    .error-message {
      background: rgba(255, 68, 68, 0.1);
      border: 1px solid #ff4444;
      border-radius: 8px;
      padding: 15px;
      color: #ff6b6b;
      font-size: 0.95rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .info-message {
      background: rgba(0, 180, 216, 0.1);
      border: 1px solid #00b4d8;
      border-radius: 8px;
      padding: 15px;
      color: #87ceeb;
      font-size: 0.9rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .login-footer {
      text-align: center;
      margin-top: 40px;
      color: #ffffff;
      opacity: 0.7;
      font-size: 0.9rem;
    }

    .login-footer p {
      margin: 5px 0;
    }

    /* Animations */
    @keyframes tron-pulse {
      0% { opacity: 1; }
      100% { opacity: 0.7; }
    }

    @keyframes tron-grid {
      0% { opacity: 0.05; }
      100% { opacity: 0.15; }
    }

    @keyframes tron-loading {
      0% { box-shadow: 0 0 5px rgba(0, 180, 216, 0.3); }
      50% { box-shadow: 0 0 25px rgba(0, 180, 216, 0.8); }
      100% { box-shadow: 0 0 5px rgba(0, 180, 216, 0.3); }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .login-card {
        padding: 30px 20px;
      }

      .login-title {
        font-size: 2rem;
      }
    }
  `]
})
export class LoginComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Mode de connexion
  loginMode: 'admin' | 'student' = 'student';

  // Credentials admin (profs)
  adminCredentials: LoginCredentials = {
    username: '',
    password: ''
  };

  // Email pour étudiants (magic link)
  studentEmail = '';
  magicLinkSent = false;

  // État UI
  isLoading = false;
  errorMessage = '';

  // Données pour l'animation de fond
  gridLines = Array.from({ length: 10 }, (_, i) => (i + 1) * 10);

  // Gardé pour compatibilité
  credentials: LoginCredentials = {
    username: '',
    password: ''
  };

  /**
   * Change le mode de connexion
   */
  setLoginMode(mode: 'admin' | 'student') {
    this.loginMode = mode;
    this.errorMessage = '';
    this.magicLinkSent = false;
  }

  /**
   * Connexion administrateur avec username/password
   */
  onAdminLogin() {
    if (!this.adminCredentials.username || !this.adminCredentials.password) {
      this.errorMessage = 'Veuillez saisir nom d\'utilisateur et mot de passe';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Appeler l'endpoint admin-login
    this.authService.login(this.adminCredentials).subscribe({
      next: (response) => {
        console.log('✅ Connexion admin réussie:', response.user);

        // Rediriger vers les challenges ou l'URL de retour
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl') || '/challenges';
        this.router.navigate([returnUrl]);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('❌ Erreur de connexion admin:', error);

        this.errorMessage = error.error?.message || 'Credentials administrateur incorrects';
        this.isLoading = false;

        // Effacer le mot de passe en cas d'erreur
        this.adminCredentials.password = '';
      }
    });
  }

  /**
   * Demande de magic link pour étudiant
   */
  onStudentLogin() {
    if (!this.studentEmail) {
      this.errorMessage = 'Veuillez saisir une adresse email';
      return;
    }

    // Validation email simple
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.studentEmail)) {
      this.errorMessage = 'Format d\'email invalide';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Appeler l'endpoint magic-link
    this.authService.requestMagicLink(this.studentEmail).subscribe({
      next: (response) => {
        console.log('✅ Magic link envoyé:', response);

        this.magicLinkSent = true;
        this.isLoading = false;

        // Auto-reset après 10 secondes
        setTimeout(() => {
          this.magicLinkSent = false;
          this.studentEmail = '';
        }, 10000);
      },
      error: (error) => {
        console.error('❌ Erreur magic link:', error);

        this.errorMessage = error.error?.message || 'Erreur lors de l\'envoi du lien d\'accès';
        this.isLoading = false;
      }
    });
  }

  /**
   * Méthode legacy (pour compatibilité)
   */
  onLogin() {
    if (this.loginMode === 'admin') {
      this.onAdminLogin();
    } else {
      this.onStudentLogin();
    }
  }
}
