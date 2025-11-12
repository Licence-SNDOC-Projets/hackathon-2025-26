import {
  BaseChallenge,
  ChallengeConfig,
  ChallengeResult,
  ChallengeStatus,
  Team,
  TimedChallenge,
  LapBasedChallenge
} from '../challenge';
import { RegisterChallenge } from '../challenge-registry';

/**
 * Configuration spécifique au Tron Legacy Circuit
 */
interface TronLegacyConfig {
  /** Nombre de tours à effectuer */
  requiredLaps: number;
  /** Temps maximum autorisé pour un tour (en ms) */
  maxLapTime: number;
  /** Temps maximum total pour le challenge (en ms) */
  maxTotalTime: number;
  /** Points attribués selon le classement */
  pointsSystem: Record<number, number>; // position -> points
}

/**
 * État d'une équipe pendant le challenge
 */
interface TronLegacyTeamState {
  startTime: number | null;
  currentLap: number;
  lapTimes: Record<number, number>;
  totalTime: number | null;
  bestLapTime: number | null;
  status: ChallengeStatus;
  errors: string[];
}

/**
 * Challenge "Tron Legacy Circuit" - Circuit ovale d'initiation
 *
 * Ce challenge introduit les bases du suivi de ligne et de la communication MQTT.
 * Les robots doivent effectuer plusieurs tours d'un circuit ovale simple en
 * optimisant leur temps de parcours.
 */
@RegisterChallenge({
  id: 'tron-legacy-circuit',
  version: '1.0.0',
  author: 'WizardConsole Team',
  tags: ['initiation', 'circuit-ovale', 'chronometrage', 'mqtt']
})
export class TronLegacyCircuitChallenge extends BaseChallenge implements TimedChallenge, LapBasedChallenge {

  private readonly customConfig: TronLegacyConfig;
  private teamStates = new Map<string, TronLegacyTeamState>();

  constructor() {
    const config: ChallengeConfig = {
      id: 'tron-legacy-circuit',
      name: 'Tron Legacy Circuit',
      description: `Votre première mission consiste à maîtriser un circuit ovale simple,
        semblable aux pistes lumineuses du film Tron. Ce challenge d'initiation vous permettra
        de vous familiariser avec les bases du suivi de ligne et de la communication MQTT.`,
      maxDuration: 300000, // 5 minutes maximum
      maxLaps: 5,
      hasCountdown: true,
      customConfig: {
        requiredLaps: 3,
        maxLapTime: 60000, // 1 minute par tour maximum
        maxTotalTime: 180000, // 3 minutes maximum total
        pointsSystem: {
          1: 10, // 1er : 10 points
          2: 7,  // 2e : 7 points
          3: 5,  // 3e : 5 points
          4: 3   // 4e : 3 points
        }
      }
    };

    super(config);
    this.customConfig = config.customConfig as TronLegacyConfig;
  }

  /**
   * Vérifie si une équipe peut participer au challenge
   */
  async canTeamParticipate(team: Team): Promise<boolean> {
    // Vérifications de base
    if (!team.id || !team.name) {
      return false;
    }

    // Une équipe ne peut pas participer si elle est déjà en cours
    const teamState = this.teamStates.get(team.id);
    if (teamState && teamState.status === ChallengeStatus.IN_PROGRESS) {
      return false;
    }

    return true;
  }

  /**
   * Prépare le challenge pour une équipe spécifique
   */
  async prepareForTeam(team: Team): Promise<void> {
    const initialState: TronLegacyTeamState = {
      startTime: null,
      currentLap: 0,
      lapTimes: {},
      totalTime: null,
      bestLapTime: null,
      status: ChallengeStatus.WAITING,
      errors: []
    };

    this.teamStates.set(team.id, initialState);
    console.log(`🏁 Challenge Tron Legacy préparé pour l'équipe ${team.name}`);
  }

  /**
   * Démarre le challenge pour une équipe
   */
  async startChallenge(team: Team): Promise<void> {
    const teamState = this.teamStates.get(team.id);
    if (!teamState) {
      throw new Error(`Team ${team.id} not prepared for challenge`);
    }

    const startTime = Date.now();
    teamState.startTime = startTime;
    teamState.status = ChallengeStatus.IN_PROGRESS;
    teamState.currentLap = 1;

    console.log(`🚀 Challenge Tron Legacy démarré pour l'équipe ${team.name} à ${new Date(startTime).toISOString()}`);
  }

  /**
   * Traite les données de télémétrie pendant le challenge
   */
  async processTelemetry(team: Team, data: any): Promise<void> {
    const teamState = this.teamStates.get(team.id);
    if (!teamState || teamState.status !== ChallengeStatus.IN_PROGRESS) {
      return;
    }

    // Traiter différents types de données de télémétrie
    if (data.type === 'lap_completed') {
      await this.recordLap(team, teamState.currentLap);
    } else if (data.type === 'sensor_data') {
      // Log des données capteurs pour debugging
      console.log(`📡 Télémétrie équipe ${team.name}:`, data.sensors);
    } else if (data.type === 'error') {
      teamState.errors.push(`Lap ${teamState.currentLap}: ${data.message}`);
    }
  }

  /**
   * Enregistre le passage d'un tour
   */
  async recordLap(team: Team, lapNumber: number): Promise<number> {
    const teamState = this.teamStates.get(team.id);
    if (!teamState || !teamState.startTime) {
      throw new Error(`Team ${team.id} not in progress`);
    }

    const currentTime = Date.now();
    const lapStartTime = lapNumber === 1
      ? teamState.startTime
      : teamState.startTime + Object.values(teamState.lapTimes)
          .slice(0, lapNumber - 1)
          .reduce((sum, time) => sum + time, 0);

    const lapTime = currentTime - lapStartTime;

    // Vérifier le temps maximum par tour
    if (lapTime > this.customConfig.maxLapTime) {
      teamState.errors.push(`Lap ${lapNumber} exceeded maximum time: ${lapTime}ms`);
    }

    // Enregistrer le temps du tour
    teamState.lapTimes[lapNumber] = lapTime;

    // Mettre à jour le meilleur temps
    if (!teamState.bestLapTime || lapTime < teamState.bestLapTime) {
      teamState.bestLapTime = lapTime;
    }

    console.log(`⏱️ Équipe ${team.name} - Tour ${lapNumber}: ${(lapTime / 1000).toFixed(3)}s`);

    // Vérifier si le challenge est terminé
    if (lapNumber >= this.customConfig.requiredLaps) {
      teamState.totalTime = currentTime - teamState.startTime;
      teamState.status = ChallengeStatus.COMPLETED;
      console.log(`🏁 Équipe ${team.name} a terminé le challenge en ${(teamState.totalTime / 1000).toFixed(3)}s`);
    } else {
      teamState.currentLap = lapNumber + 1;
    }

    return lapTime;
  }

  /**
   * Obtient le meilleur temps de tour pour une équipe
   */
  async getBestLapTime(team: Team): Promise<number | null> {
    const teamState = this.teamStates.get(team.id);
    return teamState ? teamState.bestLapTime : null;
  }

  /**
   * Obtient tous les temps de tours pour une équipe
   */
  async getAllLapTimes(team: Team): Promise<Record<number, number>> {
    const teamState = this.teamStates.get(team.id);
    return teamState ? { ...teamState.lapTimes } : {};
  }

  /**
   * Démarre le chronomètre pour une équipe
   */
  async startTimer(team: Team): Promise<void> {
    await this.startChallenge(team);
  }

  /**
   * Arrête le chronomètre pour une équipe
   */
  async stopTimer(team: Team): Promise<number> {
    const teamState = this.teamStates.get(team.id);
    if (!teamState || !teamState.startTime) {
      throw new Error(`Team ${team.id} timer not started`);
    }

    const endTime = Date.now();
    const totalTime = endTime - teamState.startTime;

    teamState.totalTime = totalTime;
    teamState.status = ChallengeStatus.COMPLETED;

    return totalTime;
  }

  /**
   * Obtient le temps actuel pour une équipe
   */
  async getCurrentTime(team: Team): Promise<number> {
    const teamState = this.teamStates.get(team.id);
    if (!teamState || !teamState.startTime) {
      return 0;
    }

    if (teamState.totalTime !== null) {
      return teamState.totalTime;
    }

    return Date.now() - teamState.startTime;
  }

  /**
   * Calcule le score final du challenge
   */
  async calculateScore(result: ChallengeResult): Promise<number> {
    if (!result.totalTime || result.status !== ChallengeStatus.COMPLETED) {
      return 0;
    }

    // Score de base basé sur le temps total (moins c'est long, plus c'est bien)
    const maxTime = this.customConfig.maxTotalTime;
    const timeScore = Math.max(0, (maxTime - result.totalTime) / maxTime) * 100;

    // Bonus pour la régularité (écart type des temps de tours)
    let consistencyBonus = 0;
    if (result.laps && Object.keys(result.laps).length >= this.customConfig.requiredLaps) {
      const lapTimes = Object.values(result.laps);
      const avgLapTime = lapTimes.reduce((sum, time) => sum + time, 0) / lapTimes.length;
      const variance = lapTimes.reduce((sum, time) => sum + Math.pow(time - avgLapTime, 2), 0) / lapTimes.length;
      const stdDev = Math.sqrt(variance);

      // Bonus inversement proportionnel à l'écart type
      consistencyBonus = Math.max(0, 20 - (stdDev / 1000)); // Max 20 points bonus
    }

    // Pénalité pour les erreurs
    const errorPenalty = (result.errors?.length || 0) * 5;

    const finalScore = Math.max(0, timeScore + consistencyBonus - errorPenalty);

    console.log(`📊 Score calculé pour ${result.teamId}: ${finalScore.toFixed(2)} (temps: ${timeScore.toFixed(2)}, régularité: ${consistencyBonus.toFixed(2)}, pénalités: -${errorPenalty})`);

    return Math.round(finalScore);
  }

  /**
   * Vérifie si le challenge est terminé
   */
  async isCompleted(team: Team): Promise<boolean> {
    const teamState = this.teamStates.get(team.id);
    if (!teamState) {
      return false;
    }

    // Terminé si le statut est COMPLETED ou FAILED
    if (teamState.status === ChallengeStatus.COMPLETED || teamState.status === ChallengeStatus.FAILED) {
      return true;
    }

    // Terminé si le temps maximum total est dépassé
    if (teamState.startTime) {
      const currentTime = Date.now();
      const elapsedTime = currentTime - teamState.startTime;
      if (elapsedTime > this.customConfig.maxTotalTime) {
        teamState.status = ChallengeStatus.FAILED;
        teamState.errors.push('Challenge timeout - maximum time exceeded');
        return true;
      }
    }

    // Terminé si tous les tours requis sont effectués
    return Object.keys(teamState.lapTimes).length >= this.customConfig.requiredLaps;
  }

  /**
   * Nettoie après la fin du challenge
   */
  async cleanup(team: Team): Promise<void> {
    const teamState = this.teamStates.get(team.id);
    if (teamState) {
      // Log final du résultat
      console.log(`🧹 Nettoyage pour l'équipe ${team.name}:`);
      console.log(`   - Tours effectués: ${Object.keys(teamState.lapTimes).length}/${this.customConfig.requiredLaps}`);
      console.log(`   - Meilleur tour: ${teamState.bestLapTime ? (teamState.bestLapTime / 1000).toFixed(3) + 's' : 'N/A'}`);
      console.log(`   - Temps total: ${teamState.totalTime ? (teamState.totalTime / 1000).toFixed(3) + 's' : 'N/A'}`);
      console.log(`   - Erreurs: ${teamState.errors.length}`);

      // Conserver les données pour les statistiques finales
      // mais marquer comme nettoyé
      teamState.status = teamState.status === ChallengeStatus.IN_PROGRESS
        ? ChallengeStatus.FAILED
        : teamState.status;
    }
  }

  /**
   * Obtient les résultats détaillés pour une équipe
   */
  async getDetailedResult(team: Team): Promise<ChallengeResult | null> {
    const teamState = this.teamStates.get(team.id);
    if (!teamState) {
      return null;
    }

    const result: ChallengeResult = {
      teamId: team.id,
      challengeId: this.config.id,
      runNumber: 1, // Pour ce challenge, on assume un seul run par équipe
      startTime: teamState.startTime || 0,
      endTime: teamState.startTime && teamState.totalTime
        ? teamState.startTime + teamState.totalTime
        : undefined,
      laps: teamState.lapTimes,
      totalTime: teamState.totalTime || undefined,
      bestLap: teamState.bestLapTime || undefined,
      averageTime: Object.keys(teamState.lapTimes).length > 0
        ? Object.values(teamState.lapTimes).reduce((sum, time) => sum + time, 0) / Object.keys(teamState.lapTimes).length
        : undefined,
      status: teamState.status,
      errors: teamState.errors
    };

    return result;
  }

  /**
   * Obtient l'état actuel de toutes les équipes
   */
  getAllTeamStates(): Record<string, TronLegacyTeamState> {
    const states: Record<string, TronLegacyTeamState> = {};
    for (const [teamId, state] of this.teamStates.entries()) {
      states[teamId] = { ...state };
    }
    return states;
  }

  /**
   * Réinitialise le challenge (utile pour les tests)
   */
  reset(): void {
    this.teamStates.clear();
    console.log('🔄 Challenge Tron Legacy réinitialisé');
  }
}

// Export par défaut de la classe
export default TronLegacyCircuitChallenge;
