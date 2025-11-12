/**
 * Interfaces communes pour la gestion des équipes
 * Utilisables côté NestJS et Angular
 */

export interface Team {
  id: string;
  name: string;
  displayName: string;
  color: string;
  members: TeamMember[];
  status: TeamStatus;
  robotConfig: RobotConfig;
  currentChallenge?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string;
  role: TeamRole;
  skills: SkillLevel[];
  isActive: boolean;
  joinedAt: Date;
}

export interface TeamStatus {
  connection: 'online' | 'offline' | 'unknown';
  batteryLevel: number; // 0-100
  lastSeen: Date;
  currentActivity: string;
  location?: string;
}

export interface RobotConfig {
  speed: number;           // 0-100%
  pidKp: number;           // Paramètre PID proportionnel
  pidKi: number;           // Paramètre PID intégral
  pidKd: number;           // Paramètre PID dérivé
  sensorSensitivity: number; // Sensibilité capteurs
  customSettings: Record<string, any>;
  firmware?: {
    version: string;
    lastUpdate: Date;
  };
}

export interface SkillLevel {
  category: SkillCategory;
  level: number; // 1-5
  description?: string;
}

export type TeamRole = 'captain' | 'developer' | 'electronics' | 'designer' | 'tester';

export type SkillCategory = 
  | 'programming'
  | 'electronics' 
  | 'mechanics'
  | 'iot-mqtt'
  | 'teamwork'
  | 'problem-solving';

// Types pour les formulaires et validation
export interface CreateTeamDto {
  name: string;
  displayName: string;
  color: string;
  members: CreateTeamMemberDto[];
}

export interface CreateTeamMemberDto {
  firstName: string;
  lastName: string;
  email: string;
  role: TeamRole;
  skills: SkillLevel[];
}

export interface UpdateTeamConfigDto {
  speed?: number;
  pidKp?: number;
  pidKi?: number;
  pidKd?: number;
  sensorSensitivity?: number;
  customSettings?: Record<string, any>;
}