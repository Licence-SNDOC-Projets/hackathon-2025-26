import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { StudentProfileService } from '../../services/student-profile.service';

@Component({
  selector: 'app-profile-creation',
  template: `
    <div class="profile-creation-container">
      <div class="creation-card">
        <h2>🎮 Créer Votre Profil Joueur</h2>
        <p class="description">
          Bienvenue dans la MQTT Race ! Pour participer, vous devez d'abord créer votre profil étudiant.
        </p>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()" class="profile-form">
          
          <!-- Informations personnelles -->
          <div class="form-section">
            <h3>👤 Informations Personnelles</h3>
            
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">Prénom *</label>
                <input 
                  id="firstName"
                  type="text" 
                  formControlName="firstName"
                  placeholder="Votre prénom"
                  [class.error]="isFieldInvalid('firstName')"
                />
                <div class="error-message" *ngIf="isFieldInvalid('firstName')">
                  Le prénom est requis (minimum 2 caractères)
                </div>
              </div>

              <div class="form-group">
                <label for="lastName">Nom *</label>
                <input 
                  id="lastName"
                  type="text" 
                  formControlName="lastName"
                  placeholder="Votre nom"
                  [class.error]="isFieldInvalid('lastName')"
                />
                <div class="error-message" *ngIf="isFieldInvalid('lastName')">
                  Le nom est requis (minimum 2 caractères)
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="email">Email Étudiant *</label>
              <input 
                id="email"
                type="email" 
                formControlName="email"
                placeholder="votre.email@etudiant.fr"
                [class.error]="isFieldInvalid('email')"
              />
              <div class="error-message" *ngIf="isFieldInvalid('email')">
                Adresse email valide requise
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="studentId">Numéro Étudiant *</label>
                <input 
                  id="studentId"
                  type="text" 
                  formControlName="studentId"
                  placeholder="Ex: ETU2024001"
                  [class.error]="isFieldInvalid('studentId')"
                />
                <div class="error-message" *ngIf="isFieldInvalid('studentId')">
                  Numéro étudiant requis
                </div>
              </div>

              <div class="form-group">
                <label for="promotion">Promotion *</label>
                <select 
                  id="promotion"
                  formControlName="promotion"
                  [class.error]="isFieldInvalid('promotion')"
                >
                  <option value="">Sélectionnez votre promotion</option>
                  <option *ngFor="let promo of promotions" [value]="promo">
                    {{ promo }}
                  </option>
                </select>
                <div class="error-message" *ngIf="isFieldInvalid('promotion')">
                  Promotion requise
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="specialization">Spécialisation *</label>
              <select 
                id="specialization"
                formControlName="specialization"
                [class.error]="isFieldInvalid('specialization')"
              >
                <option value="">Sélectionnez votre spécialisation</option>
                <option *ngFor="let spec of specializations" [value]="spec.value">
                  {{ spec.label }}
                </option>
              </select>
              <div class="error-message" *ngIf="isFieldInvalid('specialization')">
                Spécialisation requise
              </div>
            </div>
          </div>

          <!-- Erreurs générales -->
          <div class="error-section" *ngIf="formErrors.length > 0">
            <h4>❌ Erreurs à corriger :</h4>
            <ul>
              <li *ngFor="let error of formErrors">{{ error }}</li>
            </ul>
          </div>

          <!-- Actions -->
          <div class="form-actions">
            <button 
              type="button" 
              class="btn btn-secondary"
              (click)="resetForm()"
            >
              🔄 Réinitialiser
            </button>
            
            <button 
              type="submit" 
              class="btn btn-primary"
              [disabled]="isSubmitting || profileForm.invalid"
            >
              <span *ngIf="isSubmitting">⏳ Création en cours...</span>
              <span *ngIf="!isSubmitting">✨ Créer Mon Profil</span>
            </button>
          </div>
        </form>

        <!-- Message de succès -->
        <div class="success-message" *ngIf="createdProfile">
          <h3>🎉 Profil Créé avec Succès !</h3>
          <p>Votre profil a été créé. Il est temps de compléter le questionnaire d'auto-évaluation.</p>
          
          <div class="profile-summary">
            <h4>📝 Récapitulatif :</h4>
            <p><strong>Nom :</strong> {{ createdProfile.displayName }}</p>
            <p><strong>Email :</strong> {{ createdProfile.email }}</p>
            <p><strong>Promotion :</strong> {{ createdProfile.promotion }}</p>
            <p><strong>Spécialisation :</strong> {{ getSpecLabel(createdProfile.specialization) }}</p>
          </div>

          <div class="next-actions">
            <button 
              class="btn btn-primary"
              (click)="goToQuestionnaire()"
            >
              📋 Compléter le Questionnaire
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .profile-creation-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: calc(100vh - 200px);
      padding: 1rem;
    }

    .creation-card {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
      padding: 2rem;
      width: 100%;
      max-width: 800px;
    }

    .creation-card h2 {
      text-align: center;
      color: #2d3748;
      margin-bottom: 0.5rem;
      font-size: 1.8rem;
    }

    .description {
      text-align: center;
      color: #718096;
      margin-bottom: 2rem;
      font-size: 1.1rem;
    }

    .form-section {
      margin-bottom: 2rem;
    }

    .form-section h3 {
      color: #4a5568;
      border-bottom: 2px solid #e2e8f0;
      padding-bottom: 0.5rem;
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group {
      margin-bottom: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 600;
      color: #4a5568;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-group input:focus,
    .form-group select:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }

    .form-group input.error,
    .form-group select.error {
      border-color: #e53e3e;
    }

    .error-message {
      color: #e53e3e;
      font-size: 0.875rem;
      margin-top: 0.25rem;
    }

    .error-section {
      background: #fed7d7;
      border: 1px solid #e53e3e;
      border-radius: 8px;
      padding: 1rem;
      margin-bottom: 1.5rem;
    }

    .error-section h4 {
      color: #e53e3e;
      margin-bottom: 0.5rem;
    }

    .error-section ul {
      margin: 0;
      padding-left: 1.5rem;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      margin-top: 2rem;
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
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
    }

    .btn-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
    }

    .btn-primary:disabled {
      background: #a0aec0;
      cursor: not-allowed;
      transform: none;
    }

    .btn-secondary {
      background: #edf2f7;
      color: #4a5568;
    }

    .btn-secondary:hover {
      background: #e2e8f0;
    }

    .success-message {
      background: #c6f6d5;
      border: 1px solid #38a169;
      border-radius: 12px;
      padding: 2rem;
      text-align: center;
      margin-top: 2rem;
    }

    .success-message h3 {
      color: #38a169;
      margin-bottom: 1rem;
    }

    .profile-summary {
      background: white;
      border-radius: 8px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .profile-summary h4 {
      color: #4a5568;
      margin-bottom: 0.5rem;
    }

    .next-actions {
      margin-top: 1.5rem;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .creation-card {
        padding: 1.5rem;
      }
      
      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class ProfileCreationComponent implements OnInit {
  profileForm!: FormGroup;
  isSubmitting = false;
  formErrors: string[] = [];
  createdProfile: any = null;

  specializations: Array<{value: string, label: string}> = [];
  promotions: string[] = [];

  constructor(
    private fb: FormBuilder,
    private studentProfileService: StudentProfileService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadFormOptions();
  }

  private initForm(): void {
    this.profileForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      studentId: ['', [Validators.required, Validators.minLength(3)]],
      promotion: ['', [Validators.required]],
      specialization: ['', [Validators.required]]
    });
  }

  private loadFormOptions(): void {
    this.specializations = this.studentProfileService.getAvailableSpecializations();
    this.promotions = this.studentProfileService.getAvailablePromotions();
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.profileForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.formErrors = [];

    const formValue = this.profileForm.value;
    
    // Validation côté client
    const clientErrors = this.studentProfileService.validateProfileData(formValue);
    if (clientErrors.length > 0) {
      this.formErrors = clientErrors;
      this.isSubmitting = false;
      return;
    }

    // Envoi au backend
    this.studentProfileService.createProfile(formValue).subscribe({
      next: (createdStudent) => {
        console.log('✅ Profil créé:', createdStudent);
        this.createdProfile = createdStudent;
        this.studentProfileService.setCurrentStudent(createdStudent);
        this.isSubmitting = false;
      },
      error: (error) => {
        console.error('❌ Erreur création profil:', error);
        this.handleCreationError(error);
        this.isSubmitting = false;
      }
    });
  }

  private handleCreationError(error: any): void {
    if (error.error && error.error.errors) {
      this.formErrors = error.error.errors;
    } else if (error.error && error.error.message) {
      this.formErrors = [error.error.message];
    } else {
      this.formErrors = ['Une erreur inattendue s\'est produite. Veuillez réessayer.'];
    }
  }

  resetForm(): void {
    this.profileForm.reset();
    this.formErrors = [];
    this.createdProfile = null;
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

  goToQuestionnaire(): void {
    if (this.createdProfile) {
      this.router.navigate(['/student-profile/questionnaire', this.createdProfile.id]);
    }
  }

  getSpecLabel(value: string): string {
    return this.studentProfileService.getSpecializationLabel(value);
  }
}