import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { StudentProfileService } from '../../services/student-profile.service';

@Component({
  selector: 'app-questionnaire',
  template: `
    <div class="questionnaire-container" *ngIf="!isQuestionnaireLocked; else lockedTemplate">
      <div class="questionnaire-card">
        <div class="questionnaire-header">
          <h2>📋 Questionnaire d'Auto-Évaluation</h2>
          <div class="student-info">
            <p><strong>🎮 Joueur :</strong> {{ currentStudent?.displayName }}</p>
            <p><strong>🏫 Spécialisation :</strong> {{ getSpecializationLabel() }}</p>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" [style.width.%]="getFormProgress()"></div>
            <span class="progress-text">{{ getFormProgress() }}% complété</span>
          </div>
        </div>

        <form [formGroup]="questionnaireForm" (ngSubmit)="onSubmit()" class="questionnaire-form">
          
          <!-- Section 1: Compétences Techniques -->
          <div class="form-section" [class.active]="currentSection === 1">
            <h3>💻 Compétences Techniques</h3>
            <p class="section-description">
              Évaluez vos compétences techniques sur une échelle de 1 à 5 (1 = débutant, 5 = expert)
            </p>

            <div class="skills-grid">
              <div class="skill-item">
                <label>💻 Programmation</label>
                <div class="skill-rating">
                  <input type="range" min="1" max="5" formControlName="programmingLevel" class="slider">
                  <span class="rating-value">{{ questionnaireForm.get('programmingLevel')?.value }}/5</span>
                </div>
                <div class="skill-description">
                  Capacité à écrire du code, résoudre des problèmes algorithmiques
                </div>
              </div>

              <div class="skill-item">
                <label>⚡ Électronique</label>
                <div class="skill-rating">
                  <input type="range" min="1" max="5" formControlName="electronicsLevel" class="slider">
                  <span class="rating-value">{{ questionnaireForm.get('electronicsLevel')?.value }}/5</span>
                </div>
                <div class="skill-description">
                  Circuits, capteurs, composants électroniques
                </div>
              </div>

              <div class="skill-item">
                <label>🔧 Mécanique</label>
                <div class="skill-rating">
                  <input type="range" min="1" max="5" formControlName="mechanicsLevel" class="slider">
                  <span class="rating-value">{{ questionnaireForm.get('mechanicsLevel')?.value }}/5</span>
                </div>
                <div class="skill-description">
                  Assemblage, conception mécanique, fabrication
                </div>
              </div>

              <div class="skill-item">
                <label>📡 IoT / MQTT</label>
                <div class="skill-rating">
                  <input type="range" min="1" max="5" formControlName="iotLevel" class="slider">
                  <span class="rating-value">{{ questionnaireForm.get('iotLevel')?.value }}/5</span>
                </div>
                <div class="skill-description">
                  Protocoles de communication, objets connectés
                </div>
              </div>
            </div>

            <div class="programming-details" *ngIf="questionnaireForm.get('programmingLevel')?.value >= 2">
              <h4>🚀 Langages de Programmation</h4>
              <div class="languages-grid">
                <label *ngFor="let lang of availableLanguages" class="checkbox-label">
                  <input type="checkbox" [value]="lang.value" (change)="toggleLanguage(lang.value)">
                  <span>{{ lang.label }}</span>
                </label>
              </div>
            </div>
          </div>

          <!-- Section 2: Compétences Relationnelles -->
          <div class="form-section" [class.active]="currentSection === 2">
            <h3>🤝 Compétences Relationnelles</h3>
            <p class="section-description">
              Ces compétences sont essentielles pour le travail en équipe
            </p>

            <div class="skills-grid">
              <div class="skill-item">
                <label>👥 Travail d'équipe</label>
                <div class="skill-rating">
                  <input type="range" min="1" max="5" formControlName="teamworkLevel" class="slider">
                  <span class="rating-value">{{ questionnaireForm.get('teamworkLevel')?.value }}/5</span>
                </div>
              </div>

              <div class="skill-item">
                <label>🧠 Leadership</label>
                <div class="skill-rating">
                  <input type="range" min="1" max="5" formControlName="leadershipLevel" class="slider">
                  <span class="rating-value">{{ questionnaireForm.get('leadershipLevel')?.value }}/5</span>
                </div>
              </div>

              <div class="skill-item">
                <label>💬 Communication</label>
                <div class="skill-rating">
                  <input type="range" min="1" max="5" formControlName="communicationLevel" class="slider">
                  <span class="rating-value">{{ questionnaireForm.get('communicationLevel')?.value }}/5</span>
                </div>
              </div>

              <div class="skill-item">
                <label>🧩 Résolution de problèmes</label>
                <div class="skill-rating">
                  <input type="range" min="1" max="5" formControlName="problemSolvingLevel" class="slider">
                  <span class="rating-value">{{ questionnaireForm.get('problemSolvingLevel')?.value }}/5</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Section 3: Préférences -->
          <div class="form-section" [class.active]="currentSection === 3">
            <h3>🎯 Préférences de Travail</h3>

            <div class="form-group">
              <label>🎮 Rôle Préféré dans l'Équipe</label>
              <select formControlName="preferredRole" class="form-select">
                <option value="">Sélectionnez votre rôle préféré</option>
                <option value="captain">🧠 Capitaine / Chef d'équipe</option>
                <option value="lead-developer">💻 Développeur Principal</option>
                <option value="backend-developer">⚙️ Développeur Backend</option>
                <option value="frontend-developer">🎨 Développeur Frontend</option>
                <option value="electronics-engineer">⚡ Ingénieur Électronique</option>
                <option value="mechanical-engineer">🔧 Ingénieur Mécanique</option>
                <option value="tester">🧪 Testeur / QA</option>
                <option value="designer">🎨 Designer / UI/UX</option>
              </select>
            </div>

            <div class="form-group">
              <label>🎭 Style de Travail</label>
              <div class="radio-group">
                <label *ngFor="let style of workingStyles" class="radio-label">
                  <input type="radio" formControlName="workingStyle" [value]="style.value">
                  <span>{{ style.emoji }} {{ style.label }}</span>
                  <small>{{ style.description }}</small>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label>🎯 Centres d'Intérêt / Technologies</label>
              <textarea 
                formControlName="interests"
                placeholder="Ex: Intelligence Artificielle, Robotique, Développement Web, Électronique embarquée..."
                rows="3"
                class="form-textarea"
              ></textarea>
              <small>Séparez vos centres d'intérêt par des virgules</small>
            </div>
          </div>

          <!-- Section Navigation -->
          <div class="form-navigation">
            <button 
              type="button" 
              class="btn btn-secondary"
              (click)="previousSection()"
              [disabled]="currentSection === 1"
            >
              ⬅️ Précédent
            </button>

            <div class="section-indicators">
              <span 
                *ngFor="let section of [1,2,3]; let i = index"
                class="indicator"
                [class.active]="currentSection === section"
                [class.completed]="isSectionCompleted(section)"
              >
                {{ section }}
              </span>
            </div>

            <button 
              *ngIf="currentSection < 3"
              type="button" 
              class="btn btn-primary"
              (click)="nextSection()"
              [disabled]="!isSectionCompleted(currentSection)"
            >
              Suivant ➡️
            </button>

            <button 
              *ngIf="currentSection === 3"
              type="submit" 
              class="btn btn-success"
              [disabled]="isSubmitting || !isFormComplete()"
            >
              <span *ngIf="isSubmitting">⏳ Soumission...</span>
              <span *ngIf="!isSubmitting">🎉 Finaliser mon Profil</span>
            </button>
          </div>

          <!-- Erreurs -->
          <div class="error-section" *ngIf="formErrors.length > 0">
            <h4>❌ Erreurs à corriger :</h4>
            <ul>
              <li *ngFor="let error of formErrors">{{ error }}</li>
            </ul>
          </div>
        </form>
      </div>
    </div>

    <!-- Template si questionnaire déjà complété -->
    <ng-template #lockedTemplate>
      <div class="locked-container">
        <div class="locked-card">
          <div class="locked-icon">🔒</div>
          <h2>Questionnaire Déjà Complété</h2>
          <p>Vous avez déjà rempli le questionnaire d'auto-évaluation. Il ne peut être complété qu'une seule fois.</p>
          
          <div class="locked-actions">
            <button class="btn btn-primary" (click)="goToDashboard()">
              📊 Voir mon Profil
            </button>
          </div>
        </div>
      </div>
    </ng-template>
  `,
  styles: [`
    .questionnaire-container {
      padding: 2rem;
      max-width: 900px;
      margin: 0 auto;
    }

    .questionnaire-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .questionnaire-header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 2rem;
      text-align: center;
    }

    .questionnaire-header h2 {
      margin: 0 0 1rem 0;
      font-size: 1.8rem;
    }

    .student-info p {
      margin: 0.5rem 0;
      opacity: 0.9;
    }

    .progress-bar {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 20px;
      height: 8px;
      margin-top: 1rem;
      position: relative;
      overflow: hidden;
    }

    .progress-fill {
      background: #48bb78;
      height: 100%;
      transition: width 0.3s ease;
    }

    .progress-text {
      position: absolute;
      top: -25px;
      right: 0;
      font-size: 0.875rem;
      font-weight: 600;
    }

    .questionnaire-form {
      padding: 2rem;
    }

    .form-section {
      display: none;
      animation: fadeIn 0.3s ease-in;
    }

    .form-section.active {
      display: block;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-section h3 {
      color: #4a5568;
      margin-bottom: 0.5rem;
      font-size: 1.4rem;
    }

    .section-description {
      color: #718096;
      margin-bottom: 2rem;
      font-style: italic;
    }

    .skills-grid {
      display: grid;
      gap: 1.5rem;
      grid-template-columns: 1fr;
    }

    .skill-item {
      background: #f7fafc;
      border-radius: 12px;
      padding: 1.5rem;
      border: 2px solid #e2e8f0;
      transition: border-color 0.3s;
    }

    .skill-item:hover {
      border-color: #667eea;
    }

    .skill-item label {
      font-weight: 600;
      color: #2d3748;
      font-size: 1.1rem;
      display: block;
      margin-bottom: 1rem;
    }

    .skill-rating {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.5rem;
    }

    .slider {
      flex: 1;
      height: 8px;
      border-radius: 4px;
      background: #e2e8f0;
      outline: none;
      cursor: pointer;
    }

    .slider::-webkit-slider-thumb {
      appearance: none;
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: #667eea;
      cursor: pointer;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .rating-value {
      font-weight: 700;
      color: #667eea;
      min-width: 40px;
      text-align: center;
    }

    .skill-description {
      font-size: 0.875rem;
      color: #718096;
    }

    .programming-details {
      margin-top: 2rem;
      padding-top: 2rem;
      border-top: 2px solid #e2e8f0;
    }

    .programming-details h4 {
      color: #4a5568;
      margin-bottom: 1rem;
    }

    .languages-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 0.5rem;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem;
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    }

    .checkbox-label:hover {
      background: #edf2f7;
    }

    .checkbox-label input[type="checkbox"] {
      margin: 0;
    }

    .radio-group {
      display: grid;
      gap: 1rem;
      grid-template-columns: 1fr;
    }

    .radio-label {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .radio-label:has(input:checked) {
      border-color: #667eea;
      background: #f0f4ff;
    }

    .radio-label small {
      color: #718096;
      font-size: 0.825rem;
    }

    .form-select,
    .form-textarea {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
    }

    .form-textarea {
      resize: vertical;
      min-height: 100px;
    }

    .form-navigation {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid #f0f4ff;
    }

    .section-indicators {
      display: flex;
      gap: 0.5rem;
    }

    .indicator {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #a0aec0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      transition: all 0.3s;
    }

    .indicator.active {
      background: #667eea;
      color: white;
      transform: scale(1.1);
    }

    .indicator.completed {
      background: #48bb78;
      color: white;
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-primary {
      background: #667eea;
      color: white;
    }

    .btn-secondary {
      background: #e2e8f0;
      color: #4a5568;
    }

    .btn-success {
      background: #48bb78;
      color: white;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .error-section {
      background: #fed7d7;
      border: 1px solid #e53e3e;
      border-radius: 8px;
      padding: 1rem;
      margin-top: 1rem;
    }

    .locked-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 60vh;
      padding: 2rem;
    }

    .locked-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
      padding: 3rem;
      text-align: center;
      max-width: 500px;
    }

    .locked-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
    }

    .locked-card h2 {
      color: #4a5568;
      margin-bottom: 1rem;
    }

    .locked-actions {
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .questionnaire-container {
        padding: 1rem;
      }
      
      .skills-grid {
        grid-template-columns: 1fr;
      }
      
      .languages-grid {
        grid-template-columns: 1fr;
      }
      
      .form-navigation {
        flex-direction: column;
        gap: 1rem;
      }
    }
  `]
})
export class QuestionnaireComponent implements OnInit {
  questionnaireForm!: FormGroup;
  currentSection = 1;
  isSubmitting = false;
  formErrors: string[] = [];
  isQuestionnaireLocked = false;
  currentStudent: any = null;
  studentId: string = '';

  availableLanguages = [
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'python', label: 'Python' },
    { value: 'java', label: 'Java' },
    { value: 'cpp', label: 'C/C++' },
    { value: 'csharp', label: 'C#' },
    { value: 'php', label: 'PHP' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'arduino', label: 'Arduino (C++)' }
  ];

  workingStyles = [
    { value: 'methodical', emoji: '📋', label: 'Méthodique', description: 'J\'aime suivre des processus clairs' },
    { value: 'creative', emoji: '🎨', label: 'Créatif', description: 'J\'aime explorer de nouvelles solutions' },
    { value: 'fast-paced', emoji: '⚡', label: 'Rapide', description: 'J\'aime travailler efficacement' },
    { value: 'analytical', emoji: '🔬', label: 'Analytique', description: 'J\'aime analyser en détail' },
    { value: 'collaborative', emoji: '🤝', label: 'Collaboratif', description: 'J\'aime travailler en équipe' }
  ];

  selectedLanguages: string[] = [];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private studentProfileService: StudentProfileService
  ) {}

  ngOnInit(): void {
    this.studentId = this.route.snapshot.paramMap.get('studentId') || '';
    this.initForm();
    this.checkQuestionnaireStatus();
    this.loadCurrentStudent();
  }

  private initForm(): void {
    this.questionnaireForm = this.fb.group({
      // Compétences techniques
      programmingLevel: [2, [Validators.min(1), Validators.max(5)]],
      electronicsLevel: [1, [Validators.min(1), Validators.max(5)]],
      mechanicsLevel: [1, [Validators.min(1), Validators.max(5)]],
      iotLevel: [1, [Validators.min(1), Validators.max(5)]],
      
      // Compétences relationnelles
      teamworkLevel: [3, [Validators.min(1), Validators.max(5)]],
      leadershipLevel: [2, [Validators.min(1), Validators.max(5)]],
      communicationLevel: [3, [Validators.min(1), Validators.max(5)]],
      problemSolvingLevel: [3, [Validators.min(1), Validators.max(5)]],
      
      // Préférences
      preferredRole: ['', Validators.required],
      workingStyle: ['collaborative', Validators.required],
      interests: ['']
    });
  }

  private checkQuestionnaireStatus(): void {
    this.studentProfileService.getQuestionnaireStatus(this.studentId).subscribe({
      next: (status) => {
        this.isQuestionnaireLocked = status.questionnaireCompleted;
        if (this.isQuestionnaireLocked) {
          console.log('🔒 Questionnaire déjà complété pour:', this.studentId);
        }
      },
      error: (error) => {
        console.error('❌ Erreur vérification statut questionnaire:', error);
      }
    });
  }

  private loadCurrentStudent(): void {
    this.studentProfileService.currentStudent$.subscribe(student => {
      this.currentStudent = student;
    });
  }

  getFormProgress(): number {
    if (!this.questionnaireForm) return 0;
    
    let totalFields = 0;
    let completedFields = 0;

    // Compter les champs dans chaque section
    const sections = [
      ['programmingLevel', 'electronicsLevel', 'mechanicsLevel', 'iotLevel'],
      ['teamworkLevel', 'leadershipLevel', 'communicationLevel', 'problemSolvingLevel'],
      ['preferredRole', 'workingStyle', 'interests']
    ];

    for (let i = 0; i < this.currentSection; i++) {
      const sectionFields = sections[i];
      totalFields += sectionFields.length;
      
      sectionFields.forEach(field => {
        const control = this.questionnaireForm.get(field);
        if (control && control.value && control.valid) {
          completedFields++;
        }
      });
    }

    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }

  isSectionCompleted(section: number): boolean {
    const sections = [
      ['programmingLevel', 'electronicsLevel', 'mechanicsLevel', 'iotLevel'],
      ['teamworkLevel', 'leadershipLevel', 'communicationLevel', 'problemSolvingLevel'],
      ['preferredRole', 'workingStyle']
    ];

    const sectionFields = sections[section - 1];
    if (!sectionFields) return false;

    return sectionFields.every(field => {
      const control = this.questionnaireForm.get(field);
      return control && control.value && control.valid;
    });
  }

  isFormComplete(): boolean {
    return this.isSectionCompleted(1) && this.isSectionCompleted(2) && this.isSectionCompleted(3);
  }

  nextSection(): void {
    if (this.currentSection < 3 && this.isSectionCompleted(this.currentSection)) {
      this.currentSection++;
    }
  }

  previousSection(): void {
    if (this.currentSection > 1) {
      this.currentSection--;
    }
  }

  toggleLanguage(language: string): void {
    const index = this.selectedLanguages.indexOf(language);
    if (index > -1) {
      this.selectedLanguages.splice(index, 1);
    } else {
      this.selectedLanguages.push(language);
    }
  }

  onSubmit(): void {
    if (!this.isFormComplete()) {
      this.formErrors = ['Veuillez compléter toutes les sections obligatoires'];
      return;
    }

    this.isSubmitting = true;
    this.formErrors = [];

    const formValue = this.questionnaireForm.value;
    
    const assessmentData = {
      technical: {
        programming: {
          overallLevel: formValue.programmingLevel,
          languages: this.selectedLanguages.map(lang => ({
            name: lang,
            level: Math.max(1, formValue.programmingLevel - 1),
            yearsOfExperience: formValue.programmingLevel >= 3 ? 1 : 0
          }))
        },
        electronics: formValue.electronicsLevel,
        mechanics: formValue.mechanicsLevel,
        iot: formValue.iotLevel,
        networking: Math.max(1, Math.round((formValue.iotLevel + formValue.programmingLevel) / 2))
      },
      soft: {
        teamwork: formValue.teamworkLevel,
        leadership: formValue.leadershipLevel,
        communication: formValue.communicationLevel,
        problemSolving: formValue.problemSolvingLevel,
        creativity: Math.max(2, formValue.communicationLevel),
        adaptability: Math.max(2, formValue.teamworkLevel)
      },
      preferences: {
        preferredRoles: [formValue.preferredRole],
        workingStyle: formValue.workingStyle
      },
      interests: formValue.interests ? formValue.interests.split(',').map((i: string) => i.trim()) : []
    };

    this.studentProfileService.completeQuestionnaire(this.studentId, assessmentData).subscribe({
      next: (updatedStudent) => {
        console.log('✅ Questionnaire complété:', updatedStudent);
        this.studentProfileService.setCurrentStudent(updatedStudent);
        this.isSubmitting = false;
        this.router.navigate(['/student-profile/dashboard']);
      },
      error: (error) => {
        console.error('❌ Erreur soumission questionnaire:', error);
        this.handleSubmissionError(error);
        this.isSubmitting = false;
      }
    });
  }

  private handleSubmissionError(error: any): void {
    if (error.error && error.error.errors) {
      this.formErrors = error.error.errors;
    } else if (error.error && error.error.message) {
      this.formErrors = [error.error.message];
    } else {
      this.formErrors = ['Une erreur inattendue s\'est produite. Veuillez réessayer.'];
    }
  }

  getSpecializationLabel(): string {
    if (!this.currentStudent) return '';
    return this.studentProfileService.getSpecializationLabel(this.currentStudent.specialization);
  }

  goToDashboard(): void {
    this.router.navigate(['/student-profile/dashboard']);
  }
}