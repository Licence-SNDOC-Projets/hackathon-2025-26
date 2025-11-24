/**
 * Types pour le challenge de formation d'équipes
 */

import { PlayerProfile } from './player-profile-types';

/**
 * Représente une équipe
 */
export interface TeamInfo {
  id: string;
  name: string;
  members: TeamMember[];
  createdAt: Date;
  updatedAt: Date;
  isComplete: boolean;
  maxMembers?: number;
}

/**
 * Membre d'une équipe avec son profil
 */
export interface TeamMember {
  userId: string;
  email: string;
  name: string;
  profile: PlayerProfile;
  joinedAt: Date;
  isCaptain: boolean;
}

/**
 * Profil agrégé d'une équipe
 */
export interface TeamProfile {
  teamId: string;
  teamName: string;
  averageSkills: {
    development: number;
    electronics: number;
    iot: number;
    mechanics: number;
  };
  totalMembers: number;
  roleDistribution: Record<string, number>;
  energyLevel: number;
  strengths: string[];
  weaknesses: string[];
}

/**
 * Utilisateur dans le backlog (sans équipe)
 */
export interface BacklogPlayer {
  userId: string;
  email: string;
  name: string;
  profile: PlayerProfile;
  addedAt: Date;
}

/**
 * Valide un nom d'équipe
 */
export function validateTeamName(name: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!name || name.trim().length === 0) {
    errors.push('Le nom de l\'équipe est requis');
  }

  if (name.length < 3) {
    errors.push('Le nom doit contenir au moins 3 caractères');
  }

  if (name.length > 50) {
    errors.push('Le nom ne peut pas dépasser 50 caractères');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Calcule le profil agrégé d'une équipe
 */
export function calculateTeamProfile(team: TeamInfo): TeamProfile {
  if (team.members.length === 0) {
    return {
      teamId: team.id,
      teamName: team.name,
      averageSkills: { development: 0, electronics: 0, iot: 0, mechanics: 0 },
      totalMembers: 0,
      roleDistribution: {},
      energyLevel: 0,
      strengths: [],
      weaknesses: []
    };
  }

  // Calculer les moyennes des compétences
  const skillsSums = team.members.reduce((acc, member) => ({
    development: acc.development + member.profile.skills.development,
    electronics: acc.electronics + member.profile.skills.electronics,
    iot: acc.iot + member.profile.skills.iot,
    mechanics: acc.mechanics + member.profile.skills.mechanics
  }), { development: 0, electronics: 0, iot: 0, mechanics: 0 });

  const averageSkills = {
    development: skillsSums.development / team.members.length,
    electronics: skillsSums.electronics / team.members.length,
    iot: skillsSums.iot / team.members.length,
    mechanics: skillsSums.mechanics / team.members.length
  };

  // Distribution des rôles
  const roleDistribution: Record<string, number> = {};
  team.members.forEach(member => {
    const role = member.profile.preferredRole;
    roleDistribution[role] = (roleDistribution[role] || 0) + 1;
  });

  // Niveau d'énergie moyen
  const energyLevel = team.members.reduce((sum, m) =>
    sum + m.profile.motivation.energyLevel, 0) / team.members.length;

  // Identifier les forces et faiblesses
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (averageSkills.development >= 3.5) strengths.push('💻 Développement');
  else if (averageSkills.development < 2.5) weaknesses.push('💻 Développement');

  if (averageSkills.electronics >= 3.5) strengths.push('⚡ Électronique');
  else if (averageSkills.electronics < 2.5) weaknesses.push('⚡ Électronique');

  if (averageSkills.iot >= 3.5) strengths.push('📡 IoT/MQTT');
  else if (averageSkills.iot < 2.5) weaknesses.push('📡 IoT/MQTT');

  if (averageSkills.mechanics >= 3.5) strengths.push('🔧 Mécanique');
  else if (averageSkills.mechanics < 2.5) weaknesses.push('🔧 Mécanique');

  if (energyLevel >= 4) strengths.push('🔋 Énergie élevée');

  return {
    teamId: team.id,
    teamName: team.name,
    averageSkills,
    totalMembers: team.members.length,
    roleDistribution,
    energyLevel,
    strengths,
    weaknesses
  };
}
