import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { StudentProfileService } from '../../services/student-profile.service';

@Component({
  selector: 'app-profile-dashboard',
  template: `
    <div class="dashboard-container">
      
      <!-- Aucun profil -->
      <div class="no-profile-card" *ngIf="!currentStudent">
        <div class="empty-state">
          <div class="empty-icon">🎮</div>
          <h2>Aucun Profil Trouvé</h2>
          <p>Vous devez d'abord créer votre profil étudiant pour participer au hackathon.</p>
          
          <div class="empty-actions">
            <button class="btn btn-primary" (click)="goToProfileCreation()">
              ✨ Créer Mon Profil
            </button>
          </div>
        </div>
      </div>

      <!-- Profil existant -->
      <div class="profile-dashboard" *ngIf="currentStudent">
        
        <!-- Fiche Joueur -->
        <div class="player-card">
          <div class="card-header">
            <h2>🎮 {{ currentStudent.displayName }}</h2>
            <div class="specialization-badge">
              {{ getSpecializationLabel() }}
            </div>
          </div>

          <div class="profile-stats">
            <div class="stat-item">
              <div class="stat-value">{{ currentStudent.status.profileCompleteness }}%</div>
              <div class="stat-label">Profil Complété</div>
              <div class="progress-bar">
                <div class="progress-fill" [style.width.%]="currentStudent.status.profileCompleteness"></div>
              </div>
            </div>

            <div class="stat-item">
              <div class="stat-value">{{ currentStudent.promotion }}</div>
              <div class="stat-label">Promotion</div>
            </div>

            <div class="stat-item">
              <div class="stat-value">{{ currentStudent.studentId }}</div>
              <div class="stat-label">Numéro Étudiant</div>
            </div>
          </div>
        </div>

        <!-- État du questionnaire -->
        <div class="questionnaire-status">
          <div class="status-card" [ngClass]="getQuestionnaireStatusClass()">
            <div class="status-icon">{{ getQuestionnaireStatusIcon() }}</div>
            <div class="status-content">
              <h3>{{ getQuestionnaireStatusTitle() }}</h3>
              <p>{{ getQuestionnaireStatusDescription() }}</p>
              
              <div class="status-actions" *ngIf="!hasCompletedQuestionnaire">
                <button class="btn btn-primary" (click)="goToQuestionnaire()">
                  📋 Compléter le Questionnaire
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions disponibles -->
        <div class="dashboard-actions">
          <div class="actions-grid">
            
            <div class="action-card available" *ngIf="hasCompletedQuestionnaire">
              <div class="action-icon">👥</div>
              <h4>Formation d'Équipes</h4>
              <p>Votre profil est prêt ! Attendez l'annonce de la formation des équipes.</p>
              <div class="action-status ready">✅ Prêt</div>
            </div>

            <div class="action-card" [class.available]="hasCompletedQuestionnaire">
              <div class="action-icon">📊</div>
              <h4>Tableau de Bord</h4>
              <p>Suivez les statistiques et l'état de votre future équipe.</p>
              <div class="action-status" [class.ready]="hasCompletedQuestionnaire">
                {{ hasCompletedQuestionnaire ? '✅ Disponible' : '⏳ En attente' }}
              </div>
            </div>

            <div class="action-card" [class.available]="hasCompletedQuestionnaire">
              <div class="action-icon">🏁</div>
              <h4>Challenges</h4>
              <p>Participez aux challenges une fois votre équipe formée.</p>
              <div class="action-status" [class.ready]="false">
                ⏳ Équipe requise
              </div>
            </div>

            <div class="action-card available">
              <div class="action-icon">📚</div>
              <h4>Documentation</h4>
              <p>Consultez les guides et règles du hackathon.</p>
              <div class="action-status ready">📖 Disponible</div>
            </div>

          </div>
        </div>

        <!-- Informations système -->
        <div class="system-info">
          <h4>🔧 Informations Système</h4>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">État du Service :</span>
              <span class="info-value" [class.status-ok]="systemHealth?.status === 'OK'">
                {{ systemHealth?.status || 'Inconnu' }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">Dernière Activité :</span>
              <span class="info-value">{{ formatLastActivity() }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Profil ID :</span>
              <span class="info-value">{{ currentStudent.id }}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .dashboard-container {
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
    }

    .no-profile-card {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
    }

    .empty-state {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      text-align: center;
      max-width: 500px;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .empty-actions {
      margin-top: 2rem;
    }

    .profile-dashboard {
      display: grid;
      gap: 2rem;
      grid-template-columns: 1fr;
    }

    .player-card {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border-radius: 16px;
      padding: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    }

    .card-header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .card-header h2 {
      margin: 0 0 1rem 0;
      font-size: 2rem;
    }

    .specialization-badge {
      background: rgba(255, 255, 255, 0.2);
      padding: 0.5rem 1rem;
      border-radius: 20px;
      display: inline-block;
      font-weight: 600;
    }

    .profile-stats {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    .stat-item {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 1rem;
      text-align: center;
      backdrop-filter: blur(10px);
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 0.5rem;
    }

    .stat-label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .progress-bar {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 10px;
      height: 6px;
      margin-top: 0.5rem;
      overflow: hidden;
    }

    .progress-fill {
      background: #48bb78;
      height: 100%;
      transition: width 0.5s ease;
    }

    .questionnaire-status {
      margin: 2rem 0;
    }

    .status-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
      padding: 2rem;
      display: flex;
      align-items: center;
      gap: 1.5rem;
      border-left: 4px solid #e2e8f0;
    }

    .status-card.pending {
      border-left-color: #f6ad55;
      background: linear-gradient(90deg, #fffaf0 0%, white 100%);
    }

    .status-card.completed {
      border-left-color: #48bb78;
      background: linear-gradient(90deg, #f0fff4 0%, white 100%);
    }

    .status-icon {
      font-size: 3rem;
    }

    .status-content h3 {
      margin: 0 0 0.5rem 0;
      color: #2d3748;
    }

    .status-content p {
      margin: 0 0 1rem 0;
      color: #718096;
    }

    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 1.5rem;
      margin-top: 1rem;
    }

    .action-card {
      background: white;
      border: 2px solid #e2e8f0;
      border-radius: 12px;
      padding: 1.5rem;
      text-align: center;
      transition: all 0.3s;
      opacity: 0.6;
    }

    .action-card.available {
      opacity: 1;
      cursor: pointer;
    }

    .action-card.available:hover {
      border-color: #667eea;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.2);
    }

    .action-icon {
      font-size: 2.5rem;
      margin-bottom: 1rem;
    }

    .action-card h4 {
      margin: 0 0 0.5rem 0;
      color: #2d3748;
    }

    .action-card p {
      margin: 0 0 1rem 0;
      color: #718096;
      font-size: 0.9rem;
    }

    .action-status {
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 600;
      background: #edf2f7;
      color: #4a5568;
    }

    .action-status.ready {
      background: #c6f6d5;
      color: #22543d;
    }

    .system-info {
      background: #f8f9fa;
      border-radius: 12px;
      padding: 1.5rem;
      margin-top: 2rem;
    }

    .system-info h4 {
      margin: 0 0 1rem 0;
      color: #4a5568;
    }

    .info-grid {
      display: grid;
      gap: 0.5rem;
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      border-bottom: 1px solid #e2e8f0;
    }

    .info-item:last-child {
      border-bottom: none;
    }

    .info-label {
      font-weight: 600;
      color: #4a5568;
    }

    .info-value {
      color: #718096;
      font-family: monospace;
    }

    .info-value.status-ok {
      color: #38a169;
      font-weight: 600;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    @media (max-width: 768px) {
      .dashboard-container {
        padding: 1rem;
      }
      
      .profile-stats {
        grid-template-columns: 1fr;
      }
      
      .actions-grid {
        grid-template-columns: 1fr;
      }
      
      .status-card {
        flex-direction: column;
        text-align: center;
      }
    }
  `]
})
export class ProfileDashboardComponent implements OnInit {
  currentStudent: any = null;
  hasCompletedQuestionnaire = false;
  systemHealth: any = null;

  constructor(
    private studentProfileService: StudentProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentStudent();
    this.checkQuestionnaireStatus();
    this.loadSystemHealth();
  }

  private loadCurrentStudent(): void {
    this.studentProfileService.currentStudent$.subscribe(student => {
      this.currentStudent = student;
      
      if (!student) {
        // Tenter de récupérer depuis localStorage
        const stored = this.studentProfileService.loadCurrentStudent();
        if (!stored) {
          console.log('👤 Aucun profil étudiant trouvé');
        }
      }
    });
  }

  private checkQuestionnaireStatus(): void {
    if (this.currentStudent) {
      this.studentProfileService.getQuestionnaireStatus(this.currentStudent.id).subscribe({
        next: (status) => {
          this.hasCompletedQuestionnaire = status.questionnaireCompleted;
          console.log('📋 Statut questionnaire:', status.questionnaireCompleted);
        },
        error: (error) => {
          console.error('❌ Erreur vérification questionnaire:', error);
        }
      });
    }
  }

  private loadSystemHealth(): void {
    this.studentProfileService.getHealth().subscribe({
      next: (health) => {
        this.systemHealth = health;
        console.log('🔧 Santé système:', health);
      },
      error: (error) => {
        console.error('❌ Erreur santé système:', error);
      }
    });
  }

  getQuestionnaireStatusClass(): string {
    return this.hasCompletedQuestionnaire ? 'completed' : 'pending';
  }

  getQuestionnaireStatusIcon(): string {
    return this.hasCompletedQuestionnaire ? '✅' : '⏳';
  }

  getQuestionnaireStatusTitle(): string {
    return this.hasCompletedQuestionnaire 
      ? 'Questionnaire Terminé !' 
      : 'Questionnaire en Attente';
  }

  getQuestionnaireStatusDescription(): string {
    return this.hasCompletedQuestionnaire 
      ? 'Votre auto-évaluation est complète. Vous êtes prêt(e) pour la formation des équipes !'
      : 'Vous devez compléter le questionnaire d\'auto-évaluation pour participer au hackathon.';
  }

  getSpecializationLabel(): string {
    if (!this.currentStudent) return '';
    return this.studentProfileService.getSpecializationLabel(this.currentStudent.specialization);
  }

  formatLastActivity(): string {
    if (!this.currentStudent) return '';
    
    const lastActivity = new Date(this.currentStudent.status.lastLoginDate || this.currentStudent.updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - lastActivity.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    
    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `Il y a ${diffDays} jour(s)`;
  }

  goToProfileCreation(): void {
    this.router.navigate(['/student-profile/create']);
  }

  goToQuestionnaire(): void {
    if (this.currentStudent) {
      this.router.navigate(['/student-profile/questionnaire', this.currentStudent.id]);
    }
  }

  refreshProfile(): void {
    if (this.currentStudent) {
      this.studentProfileService.getProfile(this.currentStudent.id).subscribe({
        next: (updatedStudent) => {
          this.studentProfileService.setCurrentStudent(updatedStudent);
        },
        error: (error) => {
          console.error('❌ Erreur refresh profil:', error);
        }
      });
    }
  }

  logout(): void {
    this.studentProfileService.setCurrentStudent(null);
    this.router.navigate(['/student-profile/create']);
  }
}