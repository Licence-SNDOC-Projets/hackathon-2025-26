/**
 * Types partagés pour le Challenge Player Profile
 * Utilisés par le frontend, backend et le challenge lui-même
 */

/**
 * Rôles disponibles pour les joueurs
 */
export type PlayerRole = 'strategist' | 'developer' | 'electronician' | 'designer';

/**
 * Styles de travail disponibles
 */
export type WorkStyle = 'methodical' | 'creative' | 'fast' | 'analytical';

/**
 * Compétences techniques du joueur (notation de 1 à 5)
 */
export interface PlayerSkills {
  development: number;    // Développement (Python, C/C++, Arduino...)
  electronics: number;    // Électronique (circuits, capteurs, câblage...)
  iot: number;           // IoT/MQTT (communication, protocoles...)
  mechanics: number;     // Mécanique (conception, assemblage...)
}

/**
 * Motivation et style de travail du joueur
 */
export interface PlayerMotivation {
  energyLevel: number;         // Niveau d'énergie (1-5)
  workStyle: WorkStyle;        // Style de travail
  specialSkill: string;        // Atout spécial (texte libre)
  pastExperience: string;      // Expérience passée (texte libre)
}

/**
 * Profil complet d'un joueur
 */
export interface PlayerProfile {
  userId: string;
  email: string;
  name: string;
  skills: PlayerSkills;
  preferredRole: PlayerRole;
  motivation: PlayerMotivation;
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
}

/**
 * DTO pour la soumission d'un profil (depuis le frontend)
 */
export interface SubmitProfileDto {
  name: string;
  skills: PlayerSkills;
  preferredRole: PlayerRole;
  motivation: PlayerMotivation;
}

/**
 * Validation des niveaux de compétence (1-5)
 */
export function isValidSkillLevel(level: number): boolean {
  return typeof level === 'number' && level >= 1 && level <= 5 && Number.isInteger(level);
}

/**
 * Validation d'un rôle
 */
export function isValidRole(role: string): role is PlayerRole {
  const validRoles: PlayerRole[] = ['strategist', 'developer', 'electronician', 'designer'];
  return validRoles.includes(role as PlayerRole);
}

/**
 * Validation d'un style de travail
 */
export function isValidWorkStyle(style: string): style is WorkStyle {
  const validStyles: WorkStyle[] = ['methodical', 'creative', 'fast', 'analytical'];
  return validStyles.includes(style as WorkStyle);
}

/**
 * Résultat de validation
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valide les compétences d'un joueur
 */
export function validateSkills(skills: PlayerSkills): ValidationResult {
  const errors: string[] = [];

  if (!isValidSkillLevel(skills.development)) {
    errors.push('Niveau de développement invalide (1-5)');
  }
  if (!isValidSkillLevel(skills.electronics)) {
    errors.push('Niveau d\'électronique invalide (1-5)');
  }
  if (!isValidSkillLevel(skills.iot)) {
    errors.push('Niveau IoT/MQTT invalide (1-5)');
  }
  if (!isValidSkillLevel(skills.mechanics)) {
    errors.push('Niveau mécanique invalide (1-5)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valide la motivation d'un joueur
 */
export function validateMotivation(motivation: PlayerMotivation): ValidationResult {
  const errors: string[] = [];

  if (!isValidSkillLevel(motivation.energyLevel)) {
    errors.push('Niveau d\'énergie invalide (1-5)');
  }

  if (!isValidWorkStyle(motivation.workStyle)) {
    errors.push('Style de travail invalide');
  }

  if (!motivation.specialSkill || motivation.specialSkill.trim().length === 0) {
    errors.push('L\'atout spécial est obligatoire');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Valide un profil complet
 */
export function validateProfile(profile: Partial<PlayerProfile>): ValidationResult {
  const errors: string[] = [];

  // Nom obligatoire
  if (!profile.name || profile.name.trim().length === 0) {
    errors.push('Le nom est obligatoire');
  }

  // Compétences
  if (!profile.skills) {
    errors.push('Les compétences doivent être évaluées');
  } else {
    const skillsValidation = validateSkills(profile.skills);
    errors.push(...skillsValidation.errors);
  }

  // Rôle préféré
  if (!profile.preferredRole || !isValidRole(profile.preferredRole)) {
    errors.push('Rôle préféré invalide');
  }

  // Motivation
  if (!profile.motivation) {
    errors.push('Les informations de motivation sont obligatoires');
  } else {
    const motivationValidation = validateMotivation(profile.motivation);
    errors.push(...motivationValidation.errors);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
