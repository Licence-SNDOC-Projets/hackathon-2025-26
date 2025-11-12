import { 
  Student, 
  SkillProfile, 
  StudentPreferences, 
  StudentStatus, 
  TechnicalSkills,
  SoftSkills,
  ProgrammingLanguage,
  StudentSpecialization,
  PreferredRole,
  ExperienceLevel
} from '../interfaces/student.interface';

/**
 * Classe modèle pour l'étudiant avec méthodes utilitaires
 */
export class StudentModel implements Student {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  studentId: string;
  promotion: string;
  specialization: StudentSpecialization;
  skills: SkillProfile;
  preferences: StudentPreferences;
  status: StudentStatus;
  teamId?: string;
  createdAt: Date;
  updatedAt: Date;

  constructor(data: Partial<Student>) {
    this.id = data.id || '';
    this.firstName = data.firstName || '';
    this.lastName = data.lastName || '';
    this.displayName = data.displayName || `${data.firstName} ${data.lastName}`;
    this.email = data.email || '';
    this.studentId = data.studentId || '';
    this.promotion = data.promotion || '';
    this.specialization = data.specialization || 'general';
    this.skills = data.skills || this.createDefaultSkillProfile();
    this.preferences = data.preferences || this.createDefaultPreferences();
    this.status = data.status || this.createDefaultStatus();
    this.teamId = data.teamId;
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  /**
   * Obtient le nom complet de l'étudiant
   */
  getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  /**
   * Calcule le niveau technique global
   */
  getTechnicalLevel(): number {
    const technical = this.skills.technical;
    const levels = [
      technical.programming.overallLevel,
      technical.electronics,
      technical.mechanics,
      technical.iot,
      technical.networking
    ];
    return levels.reduce((sum, level) => sum + level, 0) / levels.length;
  }

  /**
   * Calcule le niveau de compétences soft global
   */
  getSoftSkillsLevel(): number {
    const soft = this.skills.soft;
    const levels = [
      soft.teamwork,
      soft.leadership,
      soft.communication,
      soft.problemSolving,
      soft.creativity,
      soft.adaptability
    ];
    return levels.reduce((sum, level) => sum + level, 0) / levels.length;
  }

  /**
   * Obtient la compétence technique dominante
   */
  getDominantTechnicalSkill(): string {
    const technical = this.skills.technical;
    const skillMap = {
      'Programmation': technical.programming.overallLevel,
      'Électronique': technical.electronics,
      'Mécanique': technical.mechanics,
      'IoT': technical.iot,
      'Réseaux': technical.networking
    };

    const maxSkill = Object.entries(skillMap).reduce((max, [skill, level]) =>
      level > max[1] ? [skill, level] : max, ['', 0]
    );

    return maxSkill[0];
  }

  /**
   * Obtient la compétence soft dominante
   */
  getDominantSoftSkill(): string {
    const soft = this.skills.soft;
    const skillMap = {
      'Travail d\'équipe': soft.teamwork,
      'Leadership': soft.leadership,
      'Communication': soft.communication,
      'Résolution de problèmes': soft.problemSolving,
      'Créativité': soft.creativity,
      'Adaptabilité': soft.adaptability
    };

    const maxSkill = Object.entries(skillMap).reduce((max, [skill, level]) =>
      level > max[1] ? [skill, level] : max, ['', 0]
    );

    return maxSkill[0];
  }

  /**
   * Vérifie si l'étudiant est disponible pour le travail d'équipe
   */
  isAvailableForTeamwork(): boolean {
    return this.status.isActive && 
           !this.teamId && 
           this.status.profileCompleteness >= 70;
  }

  /**
   * Calcule la compatibilité avec un rôle donné
   */
  getRoleCompatibility(role: PreferredRole): number {
    const roleWeights: Record<PreferredRole, Record<string, number>> = {
      'captain': {
        'leadership': 0.4,
        'communication': 0.3,
        'teamwork': 0.2,
        'problemSolving': 0.1
      },
      'lead-developer': {
        'programming': 0.4,
        'leadership': 0.3,
        'problemSolving': 0.2,
        'communication': 0.1
      },
      'backend-developer': {
        'programming': 0.6,
        'problemSolving': 0.2,
        'analytical': 0.2
      },
      'frontend-developer': {
        'programming': 0.5,
        'creativity': 0.3,
        'communication': 0.2
      },
      'electronics-engineer': {
        'electronics': 0.6,
        'problemSolving': 0.3,
        'mechanics': 0.1
      },
      'mechanical-engineer': {
        'mechanics': 0.6,
        'problemSolving': 0.3,
        'creativity': 0.1
      },
      'designer': {
        'creativity': 0.5,
        'communication': 0.3,
        'adaptability': 0.2
      },
      'tester': {
        'problemSolving': 0.4,
        'communication': 0.3,
        'teamwork': 0.3
      },
      'documentation': {
        'communication': 0.5,
        'teamwork': 0.3,
        'adaptability': 0.2
      },
      'project-manager': {
        'leadership': 0.4,
        'communication': 0.3,
        'teamwork': 0.2,
        'problemSolving': 0.1
      }
    };

    const weights = roleWeights[role] || {};
    let compatibility = 0;

    for (const [skill, weight] of Object.entries(weights)) {
      let skillLevel = 0;
      
      // Mapping des compétences
      switch (skill) {
        case 'programming':
          skillLevel = this.skills.technical.programming.overallLevel;
          break;
        case 'electronics':
          skillLevel = this.skills.technical.electronics;
          break;
        case 'mechanics':
          skillLevel = this.skills.technical.mechanics;
          break;
        case 'leadership':
          skillLevel = this.skills.soft.leadership;
          break;
        case 'communication':
          skillLevel = this.skills.soft.communication;
          break;
        case 'teamwork':
          skillLevel = this.skills.soft.teamwork;
          break;
        case 'problemSolving':
          skillLevel = this.skills.soft.problemSolving;
          break;
        case 'creativity':
          skillLevel = this.skills.soft.creativity;
          break;
        case 'adaptability':
          skillLevel = this.skills.soft.adaptability;
          break;
        case 'analytical':
          skillLevel = (this.skills.soft.problemSolving + this.getTechnicalLevel()) / 2;
          break;
      }

      compatibility += (skillLevel / 5) * weight;
    }

    return Math.round(compatibility * 100);
  }

  /**
   * Génère une fiche joueur style gaming
   */
  toPlayerCard(): string {
    const techLevel = Math.round(this.getTechnicalLevel());
    const softLevel = Math.round(this.getSoftSkillsLevel());
    const dominantTech = this.getDominantTechnicalSkill();
    const dominantSoft = this.getDominantSoftSkill();

    return `
╔══════════════════════════════════════╗
║ 🎮 ${this.displayName.padEnd(30)} ║
║ 🏫 ${this.specialization.toUpperCase().padEnd(32)} ║
╠══════════════════════════════════════╣
║ 💻 Tech:     ${'⭐'.repeat(techLevel)}${'☆'.repeat(5-techLevel)} (${techLevel}/5) ║
║ 🤝 Soft:     ${'⭐'.repeat(softLevel)}${'☆'.repeat(5-softLevel)} (${softLevel}/5) ║
║ 🔋 Niveau:   ${this.skills.experience.toUpperCase()} ║
╠══════════════════════════════════════╣
║ 🎯 FORCE TECH: ${dominantTech.padEnd(18)} ║
║ 💡 FORCE SOFT: ${dominantSoft.padEnd(18)} ║
║ 📧 ${this.email.padEnd(30)} ║
╚══════════════════════════════════════╝`;
  }

  /**
   * Obtient les langages de programmation maîtrisés
   */
  getMasteredLanguages(): ProgrammingLanguage[] {
    return this.skills.technical.programming.languages.filter(lang => lang.level >= 3);
  }

  /**
   * Calcule l'expérience totale en programmation
   */
  getTotalProgrammingExperience(): number {
    return this.skills.technical.programming.languages
      .reduce((total, lang) => total + lang.yearsOfExperience, 0);
  }

  /**
   * Vérifie si l'étudiant a de l'expérience dans un domaine
   */
  hasExperienceIn(domain: string): boolean {
    const interests = this.skills.interests.map(i => i.toLowerCase());
    const frameworks = this.skills.technical.programming.frameworks.map(f => f.toLowerCase());
    const languages = this.skills.technical.programming.languages.map(l => l.name.toLowerCase());
    
    const searchDomain = domain.toLowerCase();
    return interests.includes(searchDomain) || 
           frameworks.includes(searchDomain) || 
           languages.includes(searchDomain);
  }

  /**
   * Met à jour le statut d'activité
   */
  updateActivity(activity: string): void {
    this.status.currentActivity = activity;
    this.status.lastLoginDate = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Assigne à une équipe
   */
  assignToTeam(teamId: string): void {
    this.teamId = teamId;
    this.updateActivity('Assigné à une équipe');
  }

  /**
   * Retire de l'équipe
   */
  removeFromTeam(): void {
    this.teamId = undefined;
    this.updateActivity('Retiré de l\'équipe');
  }

  /**
   * Crée un profil de compétences par défaut
   */
  private createDefaultSkillProfile(): SkillProfile {
    return {
      technical: {
        programming: {
          languages: [],
          frameworks: [],
          databases: [],
          tools: [],
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
      experience: 'beginner',
      interests: []
    };
  }

  /**
   * Crée des préférences par défaut
   */
  private createDefaultPreferences(): StudentPreferences {
    return {
      preferredRoles: ['backend-developer'],
      workingStyle: 'collaborative',
      availability: {
        timezone: 'Europe/Paris',
        weekdays: [],
        weekend: false,
        totalHoursPerWeek: 10
      },
      teamSizePreference: 'medium',
      challengePreferences: [],
      avoidances: []
    };
  }

  /**
   * Crée un statut par défaut
   */
  private createDefaultStatus(): StudentStatus {
    return {
      isActive: true,
      lastLoginDate: new Date(),
      currentActivity: 'Nouveau profil',
      profileCompleteness: 20
    };
  }

  /**
   * Sérialise l'étudiant pour l'export
   */
  toExport(): Record<string, any> {
    return {
      id: this.id,
      fullName: this.getFullName(),
      email: this.email,
      studentId: this.studentId,
      promotion: this.promotion,
      specialization: this.specialization,
      technicalLevel: this.getTechnicalLevel(),
      softSkillsLevel: this.getSoftSkillsLevel(),
      dominantTechnicalSkill: this.getDominantTechnicalSkill(),
      dominantSoftSkill: this.getDominantSoftSkill(),
      teamId: this.teamId,
      isActive: this.status.isActive,
      profileCompleteness: this.status.profileCompleteness
    };
  }

  /**
   * Crée un étudiant depuis des données d'import
   */
  static fromImportData(data: any): StudentModel {
    return new StudentModel({
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      studentId: data.studentId,
      promotion: data.promotion,
      specialization: data.specialization || 'general'
    });
  }
}