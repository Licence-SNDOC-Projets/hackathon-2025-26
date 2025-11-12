import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { ChallengeService } from '../../../../core/services/challenge.service';
import { AuthStatusComponent } from '../../../../shared/components/auth-status/auth-status.component';
import { ChallengeConfig } from '@wizard-console/challenge';

/**
 * Page de liste des challenges disponibles
 *
 * Affiche tous les challenges disponibles avec leurs descriptions
 * et permet de naviguer vers chaque challenge spécifique
 */
@Component({
  selector: 'app-challenges-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, AuthStatusComponent],
  template: `
    <div class="challenges-container">

      <!-- Status d'authentification -->
      <app-auth-status></app-auth-status>

      <!-- En-tête -->
      <header class="challenges-header">
        <div class="header-content">
          <h1 class="challenges-title">
            <span class="tron-glow">🎮 HACKATHON CHALLENGES</span>
          </h1>
          <p class="challenges-subtitle">
            Sélectionnez un challenge pour commencer la compétition
          </p>
        </div>

        <div class="stats">
          <div class="stat-item">
            <span class="stat-value">{{ challenges.length }}</span>
            <span class="stat-label">CHALLENGES</span>
          </div>
          <div class="stat-item">
            <span class="stat-value">{{ getTotalTeams() }}</span>
            <span class="stat-label">ÉQUIPES</span>
          </div>
        </div>
      </header>

      <!-- Liste des challenges -->
      <main class="challenges-grid">

        <div class="challenge-card"
             *ngFor="let challenge of challenges; trackBy: trackByChallenge"
             [class.available]="true"
             (click)="selectChallenge(challenge)"
             (keydown.enter)="selectChallenge(challenge)"
             (keydown.space)="selectChallenge(challenge)"
             tabindex="0"
             role="button"
             [attr.aria-label]="'Sélectionner le challenge ' + challenge.config.name">

          <!-- En-tête de la carte -->
          <div class="card-header">
            <h2 class="challenge-name">{{ challenge.config.name }}</h2>
            <div class="challenge-id">{{ challenge.id }}</div>
          </div>

          <!-- Description -->
          <div class="challenge-description">
            {{ challenge.config.description }}
          </div>

          <!-- Détails techniques -->
          <div class="challenge-details">
            <div class="detail-item" *ngIf="challenge.config.maxLaps">
              <span class="detail-label">TOURS MAX</span>
              <span class="detail-value">{{ challenge.config.maxLaps }}</span>
            </div>

            <div class="detail-item" *ngIf="challenge.config.maxDuration">
              <span class="detail-label">DURÉE MAX</span>
              <span class="detail-value">{{ formatDuration(challenge.config.maxDuration) }}</span>
            </div>

            <div class="detail-item">
              <span class="detail-label">DÉCOMPTE</span>
              <span class="detail-value" [class.enabled]="challenge.config.hasCountdown">
                {{ challenge.config.hasCountdown ? 'OUI' : 'NON' }}
              </span>
            </div>
          </div>

          <!-- Bouton d'action -->
          <div class="card-action">
            <button class="tron-button primary">
              🚀 LANCER CHALLENGE
            </button>
          </div>

        </div>

        <!-- Message si aucun challenge -->
        <div class="no-challenges" *ngIf="challenges.length === 0 && !isLoading">
          <div class="no-challenges-icon">🤖</div>
          <h3>Aucun challenge disponible</h3>
          <p>Les challenges seront bientôt disponibles...</p>
        </div>

        <!-- État de chargement -->
        <div class="loading" *ngIf="isLoading">
          <div class="spinner"></div>
          <p>Chargement des challenges...</p>
        </div>

        <!-- Message d'erreur -->
        <div class="error" *ngIf="errorMessage && !isLoading">
          <div class="error-icon">⚠️</div>
          <h3>Erreur de chargement</h3>
          <p>{{ errorMessage }}</p>
          <button class="tron-button secondary" (click)="loadChallenges()">
            🔄 RÉESSAYER
          </button>
        </div>

      </main>

    </div>
  `,
  styles: [`
    .challenges-container {
      min-height: 100vh;
      background: linear-gradient(135deg, #000814, #001d3d, #003566);
      font-family: 'Courier New', 'Lucida Console', monospace;
      padding: 20px;
    }

    .challenges-header {
      background: rgba(0, 29, 61, 0.8);
      border: 2px solid #00ffff;
      border-radius: 15px;
      padding: 30px;
      margin-bottom: 30px;
      backdrop-filter: blur(10px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 20px;
    }

    .header-content {
      flex: 1;
    }

    .challenges-title {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 0 0 10px;
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

    .challenges-subtitle {
      color: #ffffff;
      opacity: 0.8;
      margin: 0;
      font-size: 1.1rem;
    }

    .stats {
      display: flex;
      gap: 30px;
    }

    .stat-item {
      text-align: center;

      .stat-value {
        display: block;
        font-size: 2rem;
        font-weight: bold;
        color: #ffd60a;
        text-shadow: 0 0 10px #ffd60a;
      }

      .stat-label {
        display: block;
        font-size: 0.8rem;
        color: #ffffff;
        opacity: 0.7;
        text-transform: uppercase;
      }
    }

    .challenges-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .challenge-card {
      background: rgba(0, 29, 61, 0.9);
      border: 2px solid #00b4d8;
      border-radius: 12px;
      padding: 25px;
      backdrop-filter: blur(5px);
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      color: #ffffff;
      outline: none;

      &:hover, &:focus {
        border-color: #ffd60a;
        box-shadow: 0 0 20px rgba(255, 214, 10, 0.4);
        transform: translateY(-3px);
      }

      &.available::before {
        content: '●';
        position: absolute;
        top: 20px;
        right: 20px;
        color: #00ff88;
        font-size: 1.5rem;
        text-shadow: 0 0 10px #00ff88;
      }
    }

    .card-header {
      margin-bottom: 15px;

      .challenge-name {
        font-size: 1.5rem;
        font-weight: bold;
        margin: 0 0 5px;
        color: #00ffff;
        text-shadow: 0 0 5px #00ffff;
      }

      .challenge-id {
        font-size: 0.8rem;
        color: #ffffff;
        opacity: 0.6;
        text-transform: uppercase;
        font-family: monospace;
      }
    }

    .challenge-description {
      font-size: 1rem;
      line-height: 1.6;
      margin-bottom: 20px;
      color: #ffffff;
      opacity: 0.9;
    }

    .challenge-details {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 25px;

      @media (max-width: 768px) {
        grid-template-columns: 1fr;
        gap: 10px;
      }
    }

    .detail-item {
      background: rgba(0, 180, 216, 0.1);
      border: 1px solid #00b4d8;
      border-radius: 6px;
      padding: 10px;
      text-align: center;

      .detail-label {
        display: block;
        font-size: 0.7rem;
        color: #00b4d8;
        text-transform: uppercase;
        margin-bottom: 5px;
      }

      .detail-value {
        display: block;
        font-weight: bold;
        font-size: 1rem;
        color: #ffffff;

        &.enabled {
          color: #00ff88;
          text-shadow: 0 0 5px #00ff88;
        }
      }
    }

    .card-action {
      text-align: center;
    }

    .tron-button {
      background: linear-gradient(45deg, #001d3d, #003566);
      border: 2px solid #00ffff;
      color: #ffffff;
      padding: 12px 25px;
      font-family: inherit;
      font-size: 0.9rem;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      outline: none;

      &:hover:not(:disabled) {
        border-color: #ffd60a;
        color: #ffd60a;
        box-shadow: 0 0 15px rgba(255, 214, 10, 0.4);
        transform: translateY(-2px);
      }

      &.primary {
        background: linear-gradient(45deg, #0088ff, #00b4d8);
        border-color: #00b4d8;
      }

      &.secondary {
        border-color: #ff6b6b;
        color: #ff6b6b;
      }
    }

    .no-challenges, .loading, .error {
      grid-column: 1 / -1;
      text-align: center;
      padding: 60px 20px;

      h3 {
        font-size: 1.8rem;
        margin: 20px 0 10px;
        color: #00ffff;
      }

      p {
        font-size: 1.1rem;
        color: #ffffff;
        opacity: 0.8;
        margin: 0 0 20px;
      }
    }

    .no-challenges-icon, .error-icon {
      font-size: 4rem;
      margin-bottom: 20px;
    }

    .spinner {
      width: 60px;
      height: 60px;
      border: 4px solid rgba(0, 255, 255, 0.3);
      border-left: 4px solid #00ffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }

    .error {
      color: #ff6b6b;

      .error-icon {
        color: #ff4444;
        text-shadow: 0 0 20px #ff4444;
      }
    }

    @keyframes tron-pulse {
      0% { opacity: 1; }
      100% { opacity: 0.7; }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @media (max-width: 768px) {
      .challenges-container {
        padding: 10px;
      }

      .challenges-header {
        flex-direction: column;
        text-align: center;
      }

      .challenges-title {
        font-size: 2rem;
      }

      .challenges-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class ChallengesListComponent implements OnInit {
  private challengeService = inject(ChallengeService);
  private router = inject(Router);

  challenges: { id: string; config: ChallengeConfig }[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.loadChallenges();
  }

  /**
   * Charge la liste des challenges depuis l'API
   */
  loadChallenges() {
    this.isLoading = true;
    this.errorMessage = '';

    this.challengeService.loadAvailableChallenges().subscribe({
      next: (challenges) => {
        this.challenges = challenges.map(config => ({
          id: config.id,
          config
        }));
        this.isLoading = false;
        console.log('✅ Challenges chargés:', this.challenges.length);
      },
      error: (error) => {
        console.error('❌ Erreur chargement challenges:', error);
        this.errorMessage = 'Impossible de charger les challenges';
        this.isLoading = false;
      }
    });
  }

  /**
   * Sélectionne et navigue vers un challenge
   */
  selectChallenge(challenge: { id: string; config: ChallengeConfig }) {
    console.log('🎯 Challenge sélectionné:', challenge.id);

    // Navigation vers la page spécifique du challenge
    this.router.navigate(['/challenges', challenge.id]);
  }

  /**
   * Obtient le nombre total d'équipes (simulation)
   */
  getTotalTeams(): number {
    return 4; // Simulation pour l'affichage
  }

  /**
   * Formate la durée en secondes vers un format lisible
   */
  formatDuration(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 0) {
      return `${minutes}m${seconds > 0 ? ` ${seconds}s` : ''}`;
    }
    return `${seconds}s`;
  }

  /**
   * TrackBy function pour optimiser les performances de *ngFor
   */
  trackByChallenge(index: number, challenge: { id: string; config: ChallengeConfig }): string {
    return challenge.id;
  }
}
