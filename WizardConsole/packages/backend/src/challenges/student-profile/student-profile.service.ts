import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { MqttService } from '../../mqtt/mqtt.service';
// Import temporaire des types - à remplacer par la librairie partagée une fois buildée
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  studentId: string;
  promotion: string;
  specialization: string;
  skills: any;
  preferences: any;
  status: {
    isActive: boolean;
    lastLoginDate: Date;
    currentActivity: string;
    profileCompleteness: number;
  };
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateStudentDto {
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  promotion: string;
  specialization: string;
}

interface StudentSelfAssessmentDto {
  technical?: any;
  soft?: any;
  preferences?: any;
  interests?: string[];
}

// Service de validation simplifié
class StudentValidationService {
  static validateCreateStudent(dto: CreateStudentDto) {
    const errors: string[] = [];
    if (!dto.firstName || dto.firstName.length < 2) errors.push('Prénom requis');
    if (!dto.lastName || dto.lastName.length < 2) errors.push('Nom requis');
    if (!dto.email || !dto.email.includes('@')) errors.push('Email invalide');
    if (!dto.studentId || dto.studentId.length < 3) errors.push('Numéro étudiant requis');
    
    return { isValid: errors.length === 0, errors };
  }

  static validateSelfAssessment(dto: StudentSelfAssessmentDto) {
    const errors: string[] = [];
    const warnings: string[] = [];
    // Validation basique
    return { isValid: true, errors, warnings };
  }
}

// Modèle simplifié
class StudentModel {
  constructor(private data: Student) {}
  
  toPlayerCard(): string {
    return `🎮 ${this.data.displayName} - ${this.data.specialization}`;
  }
}

@Injectable()
export class StudentProfileService {
  private students = new Map<string, Student>();
  private completedQuestionnaires = new Set<string>(); // Set des IDs qui ont terminé

  constructor(private mqttService: MqttService) {
    console.log('🎓 StudentProfileService initialisé');
  }

  /**
   * Créer un nouveau profil étudiant
   */
  async createProfile(createDto: CreateStudentDto): Promise<Student> {
    console.log('📝 Création profil étudiant:', createDto.email);

    // Validation des données
    const validation = StudentValidationService.validateCreateStudent(createDto);
    if (!validation.isValid) {
      throw new ConflictException({
        message: 'Données invalides',
        errors: validation.errors
      });
    }

    // Vérifier si l'étudiant existe déjà
    const existingStudent = Array.from(this.students.values())
      .find(s => s.email === createDto.email || s.studentId === createDto.studentId);
    
    if (existingStudent) {
      throw new ConflictException('Un étudiant avec cet email ou numéro étudiant existe déjà');
    }

    // Créer le profil
    const studentData = {
      id: this.generateStudentId(),
      ...createDto,
      displayName: `${createDto.firstName} ${createDto.lastName}`,
      skills: this.createDefaultSkillProfile(),
      preferences: this.createDefaultPreferences(),
      status: {
        isActive: true,
        lastLoginDate: new Date(),
        currentActivity: 'Profil créé - En attente du questionnaire',
        profileCompleteness: 25 // Base: 25% pour les infos de base
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const student: Student = studentData;
    this.students.set(student.id, student);

    // Publier sur MQTT pour notifier la création
    await this.publishStudentStatus(student, 'profile-created');

    return student;
  }

  /**
   * Compléter le questionnaire d'auto-évaluation
   */
  async completeQuestionnaire(
    studentId: string, 
    assessmentDto: StudentSelfAssessmentDto
  ): Promise<Student> {
    console.log('📋 Questionnaire pour étudiant:', studentId);

    const student = this.students.get(studentId);
    if (!student) {
      throw new NotFoundException('Étudiant introuvable');
    }

    // Vérifier si le questionnaire n'a pas déjà été complété
    if (this.completedQuestionnaires.has(studentId)) {
      throw new ConflictException('Le questionnaire a déjà été complété pour cet étudiant');
    }

    // Validation de l'auto-évaluation
    const validation = StudentValidationService.validateSelfAssessment(assessmentDto);
    if (!validation.isValid) {
      throw new ConflictException({
        message: 'Auto-évaluation invalide',
        errors: validation.errors,
        warnings: validation.warnings
      });
    }

    // Mettre à jour le profil avec les données du questionnaire
    const updatedStudent = this.updateStudentFromAssessment(student, assessmentDto);
    
    // Marquer le questionnaire comme terminé
    this.completedQuestionnaires.add(studentId);
    
    // Calculer le nouveau pourcentage de complétion
    updatedStudent.status.profileCompleteness = this.calculateProfileCompleteness(updatedStudent);
    updatedStudent.status.currentActivity = 'Questionnaire terminé - Prêt pour l\'affectation';
    updatedStudent.updatedAt = new Date();

    this.students.set(studentId, updatedStudent);

    // Publier sur MQTT
    await this.publishStudentStatus(updatedStudent, 'questionnaire-completed');

    // Publier la fiche joueur générée
    const playerCard = new StudentModel(updatedStudent).toPlayerCard();
    await this.mqttService.publishEvent(
      `/students/${studentId}/player-card`, 
      playerCard
    );

    return updatedStudent;
  }

  /**
   * Obtenir le profil d'un étudiant
   */
  async getProfile(studentId: string): Promise<Student> {
    const student = this.students.get(studentId);
    if (!student) {
      throw new NotFoundException('Profil étudiant introuvable');
    }
    return student;
  }

  /**
   * Obtenir le profil par email
   */
  async getProfileByEmail(email: string): Promise<Student | null> {
    return Array.from(this.students.values())
      .find(s => s.email === email) || null;
  }

  /**
   * Vérifier si un étudiant a complété son questionnaire
   */
  hasCompletedQuestionnaire(studentId: string): boolean {
    return this.completedQuestionnaires.has(studentId);
  }

  /**
   * Lister tous les étudiants (pour l'arbitre)
   */
  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  /**
   * Obtenir les statistiques générales
   */
  async getStatistics() {
    const allStudents = Array.from(this.students.values());
    const totalStudents = allStudents.length;
    const completedQuestionnaires = this.completedQuestionnaires.size;
    
    const bySpecialization = allStudents.reduce((acc, student) => {
      acc[student.specialization] = (acc[student.specialization] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const avgCompleteness = totalStudents > 0 
      ? allStudents.reduce((sum, s) => sum + s.status.profileCompleteness, 0) / totalStudents
      : 0;

    return {
      totalStudents,
      completedQuestionnaires,
      pendingQuestionnaires: totalStudents - completedQuestionnaires,
      bySpecialization,
      averageProfileCompleteness: Math.round(avgCompleteness),
      readyForTeams: allStudents.filter(s => s.status.profileCompleteness >= 80).length
    };
  }

  /**
   * Méthodes privées
   */
  private generateStudentId(): string {
    return 'student_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private createDefaultSkillProfile() {
    return {
      technical: {
        programming: {
          languages: [] as any[],
          frameworks: [] as string[],
          databases: [] as string[],
          tools: [] as string[],
          overallLevel: 1
        },
        electronics: 1,
        mechanics: 1,
        iot: 1,
        networking: 1
      },
      soft: {
        teamwork: 3,
        leadership: 2,
        communication: 3,
        problemSolving: 3,
        creativity: 3,
        adaptability: 3
      },
      experience: 'beginner' as const,
      interests: [] as string[]
    };
  }

  private createDefaultPreferences() {
    return {
      preferredRoles: ['developer' as const],
      workingStyle: 'collaborative' as const,
      availability: {
        timezone: 'Europe/Paris',
        weekdays: [] as any[],
        weekend: false,
        totalHoursPerWeek: 10
      },
      teamSizePreference: 'medium' as const,
      challengePreferences: [] as string[],
      avoidances: [] as string[]
    };
  }

  private updateStudentFromAssessment(
    student: Student, 
    assessment: StudentSelfAssessmentDto
  ): Student {
    const updated = { ...student };

    // Mettre à jour les compétences techniques
    if (assessment.technical) {
      updated.skills.technical = {
        ...updated.skills.technical,
        ...assessment.technical
      };
    }

    // Mettre à jour les compétences soft
    if (assessment.soft) {
      updated.skills.soft = {
        ...updated.skills.soft,
        ...assessment.soft
      };
    }

    // Mettre à jour les préférences
    if (assessment.preferences) {
      updated.preferences = {
        ...updated.preferences,
        ...assessment.preferences
      };
    }

    // Mettre à jour les intérêts
    if (assessment.interests) {
      updated.skills.interests = assessment.interests;
    }

    return updated;
  }

  private calculateProfileCompleteness(student: Student): number {
    let completeness = 25; // Base pour les infos personnelles

    // Compétences techniques (+30%)
    const technical = student.skills.technical;
    if (technical.programming.languages.length > 0) completeness += 15;
    if (technical.programming.overallLevel > 1) completeness += 15;

    // Compétences soft (+20%)
    const softSkills = Object.values(student.skills.soft) as number[];
    const avgSoft = softSkills.reduce((a: number, b: number) => a + b, 0) / softSkills.length;
    if (avgSoft > 2.5) completeness += 20;

    // Préférences (+15%)
    if (student.preferences.preferredRoles.length > 0) completeness += 10;
    if (student.preferences.challengePreferences.length > 0) completeness += 5;

    // Intérêts (+10%)
    if (student.skills.interests.length > 0) completeness += 10;

    return Math.min(100, completeness);
  }

  private async publishStudentStatus(student: Student, eventType: string) {
    try {
      // Publier l'état général
      await this.mqttService.publishState(
        `/students/${student.id}/status`, 
        JSON.stringify({
          isActive: student.status.isActive,
          profileCompleteness: student.status.profileCompleteness,
          currentActivity: student.status.currentActivity,
          hasCompletedQuestionnaire: this.completedQuestionnaires.has(student.id),
          lastUpdate: student.updatedAt
        })
      );

      // Publier l'événement
      await this.mqttService.publishEvent(
        `/students/events/${eventType}`, 
        JSON.stringify({
          studentId: student.id,
          email: student.email,
          displayName: student.displayName,
          specialization: student.specialization,
          timestamp: new Date()
        })
      );

      console.log(`📡 MQTT publié pour ${student.displayName}: ${eventType}`);
    } catch (error) {
      console.error('❌ Erreur publication MQTT:', error);
    }
  }
}