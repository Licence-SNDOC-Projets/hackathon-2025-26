import { Component, OnInit } from '@angular/core';
import { StudentProfileService } from '../../services/student-profile.service';

@Component({
  selector: 'app-student-profile',
  template: `
    <div class="student-profile-container">
      <header class="challenge-header">
        <div class="header-content">
          <h1>🎓 Profil Étudiant</h1>
          <p class="subtitle">Créez votre profil et complétez le questionnaire d'auto-évaluation</p>
        </div>
      </header>

      <main class="challenge-main">
        <router-outlet></router-outlet>
      </main>

      <footer class="challenge-footer">
        <div class="footer-content">
          <p>💡 <strong>Important :</strong> Le questionnaire ne peut être rempli qu'une seule fois. Prenez le temps de bien réfléchir à vos réponses.</p>
        </div>
      </footer>
    </div>
  `,
  styles: [`
    .student-profile-container {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .challenge-header {
      background: rgba(255, 255, 255, 0.95);
      padding: 2rem;
      box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
    }

    .header-content {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }

    .challenge-header h1 {
      font-size: 2.5rem;
      margin: 0 0 0.5rem 0;
      color: #2d3748;
      font-weight: 700;
    }

    .subtitle {
      font-size: 1.2rem;
      color: #718096;
      margin: 0;
    }

    .challenge-main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }

    .challenge-footer {
      background: rgba(255, 255, 255, 0.9);
      padding: 1rem 2rem;
      backdrop-filter: blur(10px);
    }

    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      text-align: center;
    }

    .footer-content p {
      margin: 0;
      color: #4a5568;
    }

    @media (max-width: 768px) {
      .challenge-header h1 {
        font-size: 2rem;
      }
      
      .subtitle {
        font-size: 1rem;
      }
      
      .challenge-main {
        padding: 1rem;
      }
      
      .challenge-header,
      .challenge-footer {
        padding: 1rem;
      }
    }
  `]
})
export class StudentProfileComponent implements OnInit {

  constructor(
    private studentProfileService: StudentProfileService
  ) {}

  ngOnInit(): void {
    console.log('🎓 StudentProfileComponent initialisé');
    
    // Tenter de charger l'étudiant depuis le localStorage
    this.studentProfileService.loadCurrentStudent();
    
    // Vérifier la santé du module
    this.studentProfileService.getHealth().subscribe({
      next: (health) => {
        console.log('✅ Module StudentProfile opérationnel:', health);
      },
      error: (error) => {
        console.error('❌ Erreur santé module StudentProfile:', error);
      }
    });
  }
}