import { 
  Student, 
  CreateStudentDto, 
  StudentSelfAssessmentDto,
  StudentSpecialization,
  PreferredRole,
  WorkingStyle,
  ExperienceLevel,
  ProgrammingLanguage
} from '../interfaces/student.interface';

/**
 * Service de validation partagé pour les étudiants
 * Utilisable côté NestJS et Angular
 */
export class StudentValidationService {

  /**
   * Valide les données de création d'étudiant
   */
  static validateCreateStudent(dto: CreateStudentDto): ValidationResult {
    const errors: string[] = [];

    // Validation prénom
    if (!dto.firstName || dto.firstName.trim().length < 2) {
      errors.push('Le prénom doit contenir au moins 2 caractères');
    }

    // Validation nom
    if (!dto.lastName || dto.lastName.trim().length < 2) {
      errors.push('Le nom doit contenir au moins 2 caractères');
    }

    // Validation email
    if (!dto.email || !this.isValidEmail(dto.email)) {
      errors.push('L\'adresse email n\'est pas valide');
    }

    // Validation numéro étudiant
    if (!dto.studentId || !this.isValidStudentId(dto.studentId)) {
      errors.push('Le numéro étudiant n\'est pas valide (format attendu: lettres + chiffres)');
    }

    // Validation promotion
    if (!dto.promotion || !this.isValidPromotion(dto.promotion)) {
      errors.push('La promotion doit être au format YYYY-YYYY (ex: 2025-2026)');
    }

    // Validation spécialisation
    if (!dto.specialization || !this.isValidSpecialization(dto.specialization)) {
      errors.push('La spécialisation n\'est pas valide');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide l'auto-évaluation d'un étudiant
   */
  static validateSelfAssessment(dto: StudentSelfAssessmentDto): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation compétences techniques
    if (dto.technical) {
      if (dto.technical.programming) {
        const progErrors = this.validateProgrammingSkills(dto.technical.programming);
        errors.push(...progErrors.errors);
        warnings.push(...(progErrors.warnings || []));
      }

      // Validation niveaux techniques (1-5)
      const technicalFields = ['electronics', 'mechanics', 'iot', 'networking'];
      technicalFields.forEach(field => {
        const level = (dto.technical as any)?.[field];
        if (level !== undefined && (level < 1 || level > 5)) {
          errors.push(`${field}: Le niveau doit être entre 1 et 5`);
        }
      });
    }

    // Validation compétences soft
    if (dto.soft) {
      const softFields = ['teamwork', 'leadership', 'communication', 'problemSolving', 'creativity', 'adaptability'];
      softFields.forEach(field => {
        const level = (dto.soft as any)?.[field];
        if (level !== undefined && (level < 1 || level > 5)) {
          errors.push(`${field}: Le niveau doit être entre 1 et 5`);
        }
      });

      // Vérifications de cohérence
      if (dto.soft.leadership && dto.soft.leadership > 4 && dto.soft.teamwork && dto.soft.teamwork < 3) {
        warnings.push('Un fort leadership nécessite généralement de bonnes compétences de travail en équipe');
      }
    }

    // Validation préférences
    if (dto.preferences) {
      if (dto.preferences.preferredRoles) {
        const invalidRoles = dto.preferences.preferredRoles.filter(role => 
          !this.isValidPreferredRole(role)
        );
        if (invalidRoles.length > 0) {
          errors.push(`Rôles invalides: ${invalidRoles.join(', ')}`);
        }
      }

      if (dto.preferences.workingStyle && !this.isValidWorkingStyle(dto.preferences.workingStyle)) {
        errors.push('Style de travail invalide');
      }
    }

    // Validation intérêts
    if (dto.interests && dto.interests.length > 10) {
      warnings.push('Plus de 10 centres d\'intérêt peuvent diluer votre profil');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Valide les compétences de programmation
   */
  static validateProgrammingSkills(programming: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validation niveau global
    if (programming.overallLevel !== undefined) {
      if (programming.overallLevel < 1 || programming.overallLevel > 5) {
        errors.push('Le niveau global de programmation doit être entre 1 et 5');
      }
    }

    // Validation langages
    if (programming.languages && Array.isArray(programming.languages)) {
      programming.languages.forEach((lang: ProgrammingLanguage, index: number) => {
        if (!lang.name || lang.name.trim().length === 0) {
          errors.push(`Langage ${index + 1}: Le nom du langage est requis`);
        }
        if (lang.level < 1 || lang.level > 5) {
          errors.push(`Langage ${index + 1}: Le niveau doit être entre 1 et 5`);
        }
        if (lang.yearsOfExperience < 0 || lang.yearsOfExperience > 20) {
          errors.push(`Langage ${index + 1}: L'expérience doit être entre 0 et 20 ans`);
        }

        // Cohérence niveau/expérience
        if (lang.level >= 4 && lang.yearsOfExperience < 2) {
          warnings.push(`Langage ${lang.name}: Un niveau avancé nécessite généralement plus d'expérience`);
        }
      });

      // Vérification des doublons
      const languageNames = programming.languages.map((l: ProgrammingLanguage) => l.name.toLowerCase());
      const duplicates = languageNames.filter((name: string, index: number) => languageNames.indexOf(name) !== index);
      if (duplicates.length > 0) {
        errors.push('Des langages sont dupliqués dans la liste');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Analyse la cohérence du profil étudiant
   */
  static analyzeProfileConsistency(student: Student): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Cohérence spécialisation/compétences
    const specialization = student.specialization;
    const technical = student.skills.technical;

    switch (specialization) {
      case 'computer-science':
        if (technical.programming.overallLevel < 3) {
          warnings.push('Un étudiant en informatique devrait avoir un niveau de programmation plus élevé');
        }
        break;
      case 'electronics':
        if (technical.electronics < 3) {
          warnings.push('Un étudiant en électronique devrait avoir des compétences électroniques plus développées');
        }
        break;
      case 'robotics':
        if (technical.mechanics < 2 || technical.electronics < 2) {
          warnings.push('Un étudiant en robotique devrait avoir des bases en mécanique et électronique');
        }
        break;
    }

    // Cohérence rôles préférés/compétences
    student.preferences.preferredRoles.forEach(role => {
      const compatibility = this.checkRoleCompatibility(role, student);
      if (compatibility < 50) {
        warnings.push(`Le rôle "${role}" ne semble pas correspondre à vos compétences actuelles`);
      }
    });

    // Cohérence niveau d'expérience
    const avgTechnical = (
      technical.programming.overallLevel +
      technical.electronics +
      technical.mechanics +
      technical.iot +
      technical.networking
    ) / 5;

    const experienceMapping = {
      'beginner': { min: 1, max: 2.5 },
      'intermediate': { min: 2, max: 4 },
      'advanced': { min: 3.5, max: 5 },
      'expert': { min: 4.5, max: 5 }
    };

    const expectedRange = experienceMapping[student.skills.experience];
    if (avgTechnical < expectedRange.min || avgTechnical > expectedRange.max) {
      warnings.push('Votre niveau d\'expérience déclaré ne correspond pas à vos compétences techniques');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Génère des recommandations pour améliorer le profil
   */
  static generateProfileRecommendations(student: Student): ProfileRecommendation[] {
    const recommendations: ProfileRecommendation[] = [];

    // Complétion du profil
    if (student.status.profileCompleteness < 100) {
      recommendations.push({
        type: 'profile-completion',
        priority: 'high',
        title: 'Compléter votre profil',
        description: `Votre profil n'est complété qu'à ${student.status.profileCompleteness}%`,
        action: 'Remplir les sections manquantes pour améliorer vos chances d\'être sélectionné'
      });
    }

    // Compétences techniques faibles
    const technical = student.skills.technical;
    if (technical.programming.overallLevel < 2 && student.specialization === 'computer-science') {
      recommendations.push({
        type: 'skill-improvement',
        priority: 'high',
        title: 'Améliorer vos compétences de programmation',
        description: 'Vos compétences de programmation sont faibles pour votre spécialisation',
        action: 'Suivre des cours en ligne ou participer à des projets de programmation'
      });
    }

    // Manque de diversité dans les compétences
    const nonZeroSkills = [
      technical.programming.overallLevel,
      technical.electronics,
      technical.mechanics,
      technical.iot,
      technical.networking
    ].filter(skill => skill > 2).length;

    if (nonZeroSkills < 2) {
      recommendations.push({
        type: 'skill-diversity',
        priority: 'medium',
        title: 'Diversifier vos compétences',
        description: 'Avoir des compétences dans plusieurs domaines vous rendra plus attractif pour les équipes',
        action: 'Explorer d\'autres domaines techniques complémentaires à votre spécialisation'
      });
    }

    // Compétences soft faibles
    const softSkills = student.skills.soft;
    const avgSoft = Object.values(softSkills).reduce((sum, val) => sum + val, 0) / Object.keys(softSkills).length;
    
    if (avgSoft < 3) {
      recommendations.push({
        type: 'soft-skills',
        priority: 'medium',
        title: 'Développer vos compétences relationnelles',
        description: 'Les compétences soft sont essentielles pour le travail en équipe',
        action: 'Participer à des activités de groupe ou des projets collaboratifs'
      });
    }

    return recommendations;
  }

  /**
   * Vérifie la compatibilité avec un rôle
   */
  private static checkRoleCompatibility(role: PreferredRole, student: Student): number {
    // Implémentation simplifiée - à développer selon les besoins
    const technical = student.skills.technical;
    const soft = student.skills.soft;

    switch (role) {
      case 'backend-developer':
        return (technical.programming.overallLevel * 0.6 + soft.problemSolving * 0.4) * 20;
      case 'frontend-developer':
        return (technical.programming.overallLevel * 0.5 + soft.creativity * 0.3 + soft.communication * 0.2) * 20;
      case 'electronics-engineer':
        return (technical.electronics * 0.7 + soft.problemSolving * 0.3) * 20;
      default:
        return 50; // Neutre
    }
  }

  /**
   * Utilitaires de validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidStudentId(studentId: string): boolean {
    // Format flexible pour différents établissements
    const studentIdRegex = /^[A-Za-z0-9]{4,20}$/;
    return studentIdRegex.test(studentId);
  }

  private static isValidPromotion(promotion: string): boolean {
    const promotionRegex = /^\d{4}-\d{4}$/;
    if (!promotionRegex.test(promotion)) return false;
    
    const [startYear, endYear] = promotion.split('-').map(Number);
    return endYear === startYear + 1 && startYear >= 2020 && startYear <= 2030;
  }

  private static isValidSpecialization(specialization: string): specialization is StudentSpecialization {
    const validSpecs: StudentSpecialization[] = [
      'computer-science', 'electronics', 'robotics', 'iot', 'cybersecurity', 
      'data-science', 'mechanical-engineering', 'general'
    ];
    return validSpecs.includes(specialization as StudentSpecialization);
  }

  private static isValidPreferredRole(role: string): role is PreferredRole {
    const validRoles: PreferredRole[] = [
      'captain', 'lead-developer', 'backend-developer', 'frontend-developer',
      'electronics-engineer', 'mechanical-engineer', 'designer', 'tester',
      'documentation', 'project-manager'
    ];
    return validRoles.includes(role as PreferredRole);
  }

  private static isValidWorkingStyle(style: string): style is WorkingStyle {
    const validStyles: WorkingStyle[] = [
      'methodical', 'creative', 'fast-paced', 'analytical', 'collaborative', 'independent'
    ];
    return validStyles.includes(style as WorkingStyle);
  }
}

// Types pour les résultats de validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ProfileRecommendation {
  type: 'profile-completion' | 'skill-improvement' | 'skill-diversity' | 'soft-skills' | 'experience-mismatch';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
}