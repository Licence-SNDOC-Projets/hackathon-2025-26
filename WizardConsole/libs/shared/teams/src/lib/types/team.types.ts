/**
 * Types utilitaires pour la gestion des équipes
 */

import { Team, TeamMember, TeamStatus, RobotConfig, TeamRole, SkillCategory } from '../interfaces/team.interface';

// Types d'union pour les énumérations
export type ConnectionStatus = 'online' | 'offline' | 'unknown';
// Note: TeamRole et SkillCategory sont définis dans team.interface.ts

// Types pour les événements MQTT
export interface TeamMqttEvent {
  teamName: string;
  eventType: TeamEventType;
  timestamp: Date;
  data: any;
}

export type TeamEventType = 
  | 'connection-status-changed'
  | 'battery-level-updated'
  | 'config-updated'
  | 'challenge-started'
  | 'challenge-completed'
  | 'member-joined'
  | 'member-left';

// Types pour les statistiques d'équipe
export interface TeamStatistics {
  teamId: string;
  totalChallengesCompleted: number;
  bestLapTime: number | null;
  averageLapTime: number | null;
  totalDistance: number;
  uptime: number; // en secondes
  crashCount: number;
  lastActiveDate: Date;
}

// Types pour le classement
export interface TeamRanking {
  teamId: string;
  teamName: string;
  displayName: string;
  rank: number;
  totalPoints: number;
  challengeResults: ChallengeResult[];
  badges: TeamBadge[];
}

export interface ChallengeResult {
  challengeName: string;
  completedAt: Date;
  lapTimes: number[];
  bestLap: number;
  totalTime: number;
  rank: number;
  points: number;
}

export interface TeamBadge {
  id: string;
  name: string;
  description: string;
  iconUrl?: string;
  earnedAt: Date;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// Types pour les configurations
export interface TeamConfigUpdate {
  teamId: string;
  configType: ConfigType;
  oldValue: any;
  newValue: any;
  updatedBy: string;
  timestamp: Date;
}

export type ConfigType = 'robot' | 'member' | 'general';

// Types pour les filtres et requêtes
export interface TeamFilter {
  status?: ConnectionStatus[];
  roles?: TeamRole[];
  skillCategories?: SkillCategory[];
  challengeParticipation?: string[];
  batteryLevel?: {
    min?: number;
    max?: number;
  };
  memberCount?: {
    min?: number;
    max?: number;
  };
}

export interface TeamSearchParams {
  query?: string;
  filters?: TeamFilter;
  sortBy?: TeamSortField;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type TeamSortField = 
  | 'name'
  | 'displayName' 
  | 'createdAt'
  | 'lastSeen'
  | 'batteryLevel'
  | 'memberCount'
  | 'totalPoints';

// Types pour les réponses API
export interface TeamListResponse {
  teams: Team[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface TeamDetailsResponse extends Team {
  statistics: TeamStatistics;
  ranking: TeamRanking;
  recentActivity: TeamActivity[];
}

export interface TeamActivity {
  id: string;
  teamId: string;
  type: TeamActivityType;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export type TeamActivityType =
  | 'created'
  | 'member-added'
  | 'member-removed'
  | 'config-changed'
  | 'challenge-started'
  | 'challenge-completed'
  | 'achievement-unlocked'
  | 'status-changed';

// Types pour la formation d'équipes (draft)
export interface TeamDraftConfig {
  maxTeams: number;
  membersPerTeam: number;
  draftMode: DraftMode;
  skillBalancing: boolean;
  autoBalance: boolean;
}

export type DraftMode = 'captain-pick' | 'random' | 'skill-balanced' | 'manual';

export interface DraftPlayer extends TeamMember {
  isDrafted: boolean;
  draftedBy?: string;
  draftOrder?: number;
}

export interface DraftState {
  config: TeamDraftConfig;
  players: DraftPlayer[];
  teams: Partial<Team>[];
  currentPicker?: string;
  draftOrder: string[];
  phase: DraftPhase;
}

export type DraftPhase = 'setup' | 'captain-selection' | 'player-draft' | 'completed';

// Types pour les notifications
export interface TeamNotification {
  id: string;
  teamId: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
}

export type NotificationType = 
  | 'info'
  | 'warning' 
  | 'error'
  | 'success'
  | 'achievement'
  | 'challenge-invite'
  | 'system-update';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Types utilitaires génériques
export type PartialTeam = Partial<Team>;
export type RequiredTeamFields = Required<Pick<Team, 'id' | 'name' | 'displayName'>>;
export type TeamWithoutDates = Omit<Team, 'createdAt' | 'updatedAt'>;
export type TeamMemberWithoutDates = Omit<TeamMember, 'joinedAt'>;

// Types pour les hooks et services Angular
export interface UseTeamResult {
  team: Team | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseTeamsResult {
  teams: Team[];
  total: number;
  loading: boolean;
  error: string | null;
  refetch: (params?: TeamSearchParams) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

// Types pour les websockets/temps réel
export interface TeamRealtimeEvent {
  type: 'team-updated' | 'team-status-changed' | 'team-config-changed';
  teamId: string;
  data: any;
  timestamp: Date;
}

// Types d'export pour faciliter l'import
export type {
  Team,
  TeamMember,
  TeamStatus,
  RobotConfig
} from '../interfaces/team.interface';