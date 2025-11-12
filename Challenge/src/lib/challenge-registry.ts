import { BaseChallenge, ChallengeConfig, Team } from './challenge';

/**
 * Exception levée lors d'erreurs dans le registry des challenges
 */
export class ChallengeRegistryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ChallengeRegistryError';
  }
}

/**
 * Factory function pour créer une instance de challenge
 */
export type ChallengeFactory = () => BaseChallenge;

/**
 * Métadonnées d'enregistrement d'un challenge
 */
export interface ChallengeRegistration {
  /** Instance du challenge */
  challenge: BaseChallenge;
  /** Factory pour créer de nouvelles instances */
  factory: ChallengeFactory;
  /** Version du challenge */
  version: string;
  /** Auteur du challenge */
  author?: string;
  /** Date d'enregistrement */
  registeredAt: Date;
  /** Tags pour la recherche et classification */
  tags?: string[];
}

/**
 * Événements émis par le registry
 */
export interface ChallengeRegistryEvents {
  'challenge-registered': { challengeId: string; registration: ChallengeRegistration };
  'challenge-unregistered': { challengeId: string };
  'challenge-started': { challengeId: string; teamId: string };
  'challenge-completed': { challengeId: string; teamId: string };
}

/**
 * Listener pour les événements du registry
 */
export type ChallengeRegistryEventListener<K extends keyof ChallengeRegistryEvents> =
  (event: ChallengeRegistryEvents[K]) => void;

/**
 * Registry centralisé pour la gestion des challenges
 */
export class ChallengeRegistry {
  private static instance: ChallengeRegistry;
  private challenges = new Map<string, ChallengeRegistration>();
  private eventListeners = new Map<keyof ChallengeRegistryEvents, Set<ChallengeRegistryEventListener<any>>>();

  /**
   * Obtient l'instance singleton du registry
   */
  static getInstance(): ChallengeRegistry {
    if (!ChallengeRegistry.instance) {
      ChallengeRegistry.instance = new ChallengeRegistry();
    }
    return ChallengeRegistry.instance;
  }

  /**
   * Enregistre un nouveau challenge dans le registry
   */
  register(
    challengeId: string,
    factory: ChallengeFactory,
    options: {
      version?: string;
      author?: string;
      tags?: string[];
    } = {}
  ): void {
    if (this.challenges.has(challengeId)) {
      throw new ChallengeRegistryError(
        `Challenge with ID '${challengeId}' is already registered`
      );
    }

    const challenge = factory();
    const registration: ChallengeRegistration = {
      challenge,
      factory,
      version: options.version || '1.0.0',
      author: options.author,
      registeredAt: new Date(),
      tags: options.tags || []
    };

    this.challenges.set(challengeId, registration);
    this.emit('challenge-registered', { challengeId, registration });

    console.log(`✅ Challenge '${challengeId}' registered successfully`);
  }

  /**
   * Désenregistre un challenge du registry
   */
  unregister(challengeId: string): boolean {
    if (!this.challenges.has(challengeId)) {
      return false;
    }

    this.challenges.delete(challengeId);
    this.emit('challenge-unregistered', { challengeId });

    console.log(`❌ Challenge '${challengeId}' unregistered`);
    return true;
  }

  /**
   * Obtient un challenge par son ID
   */
  getChallenge(challengeId: string): BaseChallenge | null {
    const registration = this.challenges.get(challengeId);
    return registration ? registration.challenge : null;
  }

  /**
   * Crée une nouvelle instance d'un challenge
   */
  createChallengeInstance(challengeId: string): BaseChallenge | null {
    const registration = this.challenges.get(challengeId);
    return registration ? registration.factory() : null;
  }

  /**
   * Obtient les métadonnées d'enregistrement d'un challenge
   */
  getRegistration(challengeId: string): ChallengeRegistration | null {
    return this.challenges.get(challengeId) || null;
  }

  /**
   * Obtient la liste de tous les challenges enregistrés
   */
  getAllChallenges(): { id: string; config: ChallengeConfig }[] {
    return Array.from(this.challenges.entries()).map(([id, registration]) => ({
      id,
      config: registration.challenge.getConfig()
    }));
  }

  /**
   * Recherche des challenges par tag
   */
  findByTag(tag: string): { id: string; config: ChallengeConfig }[] {
    return Array.from(this.challenges.entries())
      .filter(([, registration]) => registration.tags?.includes(tag))
      .map(([id, registration]) => ({
        id,
        config: registration.challenge.getConfig()
      }));
  }

  /**
   * Recherche des challenges par auteur
   */
  findByAuthor(author: string): { id: string; config: ChallengeConfig }[] {
    return Array.from(this.challenges.entries())
      .filter(([, registration]) => registration.author === author)
      .map(([id, registration]) => ({
        id,
        config: registration.challenge.getConfig()
      }));
  }

  /**
   * Vérifie si un challenge est enregistré
   */
  isRegistered(challengeId: string): boolean {
    return this.challenges.has(challengeId);
  }

  /**
   * Obtient le nombre total de challenges enregistrés
   */
  getCount(): number {
    return this.challenges.size;
  }

  /**
   * Vide complètement le registry (utile pour les tests)
   */
  clear(): void {
    const challengeIds = Array.from(this.challenges.keys());
    this.challenges.clear();
    this.eventListeners.clear();

    challengeIds.forEach(id => {
      this.emit('challenge-unregistered', { challengeId: id });
    });

    console.log('🧹 Challenge registry cleared');
  }

  /**
   * Ajoute un listener pour les événements du registry
   */
  on<K extends keyof ChallengeRegistryEvents>(
    event: K,
    listener: ChallengeRegistryEventListener<K>
  ): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  /**
   * Supprime un listener pour les événements du registry
   */
  off<K extends keyof ChallengeRegistryEvents>(
    event: K,
    listener: ChallengeRegistryEventListener<K>
  ): boolean {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      return listeners.delete(listener);
    }
    return false;
  }

  /**
   * Émet un événement vers tous les listeners
   */
  private emit<K extends keyof ChallengeRegistryEvents>(
    event: K,
    data: ChallengeRegistryEvents[K]
  ): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`Error in challenge registry event listener:`, error);
        }
      });
    }
  }

  /**
   * Valide qu'un challenge respecte les interfaces requises
   */
  validateChallenge(challenge: BaseChallenge): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      const config = challenge.getConfig();

      if (!config.id || typeof config.id !== 'string') {
        errors.push('Challenge ID must be a non-empty string');
      }

      if (!config.name || typeof config.name !== 'string') {
        errors.push('Challenge name must be a non-empty string');
      }

      if (!config.description || typeof config.description !== 'string') {
        errors.push('Challenge description must be a non-empty string');
      }

      if (typeof config.hasCountdown !== 'boolean') {
        errors.push('Challenge hasCountdown must be a boolean');
      }

      // Vérifier que les méthodes abstraites sont implémentées
      const requiredMethods = [
        'canTeamParticipate',
        'prepareForTeam',
        'startChallenge',
        'processTelemetry',
        'calculateScore',
        'isCompleted',
        'cleanup'
      ];

      requiredMethods.forEach(method => {
        if (typeof (challenge as any)[method] !== 'function') {
          errors.push(`Challenge must implement method: ${method}`);
        }
      });

    } catch (error) {
      errors.push(`Error validating challenge: ${error}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Décorateur pour enregistrer automatiquement un challenge
 */
export function RegisterChallenge(options: {
  id?: string;
  version?: string;
  author?: string;
  tags?: string[];
} = {}) {
  return function <T extends { new (...args: any[]): BaseChallenge }>(
    challengeClass: T
  ): T {
    const registry = ChallengeRegistry.getInstance();

    // Utilise le nom de la classe comme ID si non spécifié
    const challengeId = options.id || challengeClass.name.toLowerCase().replace(/challenge$/, '');

    const factory = () => new challengeClass();

    // Enregistrement après un court délai pour s'assurer que la classe est complètement définie
    setTimeout(() => {
      try {
        registry.register(challengeId, factory, options);
      } catch (error) {
        console.error(`Failed to auto-register challenge '${challengeId}':`, error);
      }
    }, 0);

    return challengeClass;
  };
}

// Instance globale du registry (singleton)
export const challengeRegistry = ChallengeRegistry.getInstance();
