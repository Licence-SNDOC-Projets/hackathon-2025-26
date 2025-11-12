import {
  ChallengeConfig,
  Team,
  ChallengeStatus,
  ChallengeResult,
  RobotTelemetry
} from '@wizard-console/challenge';

/**
 * État d'une équipe dans l'interface
 */
export interface TeamState {
  team: Team;
  status: ChallengeStatus;
  currentChallenge?: string;
  startTime?: number;
  lastUpdate?: number;
  isOnline: boolean;
  batteryLevel?: number;
  mqttTopics?: any;
}

/**
 * État d'un challenge dans l'interface
 */
export interface ChallengeUIState {
  config: ChallengeConfig;
  participants: TeamState[];
  isActive: boolean;
  countdown?: {
    active: boolean;
    value: string | null;
  };
  leaderboard: LeaderboardEntry[];
  currentRun?: {
    teamId: string;
    startTime: number;
    currentLap: number;
    lapTimes: number[];
  };
}

/**
 * Entrée du leaderboard
 */
export interface LeaderboardEntry {
  teamId: string;
  teamName: string;
  bestLapTime?: number;
  totalTime?: number;
  averageTime?: number;
  completedLaps: number;
  position: number;
  score: number;
  status: ChallengeStatus;
}

/**
 * Données en temps réel pour l'affichage
 */
export interface LiveData {
  teamId: string;
  telemetry?: RobotTelemetry;
  currentSpeed: number;
  isFollowingLine: boolean;
  sensorValues: number[];
  batteryVoltage: number;
  errors: string[];
  timestamp: number;
}

/**
 * Configuration d'affichage du challenge
 */
export interface ChallengeDisplayConfig {
  showTelemetry: boolean;
  showSensorData: boolean;
  showPIDValues: boolean;
  updateInterval: number;
  maxLogEntries: number;
  theme: 'light' | 'dark' | 'tron';
}

/**
 * Événement de log pour l'affichage
 */
export interface LogEvent {
  timestamp: number;
  level: 'info' | 'warning' | 'error' | 'success';
  source: string; // teamId ou 'system'
  message: string;
  data?: any;
}

/**
 * Métriques pour le dashboard
 */
export interface ChallengeMetrics {
  totalTeams: number;
  activeTeams: number;
  completedRuns: number;
  averageCompletionTime: number;
  fastestLap: number;
  fastestTotal: number;
  errorRate: number;
}

/**
 * Configuration d'une course
 */
export interface RaceConfiguration {
  challengeId: string;
  maxParticipants: number;
  countdownDuration: number;
  allowManualStart: boolean;
  enableTelemetry: boolean;
  recordVideo: boolean;
  autoNextRun: boolean;
}

/**
 * État global de l'application challenges
 */
export interface ChallengesAppState {
  availableChallenges: ChallengeConfig[];
  registeredTeams: TeamState[];
  activeChallenges: Record<string, ChallengeUIState>;
  selectedChallenge?: string;
  selectedTeam?: string;
  displayConfig: ChallengeDisplayConfig;
  raceConfig: RaceConfiguration;
  logs: LogEvent[];
  metrics: ChallengeMetrics;
  isLoading: boolean;
  error?: string;
}
