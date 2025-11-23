// ========================
// INTERFACES DE BASE
// ========================

/**
 * Représente une équipe participant au hackathon
 */
export interface Team {
  name: string;
  id: string;
  members?: string[];
}

/**
 * Représente le statut d'un challenge
 */
export enum ChallengeStatus {
  WAITING = 'waiting',
  ACCEPTED = 'accepted',
  DENIED = 'denied',
  BUSY = 'busy',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

/**
 * Représente les différents états du décompte
 */
export type CountdownValue = '3' | '2' | '1' | '0' | 'GO';

/**
 * Configuration de base d'un challenge
 */
export interface ChallengeConfig {
  /** Identifiant unique du challenge */
  id: string;
  /** Nom d'affichage du challenge */
  name: string;
  /** Description du challenge */
  description: string;
  /** Durée maximale en secondes (optionnel) */
  maxDuration?: number;
  /** Nombre de tours maximum (pour les circuits) */
  maxLaps?: number;
  /** Indique si le challenge nécessite un décompte */
  hasCountdown: boolean;
  /** Configuration spécifique au challenge */
  customConfig?: Record<string, any>;
}

/**
 * Résultat d'un passage de challenge
 */
export interface ChallengeResult {
  teamId: string;
  challengeId: string;
  runNumber: number;
  startTime: number;
  endTime?: number;
  laps?: Record<number, number>; // numéro de tour -> temps en ms
  totalTime?: number;
  bestLap?: number;
  averageTime?: number;
  customMetrics?: Record<string, number>;
  status: ChallengeStatus;
  errors?: string[];
}

/**
 * Données MQTT pour les topics de challenge
 */
export interface MQTTChallengeData {
  challenges: {
    [challengeId: string]: {
      teams: {
        [teamId: string]: {
          status: ChallengeStatus;
        };
      };
      countdown: {
        value: CountdownValue | null;
        active: boolean;
      };
      scores: {
        [teamId: string]: {
          [runNumber: string]: {
            laps?: Record<string, number>;
            avg?: number;
            bestlap?: number;
            total?: number;
            customMetrics?: Record<string, number>;
          };
        };
      };
      leaderboard: {
        fastest_lap?: number;
        fastest_total?: number;
        ranking?: Array<{ teamId: string; score: number; }>;
      };
    };
  };
}

/**
 * Données MQTT pour les topics d'équipe
 */
export interface MQTTTeamData {
  [teamId: string]: {
    startchallenge?: string;
    config: {
      speed?: number;
      pid_kp?: number;
      pid_ki?: number;
      pid_kd?: number;
    };
    status: {
      battery?: number;
      sensors?: string;
      connection?: string;
    };
    debug: {
      logs?: string;
      telemetry?: string;
    };
  };
}

// ========================
// CLASSES ABSTRAITES
// ========================

/**
 * Callback pour publier sur MQTT
 */
export type MQTTPublishCallback = (topic: string, message: string, options?: { retain?: boolean; qos?: 0 | 1 | 2 }) => void;

/**
 * Classe abstraite de base pour tous les challenges
 */
export abstract class BaseChallenge {
  protected config: ChallengeConfig;
  private _isOpen = false;
  private mqttPublish?: MQTTPublishCallback;

  constructor(config: ChallengeConfig, mqttPublish?: MQTTPublishCallback) {
    this.config = config;
    this.mqttPublish = mqttPublish;

    // Publier la config initiale sur MQTT si disponible
    if (this.mqttPublish) {
      this.publishConfigToMQTT();
    }
  }

  /**
   * Définit le callback MQTT (utile si défini après construction)
   */
  setMQTTPublish(callback: MQTTPublishCallback): void {
    this.mqttPublish = callback;
    this.publishConfigToMQTT();
  }

  /**
   * Obtient la configuration du challenge
   */
  getConfig(): ChallengeConfig {
    return { ...this.config };
  }

  /**
   * Vérifie si le challenge est ouvert
   */
  isOpen(): boolean {
    return this._isOpen;
  }

  /**
   * Ouvre le challenge
   */
  open(): void {
    this._isOpen = true;
    this.publishStateToMQTT();
  }

  /**
   * Ferme le challenge
   */
  close(): void {
    this._isOpen = false;
    this.publishStateToMQTT();
  }

  /**
   * Publie l'état du challenge sur MQTT
   * Topic: hackathon/challenges/<challenge-id>/state
   * Message: "open" ou "closed" (données brutes, pas JSON)
   */
  private publishStateToMQTT(): void {
    if (!this.mqttPublish) return;

    const topic = `hackathon/challenges/${this.config.id}/state`;
    const message = this._isOpen ? 'open' : 'closed';

    this.mqttPublish(topic, message, { retain: true, qos: 1 });
  }

  /**
   * Publie la configuration du challenge sur MQTT
   * Topic: hackathon/challenges/<challenge-id>/config
   * Message: JSON de la configuration
   */
  private publishConfigToMQTT(): void {
    if (!this.mqttPublish) return;

    const topic = `hackathon/challenges/${this.config.id}/config`;
    const message = JSON.stringify(this.config, null, 2);

    this.mqttPublish(topic, message, { retain: true, qos: 1 });
  }

  /**
   * Restaure l'état depuis une valeur (utile pour restaurer depuis MQTT)
   */
  restoreState(state: 'open' | 'closed'): void {
    this._isOpen = state === 'open';
  }

  /**
   * Vérifie si une équipe peut participer au challenge
   */
  abstract canTeamParticipate(team: Team): Promise<boolean>;

  /**
   * Prépare le challenge pour une équipe spécifique
   */
  abstract prepareForTeam(team: Team): Promise<void>;

  /**
   * Démarre le challenge pour une équipe
   */
  abstract startChallenge(team: Team): Promise<void>;

  /**
   * Traite les données de télémétrie pendant le challenge
   */
  abstract processTelemetry(team: Team, data: any): Promise<void>;

  /**
   * Calcule le score final du challenge
   */
  abstract calculateScore(result: ChallengeResult): Promise<number>;

  /**
   * Vérifie si le challenge est terminé
   */
  abstract isCompleted(team: Team): Promise<boolean>;

  /**
   * Nettoie après la fin du challenge
   */
  abstract cleanup(team: Team): Promise<void>;
}

/**
 * Interface pour les challenges chronométrés (courses)
 */
export interface TimedChallenge {
  /**
   * Démarre le chronomètre pour une équipe
   */
  startTimer(team: Team): Promise<void>;

  /**
   * Arrête le chronomètre pour une équipe
   */
  stopTimer(team: Team): Promise<number>;

  /**
   * Obtient le temps actuel pour une équipe
   */
  getCurrentTime(team: Team): Promise<number>;
}

/**
 * Interface pour les challenges avec tours multiples
 */
export interface LapBasedChallenge {
  /**
   * Enregistre le passage d'un tour
   */
  recordLap(team: Team, lapNumber: number): Promise<number>;

  /**
   * Obtient le meilleur temps de tour pour une équipe
   */
  getBestLapTime(team: Team): Promise<number | null>;

  /**
   * Obtient tous les temps de tours pour une équipe
   */
  getAllLapTimes(team: Team): Promise<Record<number, number>>;
}

/**
 * Interface pour les challenges avec métriques personnalisées
 */
export interface CustomMetricsChallenge {
  /**
   * Définit les métriques personnalisées pour ce challenge
   */
  getCustomMetricsDefinition(): Record<string, string>;

  /**
   * Traite et valide une métrique personnalisée
   */
  processCustomMetric(metricName: string, value: any, team: Team): Promise<number>;
}
