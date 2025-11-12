import { Team, TeamMember, CreateTeamDto, CreateTeamMemberDto, TeamRole, SkillCategory } from '../interfaces/team.interface';

/**
 * Service de validation partagé pour les équipes
 * Utilisable côté NestJS (avec decorators) et Angular
 */
export class TeamValidationService {
  
  /**
   * Valide les données d'création d'équipe
   */
  static validateCreateTeam(dto: CreateTeamDto): ValidationResult {
    const errors: string[] = [];

    // Validation nom d'équipe
    if (!dto.name || dto.name.trim().length < 2) {
      errors.push('Le nom d\'équipe doit contenir au moins 2 caractères');
    }

    if (dto.name && dto.name.length > 20) {
      errors.push('Le nom d\'équipe ne peut pas dépasser 20 caractères');
    }

    // Validation nom d'affichage
    if (!dto.displayName || dto.displayName.trim().length < 2) {
      errors.push('Le nom d\'affichage doit contenir au moins 2 caractères');
    }

    // Validation couleur
    if (!dto.color || !this.isValidHexColor(dto.color)) {
      errors.push('La couleur doit être au format hexadécimal valide (#RRGGBB)');
    }

    // Validation membres
    if (!dto.members || dto.members.length === 0) {
      errors.push('Une équipe doit avoir au moins 1 membre');
    }

    if (dto.members && dto.members.length > 4) {
      errors.push('Une équipe ne peut pas avoir plus de 4 membres');
    }

    // Validation des membres individuels
    if (dto.members) {
      dto.members.forEach((member, index) => {
        const memberErrors = this.validateCreateTeamMember(member, `Membre ${index + 1}`);
        errors.push(...memberErrors.errors);
      });

      // Vérification unicité des emails
      const emails = dto.members.map(m => m.email.toLowerCase());
      const duplicateEmails = emails.filter((email, index) => emails.indexOf(email) !== index);
      if (duplicateEmails.length > 0) {
        errors.push('Chaque membre doit avoir une adresse email unique');
      }

      // Vérification qu'il y a au moins un capitaine
      const captains = dto.members.filter(m => m.role === 'captain');
      if (captains.length === 0) {
        errors.push('Une équipe doit avoir au moins un capitaine');
      }
      if (captains.length > 1) {
        errors.push('Une équipe ne peut avoir qu\'un seul capitaine');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide un membre d'équipe
   */
  static validateCreateTeamMember(dto: CreateTeamMemberDto, context = 'Membre'): ValidationResult {
    const errors: string[] = [];

    // Validation prénom
    if (!dto.firstName || dto.firstName.trim().length < 2) {
      errors.push(`${context}: Le prénom doit contenir au moins 2 caractères`);
    }

    // Validation nom
    if (!dto.lastName || dto.lastName.trim().length < 2) {
      errors.push(`${context}: Le nom doit contenir au moins 2 caractères`);
    }

    // Validation email
    if (!dto.email || !this.isValidEmail(dto.email)) {
      errors.push(`${context}: L'adresse email n'est pas valide`);
    }

    // Validation rôle
    if (!dto.role || !this.isValidTeamRole(dto.role)) {
      errors.push(`${context}: Le rôle doit être l'un de: captain, developer, electronics, designer, tester`);
    }

    // Validation compétences
    if (!dto.skills || dto.skills.length === 0) {
      errors.push(`${context}: Au moins une compétence doit être définie`);
    }

    if (dto.skills) {
      dto.skills.forEach((skill, skillIndex) => {
        if (!this.isValidSkillCategory(skill.category)) {
          errors.push(`${context}: Compétence ${skillIndex + 1} - Catégorie invalide`);
        }
        if (skill.level < 1 || skill.level > 5) {
          errors.push(`${context}: Compétence ${skillIndex + 1} - Le niveau doit être entre 1 et 5`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Valide l'équilibre des compétences d'une équipe
   */
  static validateTeamBalance(team: Team): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Vérifier qu'il y a au moins 2 compétences techniques
    const technicalSkills = ['programming', 'electronics', 'mechanics'];
    const teamTechnicalSkills = new Set();
    
    team.members.forEach(member => {
      member.skills.forEach(skill => {
        if (technicalSkills.includes(skill.category) && skill.level >= 3) {
          teamTechnicalSkills.add(skill.category);
        }
      });
    });

    if (teamTechnicalSkills.size < 2) {
      errors.push('L\'équipe doit avoir au moins 2 compétences techniques de niveau 3+');
    }

    // Recommandations d'équilibre
    if (!teamTechnicalSkills.has('programming')) {
      warnings.push('Il est recommandé d\'avoir au moins un programmeur expérimenté');
    }

    if (!teamTechnicalSkills.has('electronics')) {
      warnings.push('Il est recommandé d\'avoir au moins un électronicien expérimenté');
    }

    // Vérifier la diversité des rôles
    const roles = team.members.map(m => m.role);
    const uniqueRoles = new Set(roles);
    if (uniqueRoles.size === 1) {
      warnings.push('Une diversité de rôles dans l\'équipe est recommandée');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Génère des suggestions d'amélioration pour une équipe
   */
  static generateTeamSuggestions(team: Team): TeamSuggestion[] {
    const suggestions: TeamSuggestion[] = [];

    // Analyser les lacunes en compétences
    const skillGaps = this.analyzeSkillGaps(team);
    skillGaps.forEach(gap => {
      suggestions.push({
        type: 'skill-gap',
        priority: 'medium',
        title: `Compétence manquante: ${gap}`,
        description: `L'équipe pourrait bénéficier d'un membre avec des compétences en ${gap}`,
        action: `Chercher un membre avec des compétences en ${gap}`
      });
    });

    // Vérifier l'équilibre des niveaux
    const levelBalance = this.analyzeLevelBalance(team);
    if (levelBalance.hasOnlyBeginners) {
      suggestions.push({
        type: 'level-balance',
        priority: 'high',
        title: 'Équipe de débutants',
        description: 'L\'équipe est composée principalement de débutants',
        action: 'Considérer l\'ajout d\'un membre plus expérimenté ou demander un mentoring'
      });
    }

    if (levelBalance.hasOnlyExperts) {
      suggestions.push({
        type: 'level-balance',
        priority: 'low',
        title: 'Équipe d\'experts',
        description: 'L\'équipe est très expérimentée',
        action: 'Excellente composition ! Considérer un rôle de mentor pour d\'autres équipes'
      });
    }

    return suggestions;
  }

  /**
   * Analyse les lacunes en compétences
   */
  private static analyzeSkillGaps(team: Team): string[] {
    const requiredSkills: SkillCategory[] = ['programming', 'electronics', 'iot-mqtt'];
    const recommendedSkills: SkillCategory[] = ['mechanics', 'problem-solving'];
    
    const teamSkills = new Set<string>();
    team.members.forEach(member => {
      member.skills.forEach(skill => {
        if (skill.level >= 2) { // Niveau minimum pour considérer la compétence
          teamSkills.add(skill.category);
        }
      });
    });

    const gaps: string[] = [];
    
    // Vérifier les compétences requises
    requiredSkills.forEach(skill => {
      if (!teamSkills.has(skill)) {
        gaps.push(skill);
      }
    });

    // Vérifier les compétences recommandées
    recommendedSkills.forEach(skill => {
      if (!teamSkills.has(skill)) {
        gaps.push(skill + ' (recommandée)');
      }
    });

    return gaps;
  }

  /**
   * Analyse l'équilibre des niveaux dans l'équipe
   */
  private static analyzeLevelBalance(team: Team): LevelBalance {
    const allLevels = team.members.flatMap(member => 
      member.skills.map(skill => skill.level)
    );

    const avgLevel = allLevels.reduce((a, b) => a + b, 0) / allLevels.length;
    const hasOnlyBeginners = avgLevel < 2.5;
    const hasOnlyExperts = avgLevel > 4.0;

    return {
      averageLevel: avgLevel,
      hasOnlyBeginners,
      hasOnlyExperts
    };
  }

  /**
   * Utilitaires de validation
   */
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidHexColor(color: string): boolean {
    const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    return hexRegex.test(color);
  }

  private static isValidTeamRole(role: string): role is TeamRole {
    const validRoles: TeamRole[] = ['captain', 'developer', 'electronics', 'designer', 'tester'];
    return validRoles.includes(role as TeamRole);
  }

  private static isValidSkillCategory(category: string): category is SkillCategory {
    const validCategories: SkillCategory[] = [
      'programming', 'electronics', 'mechanics', 'iot-mqtt', 'teamwork', 'problem-solving'
    ];
    return validCategories.includes(category as SkillCategory);
  }
}

// Types pour les résultats de validation
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface TeamSuggestion {
  type: 'skill-gap' | 'level-balance' | 'role-diversity' | 'general';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: string;
}

interface LevelBalance {
  averageLevel: number;
  hasOnlyBeginners: boolean;
  hasOnlyExperts: boolean;
}