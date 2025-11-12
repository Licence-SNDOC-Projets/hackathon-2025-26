import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
// import { environment } from '../../../../environments/environment';
const environment = { apiUrl: 'http://localhost:3000' }; // Configuration temporaire

// Types temporaires - à remplacer par les librairies partagées
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  studentId: string;
  promotion: string;
  specialization: string;
  status: {
    profileCompleteness: number;
    currentActivity: string;
    isActive: boolean;
  };
}

interface CreateStudentDto {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  promotion: string;
  specialization: string;
}

interface QuestionnaireDto {
  technical?: any;
  soft?: any;
  preferences?: any;
  interests?: string[];
}

@Injectable({
  providedIn: 'root'
})
export class StudentProfileService {
  private apiUrl = `${environment.apiUrl || 'http://localhost:3000'}/api/student-profile`;
  private currentStudentSubject = new BehaviorSubject<Student | null>(null);
  
  public currentStudent$ = this.currentStudentSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Créer un nouveau profil étudiant
   */
  createProfile(createDto: CreateStudentDto): Observable<Student> {
    console.log('🎓 Création profil:', createDto.email);
    return this.http.post<Student>(`${this.apiUrl}/create`, createDto);
  }

  /**
   * Compléter le questionnaire
   */
  completeQuestionnaire(studentId: string, questionnaire: QuestionnaireDto): Observable<Student> {
    console.log('📋 Soumission questionnaire pour:', studentId);
    return this.http.post<Student>(`${this.apiUrl}/${studentId}/questionnaire`, questionnaire);
  }

  /**
   * Obtenir le profil d'un étudiant
   */
  getProfile(studentId: string): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/${studentId}`);
  }

  /**
   * Obtenir le profil par email
   */
  getProfileByEmail(email: string): Observable<Student> {
    return this.http.get<Student>(`${this.apiUrl}/by-email/${email}`);
  }

  /**
   * Vérifier le statut du questionnaire
   */
  getQuestionnaireStatus(studentId: string): Observable<{ questionnaireCompleted: boolean }> {
    return this.http.get<{ questionnaireCompleted: boolean }>(`${this.apiUrl}/${studentId}/questionnaire/status`);
  }

  /**
   * Obtenir les statistiques (pour l'arbitre)
   */
  getStatistics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/stats/overview`);
  }

  /**
   * Health check du module
   */
  getHealth(): Observable<any> {
    return this.http.get(`${this.apiUrl}/health/check`);
  }

  /**
   * Mettre à jour l'étudiant actuel
   */
  setCurrentStudent(student: Student | null): void {
    this.currentStudentSubject.next(student);
    if (student) {
      localStorage.setItem('currentStudent', JSON.stringify(student));
    } else {
      localStorage.removeItem('currentStudent');
    }
  }

  /**
   * Récupérer l'étudiant depuis le localStorage
   */
  loadCurrentStudent(): Student | null {
    const stored = localStorage.getItem('currentStudent');
    if (stored) {
      const student = JSON.parse(stored);
      this.currentStudentSubject.next(student);
      return student;
    }
    return null;
  }

  /**
   * Vérifier si un étudiant est connecté
   */
  isLoggedIn(): boolean {
    return this.currentStudentSubject.value !== null;
  }

  /**
   * Calculer le pourcentage de complétion du profil
   */
  calculateProfileCompleteness(student: Student): number {
    return student.status.profileCompleteness || 0;
  }

  /**
   * Générer des spécialisations disponibles
   */
  getAvailableSpecializations(): Array<{value: string, label: string}> {
    return [
      { value: 'computer-science', label: 'Informatique' },
      { value: 'electronics', label: 'Électronique' },
      { value: 'robotics', label: 'Robotique' },
      { value: 'iot', label: 'Internet des Objets (IoT)' },
      { value: 'cybersecurity', label: 'Cybersécurité' },
      { value: 'data-science', label: 'Science des Données' },
      { value: 'mechanical-engineering', label: 'Génie Mécanique' },
      { value: 'general', label: 'Formation Générale' }
    ];
  }

  /**
   * Générer des promotions disponibles
   */
  getAvailablePromotions(): string[] {
    const currentYear = new Date().getFullYear();
    const promotions: string[] = [];
    
    // Générer les promotions pour les 3 années autour de l'année actuelle
    for (let i = -1; i <= 2; i++) {
      const startYear = currentYear + i;
      const endYear = startYear + 1;
      promotions.push(`${startYear}-${endYear}`);
    }
    
    return promotions;
  }

  /**
   * Valider les données de création de profil
   */
  validateProfileData(data: CreateStudentDto): string[] {
    const errors: string[] = [];
    
    if (!data.firstName || data.firstName.trim().length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    }
    
    if (!data.lastName || data.lastName.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }
    
    if (!data.email || !data.email.includes('@')) {
      errors.push('Adresse email invalide');
    }
    
    if (!data.studentId || data.studentId.trim().length < 3) {
      errors.push('Numéro étudiant requis (minimum 3 caractères)');
    }
    
    if (!data.promotion) {
      errors.push('Promotion requise');
    }
    
    if (!data.specialization) {
      errors.push('Spécialisation requise');
    }
    
    return errors;
  }

  /**
   * Formatter le nom complet
   */
  formatFullName(firstName: string, lastName: string): string {
    return `${firstName} ${lastName}`;
  }

  /**
   * Obtenir le libellé d'une spécialisation
   */
  getSpecializationLabel(value: string): string {
    const specializations = this.getAvailableSpecializations();
    const found = specializations.find(s => s.value === value);
    return found ? found.label : value;
  }
}