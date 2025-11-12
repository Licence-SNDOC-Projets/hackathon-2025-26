/**
 * Types TypeScript pour la communication MQTT dans le système "MQTT Race"
 *
 * Ce fichier définit tous les types nécessaires pour une communication
 * type-safe entre les robots, le backend et le frontend via MQTT.
 */

import { ChallengeStatus, CountdownValue, Team } from './challenge';

// ========================
// TOPICS MQTT
// ========================

/**
 * Structure hiérarchique des topics MQTT
 */
export interface MQTTTopics {
  // Topics d'équipe (/<team>/**) - RW pour l'équipe, R pour les autres
  team: {
    startchallenge: string;     // /<team>/startchallenge
    config: {
      speed: string;            // /<team>/config/speed
      pid_kp: string;          // /<team>/config/pid_kp
      pid_ki: string;          // /<team>/config/pid_ki
      pid_kd: string;          // /<team>/config/pid_kd
    };
    status: {
      battery: string;         // /<team>/status/battery
      sensors: string;         // /<team>/status/sensors
      connection: string;      // /<team>/status/connection
    };
    debug: {
      logs: string;            // /<team>/debug/logs
      telemetry: string;       // /<team>/debug/telemetry
    };
  };

  // Topics de challenges (/challenges/**) - R pour équipes, RW pour prof
  challenges: {
    [challengeId: string]: {
      teams: {
        [teamId: string]: {
          status: string;      // /challenges/<challenge>/<team>/status
        };
      };
      countdown: {
        value: string;         // /challenges/<challenge>/countdown/value
        active: string;        // /challenges/<challenge>/countdown/active
      };
      scores: {
        [teamId: string]: {
          [runNumber: string]: {
            laps: {
              [lapNumber: string]: string;  // /challenges/<challenge>/scores/<team>/<run>/laps/<lap>
            };
            avg: string;       // /challenges/<challenge>/scores/<team>/<run>/avg
            bestlap: string;   // /challenges/<challenge>/scores/<team>/<run>/bestlap
            total: string;     // /challenges/<challenge>/scores/<team>/<run>/total
          };
        };
      };
      leaderboard: {
        fastest_lap: string;   // /challenges/<challenge>/leaderboard/fastest_lap
        fastest_total: string; // /challenges/<challenge>/leaderboard/fastest_total
        ranking: string;       // /challenges/<challenge>/leaderboard/ranking
      };
    };
  };

  // Topics de balises (/beacons/**)
  beacons: {
    [beaconId: string]: {
      triggered: string;       // /beacons/<beacon>/triggered
      team_detected: string;   // /beacons/<beacon>/team_detected
      timestamp: string;       // /beacons/<beacon>/timestamp
    };
  };
}

// ========================
// PAYLOADS MQTT
// ========================

/**
 * Types des payloads pour les topics d'équipe
 */
export interface TeamMQTTPayloads {
  startchallenge: string;      // nom du challenge demandé
  config: {
    speed: string;             // "75" (pourcentage)
    pid_kp: string;           // "2.5"
    pid_ki: string;           // "0.1"
    pid_kd: string;           // "0.05"
  };
  status: {
    battery: string;          // "87" (pourcentage)
    sensors: string;          // "OK" | "ERROR" | JSON des valeurs
    connection: string;       // "online" | "offline"
  };
  debug: {
    logs: string;             // message de log libre
    telemetry: string;        // JSON des données télémétrie
  };
}

/**
 * Types des payloads pour les topics de challenges
 */
export interface ChallengeMQTTPayloads {
  teams: {
    [teamId: string]: {
      status: ChallengeStatus;  // "accepted" | "denied" | "busy" | etc.
    };
  };
  countdown: {
    value: CountdownValue | null;  // "3" | "2" | "1" | "0" | "GO" | null
    active: boolean;          // true | false
  };
  scores: {
    [teamId: string]: {
      [runNumber: string]: {
        laps: Record<string, number>;  // {"1": 23450, "2": 22180}
        avg: number;           // temps moyen par tour en ms
        bestlap: number;       // meilleur tour en ms
        total: number;         // temps total en ms
      };
    };
  };
  leaderboard: {
    fastest_lap: number;       // meilleur tour de tous les runs
    fastest_total: number;     // meilleur temps total
    ranking: Array<{          // classement général
      teamId: string;
      score: number;
      position: number;
    }>;
  };
}

/**
 * Types des payloads pour les topics de balises
 */
export interface BeaconMQTTPayloads {
  [beaconId: string]: {
    triggered: boolean;        // true | false
    team_detected: string;     // nom de l'équipe détectée
    timestamp: number;         // timestamp Unix en ms
  };
}

// ========================
// MESSAGES MQTT STRUCTURÉS
// ========================

/**
 * Structure d'un message MQTT avec métadonnées
 */
export interface MQTTMessage<T = any> {
  topic: string;
  payload: T;
  qos: 0 | 1 | 2;
  retain: boolean;
  timestamp: number;
  clientId?: string;
}

/**
 * Message de demande de challenge
 */
export interface ChallengeRequestMessage extends MQTTMessage<string> {
  topic: `/${string}/startchallenge`;
  payload: string;  // challengeId
}

/**
 * Message de réponse de challenge
 */
export interface ChallengeResponseMessage extends MQTTMessage<ChallengeStatus> {
  topic: `/challenges/${string}/${string}/status`;
  payload: ChallengeStatus;
}

/**
 * Message de décompte
 */
export interface CountdownMessage extends MQTTMessage<CountdownValue> {
  topic: `/challenges/${string}/countdown/value`;
  payload: CountdownValue;
}

/**
 * Message de score
 */
export interface ScoreMessage extends MQTTMessage<string> {
  topic: `/challenges/${string}/scores/${string}/${string}/${string}`;
  payload: string;  // valeur numérique en string
}

/**
 * Message de télémétrie
 */
export interface TelemetryMessage extends MQTTMessage<string> {
  topic: `/${string}/debug/telemetry`;
  payload: string;  // JSON stringifié
}

/**
 * Message de configuration
 */
export interface ConfigMessage extends MQTTMessage<string> {
  topic: `/${string}/config/${string}`;
  payload: string;  // valeur de configuration
}

// ========================
// STRUCTURES DE DONNÉES TÉLÉMÉTRIE
// ========================

/**
 * Données de télémétrie d'un robot
 */
export interface RobotTelemetry {
  timestamp: number;
  sensors: {
    line_sensors?: number[];   // valeurs des capteurs de ligne [left, center, right]
    distance?: number;         // capteur de distance (cm)
    battery_voltage?: number;  // tension batterie (V)
    motor_speeds?: {          // vitesses moteurs
      left: number;
      right: number;
    };
  };
  position?: {
    x?: number;
    y?: number;
    orientation?: number;      // angle en degrés
  };
  state: {
    current_speed: number;     // vitesse actuelle (0-100%)
    following_line: boolean;   // suit la ligne ou non
    challenge_active: boolean; // en challenge ou non
    errors?: string[];         // erreurs actuelles
  };
  pid_values?: {
    kp: number;
    ki: number;
    kd: number;
    error: number;
    integral: number;
    derivative: number;
    output: number;
  };
}

/**
 * Configuration d'un robot
 */
export interface RobotConfig {
  speed: number;               // vitesse de base (0-100%)
  pid: {
    kp: number;
    ki: number;
    kd: number;
  };
  sensors: {
    line_threshold?: number;   // seuil de détection de ligne
    distance_alert?: number;   // distance d'alerte (cm)
  };
  behavior: {
    max_turn_speed?: number;   // vitesse max en virage
    acceleration?: number;     // accélération
    braking_distance?: number; // distance de freinage
  };
}

// ========================
// ÉVÉNEMENTS MQTT
// ========================

/**
 * Types d'événements MQTT
 */
export enum MQTTEventType {
  // Événements de connexion
  CONNECT = 'connect',
  DISCONNECT = 'disconnect',
  RECONNECT = 'reconnect',

  // Événements de messages
  MESSAGE = 'message',
  PUBLISH = 'publish',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',

  // Événements de challenges
  CHALLENGE_REQUEST = 'challenge_request',
  CHALLENGE_RESPONSE = 'challenge_response',
  CHALLENGE_START = 'challenge_start',
  CHALLENGE_END = 'challenge_end',

  // Événements de course
  COUNTDOWN_START = 'countdown_start',
  COUNTDOWN_TICK = 'countdown_tick',
  LAP_COMPLETED = 'lap_completed',
  FINISH_LINE = 'finish_line',

  // Événements de balises
  BEACON_TRIGGERED = 'beacon_triggered',

  // Événements système
  TELEMETRY = 'telemetry',
  CONFIG_UPDATE = 'config_update',
  ERROR = 'error'
}

/**
 * Interface générique pour les événements MQTT
 */
export interface MQTTEvent<T = any> {
  type: MQTTEventType;
  timestamp: number;
  source: string;              // clientId de l'émetteur
  data: T;
  metadata?: Record<string, any>;
}

/**
 * Événement de demande de challenge
 */
export interface ChallengeRequestEvent extends MQTTEvent<{
  teamId: string;
  challengeId: string;
}> {
  type: MQTTEventType.CHALLENGE_REQUEST;
}

/**
 * Événement de tour complété
 */
export interface LapCompletedEvent extends MQTTEvent<{
  teamId: string;
  challengeId: string;
  lapNumber: number;
  lapTime: number;
  totalTime: number;
}> {
  type: MQTTEventType.LAP_COMPLETED;
}

/**
 * Événement de balise déclenchée
 */
export interface BeaconTriggeredEvent extends MQTTEvent<{
  beaconId: string;
  teamId: string;
  timestamp: number;
  challengeId?: string;
}> {
  type: MQTTEventType.BEACON_TRIGGERED;
}

// ========================
// HELPERS ET UTILITAIRES
// ========================

/**
 * Générateur de topics MQTT type-safe
 */
export class MQTTTopicBuilder {
  /**
   * Génère un topic d'équipe
   */
  static team(teamId: string): {
    startchallenge: string;
    config: {
      speed: string;
      pid_kp: string;
      pid_ki: string;
      pid_kd: string;
    };
    status: {
      battery: string;
      sensors: string;
      connection: string;
    };
    debug: {
      logs: string;
      telemetry: string;
    };
  } {
    return {
      startchallenge: `/${teamId}/startchallenge`,
      config: {
        speed: `/${teamId}/config/speed`,
        pid_kp: `/${teamId}/config/pid_kp`,
        pid_ki: `/${teamId}/config/pid_ki`,
        pid_kd: `/${teamId}/config/pid_kd`,
      },
      status: {
        battery: `/${teamId}/status/battery`,
        sensors: `/${teamId}/status/sensors`,
        connection: `/${teamId}/status/connection`,
      },
      debug: {
        logs: `/${teamId}/debug/logs`,
        telemetry: `/${teamId}/debug/telemetry`,
      }
    };
  }

  /**
   * Génère un topic de challenge
   */
  static challenge(challengeId: string, teamId?: string): any {
    const base = `/challenges/${challengeId}`;

    if (teamId) {
      return {
        status: `${base}/${teamId}/status`,
      };
    }

    return {
      countdown: {
        value: `${base}/countdown/value`,
        active: `${base}/countdown/active`,
      },
      leaderboard: {
        fastest_lap: `${base}/leaderboard/fastest_lap`,
        fastest_total: `${base}/leaderboard/fastest_total`,
        ranking: `${base}/leaderboard/ranking`,
      },
      scores: (teamId: string, runNumber: number) => ({
        laps: (lapNumber: number) => `${base}/scores/${teamId}/${runNumber}/laps/${lapNumber}`,
        avg: `${base}/scores/${teamId}/${runNumber}/avg`,
        bestlap: `${base}/scores/${teamId}/${runNumber}/bestlap`,
        total: `${base}/scores/${teamId}/${runNumber}/total`,
      })
    };
  }

  /**
   * Génère un topic de balise
   */
  static beacon(beaconId: string): {
    triggered: string;
    team_detected: string;
    timestamp: string;
  } {
    return {
      triggered: `/beacons/${beaconId}/triggered`,
      team_detected: `/beacons/${beaconId}/team_detected`,
      timestamp: `/beacons/${beaconId}/timestamp`,
    };
  }
}

/**
 * Parser de topics MQTT
 */
export class MQTTTopicParser {
  /**
   * Parse un topic d'équipe
   */
  static parseTeamTopic(topic: string): {
    teamId: string;
    category: 'config' | 'status' | 'debug' | 'startchallenge';
    field?: string;
  } | null {
    const match = topic.match(/^\/([^/]+)\/(?:(config|status|debug)\/([^/]+)|startchallenge)$/);
    if (!match) return null;

    return {
      teamId: match[1],
      category: (match[2] || 'startchallenge') as any,
      field: match[3]
    };
  }

  /**
   * Parse un topic de challenge
   */
  static parseChallengeTopic(topic: string): {
    challengeId: string;
    teamId?: string;
    category: 'status' | 'countdown' | 'scores' | 'leaderboard';
    field?: string;
    runNumber?: number;
    lapNumber?: number;
  } | null {
    // /challenges/<challengeId>/<teamId>/status
    let match = topic.match(/^\/challenges\/([^/]+)\/([^/]+)\/status$/);
    if (match) {
      return {
        challengeId: match[1],
        teamId: match[2],
        category: 'status'
      };
    }

    // /challenges/<challengeId>/countdown/<field>
    match = topic.match(/^\/challenges\/([^/]+)\/countdown\/([^/]+)$/);
    if (match) {
      return {
        challengeId: match[1],
        category: 'countdown',
        field: match[2]
      };
    }

    // /challenges/<challengeId>/scores/<teamId>/<runNumber>/laps/<lapNumber>
    match = topic.match(/^\/challenges\/([^/]+)\/scores\/([^/]+)\/(\d+)\/laps\/(\d+)$/);
    if (match) {
      return {
        challengeId: match[1],
        teamId: match[2],
        category: 'scores',
        field: 'laps',
        runNumber: parseInt(match[3]),
        lapNumber: parseInt(match[4])
      };
    }

    // /challenges/<challengeId>/scores/<teamId>/<runNumber>/<field>
    match = topic.match(/^\/challenges\/([^/]+)\/scores\/([^/]+)\/(\d+)\/([^/]+)$/);
    if (match) {
      return {
        challengeId: match[1],
        teamId: match[2],
        category: 'scores',
        field: match[4],
        runNumber: parseInt(match[3])
      };
    }

    // /challenges/<challengeId>/leaderboard/<field>
    match = topic.match(/^\/challenges\/([^/]+)\/leaderboard\/([^/]+)$/);
    if (match) {
      return {
        challengeId: match[1],
        category: 'leaderboard',
        field: match[2]
      };
    }

    return null;
  }

  /**
   * Parse un topic de balise
   */
  static parseBeaconTopic(topic: string): {
    beaconId: string;
    field: string;
  } | null {
    const match = topic.match(/^\/beacons\/([^/]+)\/([^/]+)$/);
    if (!match) return null;

    return {
      beaconId: match[1],
      field: match[2]
    };
  }
}

/**
 * Validateurs de payloads MQTT
 */
export class MQTTPayloadValidator {
  /**
   * Valide une demande de challenge
   */
  static validateChallengeRequest(payload: any): payload is string {
    return typeof payload === 'string' && payload.length > 0;
  }

  /**
   * Valide une réponse de challenge
   */
  static validateChallengeResponse(payload: any): payload is ChallengeStatus {
    return Object.values(ChallengeStatus).includes(payload);
  }

  /**
   * Valide des données de télémétrie
   */
  static validateTelemetry(payload: any): payload is RobotTelemetry {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      return (
        typeof data === 'object' &&
        typeof data.timestamp === 'number' &&
        typeof data.sensors === 'object' &&
        typeof data.state === 'object'
      );
    } catch {
      return false;
    }
  }

  /**
   * Valide une configuration de robot
   */
  static validateRobotConfig(payload: any): payload is RobotConfig {
    try {
      const data = typeof payload === 'string' ? JSON.parse(payload) : payload;
      return (
        typeof data === 'object' &&
        typeof data.speed === 'number' &&
        data.speed >= 0 && data.speed <= 100 &&
        typeof data.pid === 'object' &&
        typeof data.pid.kp === 'number' &&
        typeof data.pid.ki === 'number' &&
        typeof data.pid.kd === 'number'
      );
    } catch {
      return false;
    }
  }
}
