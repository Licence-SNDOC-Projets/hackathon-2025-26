/**
 * Types utilitaires pour la gestion des étudiants
 */

import { 
  Student, 
  StudentSpecialization, 
  PreferredRole, 
  WorkingStyle, 
  ExperienceLevel,
  StudentStatus,
  SkillProfile
} from '../interfaces/student.interface';

// Types pour les événements temps réel
export interface StudentRealtimeEvent {
  type: StudentEventType;
  studentId: string;
  timestamp: Date;
  data: any;
}

export type StudentEventType = 
  | 'profile-updated'
  | 'skills-updated'
  | 'team-assigned'
  | 'team-removed'
  | 'status-changed'
  | 'login'
  | 'logout';

// Types pour les statistiques
export interface StudentStatistics {
  studentId: string;
  totalLogins: number;
  profileCompleteness: number;
  skillAssessmentDate: Date | null;
  teamParticipations: TeamParticipation[];
  challengesCompleted: number;
  averageTeamRating: number | null;
  lastActivityDate: Date;
}

export interface TeamParticipation {
  teamId: string;
  teamName: string;
  startDate: Date;
  endDate: Date | null;
  role: PreferredRole;
  rating: number | null; // Note de l'équipe
  feedback: string | null;
}

// Types pour les filtres et recherche
export interface StudentFilter {
  specializations?: StudentSpecialization[];
  experienceLevels?: ExperienceLevel[];
  preferredRoles?: PreferredRole[];
  workingStyles?: WorkingStyle[];
  promotions?: string[];
  skillLevels?: {
    programming?: { min: number; max: number };
    electronics?: { min: number; max: number };
    soft?: { min: number; max: number };
  };
  availability?: {
    isAvailable?: boolean;
    hasTeam?: boolean;
  };
  profileCompleteness?: {
    min: number;
    max: number;
  };
}

export interface StudentSearchParams {
  query?: string;
  filters?: StudentFilter;
  sortBy?: StudentSortField;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type StudentSortField = 
  | 'firstName'
  | 'lastName' 
  | 'email'
  | 'studentId'
  | 'promotion'
  | 'specialization'
  | 'createdAt'
  | 'lastLoginDate'
  | 'profileCompleteness'
  | 'technicalLevel'
  | 'softSkillsLevel';

// Types pour les réponses API
export interface StudentListResponse {
  students: Student[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface StudentDetailsResponse extends Student {
  statistics: StudentStatistics;
  recommendations: StudentRecommendation[];
  compatibleRoles: RoleCompatibility[];
}

export interface StudentRecommendation {
  type: RecommendationType;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

export type RecommendationType = 
  | 'complete-profile'
  | 'improve-skills'
  | 'join-team'
  | 'take-assessment'
  | 'update-preferences';

export interface RoleCompatibility {
  role: PreferredRole;
  compatibility: number; // 0-100
  strengths: string[];
  improvements: string[];
}

// Types pour l'algorithme de formation d'équipes
export interface StudentForTeamFormation {
  id: string;
  name: string;
  specialization: StudentSpecialization;
  skills: SkillProfile;
  preferences: {
    preferredRoles: PreferredRole[];
    workingStyle: WorkingStyle;
  };
  availability: boolean;
  compatibilityScores?: Map<string, number>; // ID étudiant -> score
}

export interface TeamFormationConfig {
  algorithm: TeamFormationAlgorithm;
  teamSize: number;
  numberOfTeams: number;
  balanceSkills: boolean;
  respectPreferences: boolean;
  diversityWeight: number; // 0-1
  compatibilityWeight: number; // 0-1
  randomSeed?: number;
}

export type TeamFormationAlgorithm = 
  | 'random'
  | 'skill-balanced' 
  | 'compatibility-based'
  | 'captain-draft'
  | 'hybrid';

export interface TeamFormationResult {
  teams: FormationTeam[];
  unassigned: StudentForTeamFormation[];
  algorithm: TeamFormationAlgorithm;
  scores: TeamFormationScores;
  timestamp: Date;
}

export interface FormationTeam {
  id: string;
  members: StudentForTeamFormation[];
  captain?: StudentForTeamFormation;
  skillBalance: SkillBalance;
  cohesionScore: number; // 0-100
  diversityScore: number; // 0-100
}

export interface SkillBalance {
  technical: number; // 0-100
  soft: number; // 0-100
  coverage: string[]; // Domaines couverts
  gaps: string[]; // Domaines manquants
}

export interface TeamFormationScores {
  overallBalance: number; // 0-100
  averageCohesion: number; // 0-100
  skillDistribution: number; // 0-100
  preferencesSatisfied: number; // 0-100
}

// Types pour l'import/export de données
export interface StudentBulkOperation {
  operation: BulkOperationType;
  students: string[]; // IDs des étudiants
  data?: any;
  filters?: StudentFilter;
}

export type BulkOperationType = 
  | 'export'
  | 'delete'
  | 'assign-team'
  | 'update-status'
  | 'send-notification';

export interface StudentExportConfig {
  format: ExportFormat;
  fields: StudentExportField[];
  includeSkills: boolean;
  includePreferences: boolean;
  includeStatistics: boolean;
}

export type ExportFormat = 'csv' | 'json' | 'xlsx';

export type StudentExportField = 
  | 'id'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'studentId'
  | 'promotion'
  | 'specialization'
  | 'teamId'
  | 'profileCompleteness'
  | 'lastLoginDate';

// Types pour les notifications et communications
export interface StudentNotification {
  id: string;
  studentId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

export type NotificationType = 
  | 'team-invitation'
  | 'profile-incomplete'
  | 'skill-assessment-due'
  | 'challenge-available'
  | 'system-update'
  | 'achievement'
  | 'reminder';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Types pour les rapports et analytics
export interface StudentAnalytics {
  totalStudents: number;
  activeStudents: number;
  bySpecialization: Record<StudentSpecialization, number>;
  byPromotion: Record<string, number>;
  byExperienceLevel: Record<ExperienceLevel, number>;
  skillDistribution: SkillDistribution;
  teamAssignmentRate: number;
  averageProfileCompleteness: number;
  topSkills: SkillRanking[];
}

export interface SkillDistribution {
  technical: {
    programming: number[];
    electronics: number[];
    mechanics: number[];
    iot: number[];
    networking: number[];
  };
  soft: {
    teamwork: number[];
    leadership: number[];
    communication: number[];
    problemSolving: number[];
    creativity: number[];
    adaptability: number[];
  };
}

export interface SkillRanking {
  skill: string;
  category: 'technical' | 'soft';
  averageLevel: number;
  count: number;
}

// Types utilitaires génériques
export type PartialStudent = Partial<Student>;
export type StudentWithoutDates = Omit<Student, 'createdAt' | 'updatedAt'>;
export type RequiredStudentFields = Required<Pick<Student, 'id' | 'firstName' | 'lastName' | 'email'>>;

// Types pour les hooks Angular
export interface UseStudentResult {
  student: Student | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseStudentsResult {
  students: Student[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: (params?: StudentSearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

// Re-export des types principaux pour éviter les imports multiples
export type {
  Student,
  StudentSpecialization,
  PreferredRole,
  WorkingStyle,
  ExperienceLevel,
  StudentStatus,
  SkillProfile
} from '../interfaces/student.interface';