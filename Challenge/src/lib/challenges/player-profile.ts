import {
  BaseChallenge,
  ChallengeConfig,
  ChallengeResult,
  ChallengeStatus,
  Team
} from '../challenge';
import { RegisterChallenge } from '../challenge-registry';
import {
  PlayerProfile,
  validateProfile,
  isValidSkillLevel
} from '../player-profile-types';

/**
 * État du profil pour une "équipe" (en fait un étudiant individuel)
 */
interface PlayerProfileState {
  profile: PlayerProfile | null;
  status: ChallengeStatus;
  submittedAt: number | null;
}

/**
 * Challenge "Profil Joueur"
 *
 * Premier challenge du hackathon permettant aux étudiants de créer leur
 * profil de joueur avec auto-évaluation de leurs compétences.
 * Un diagramme radar visualise leurs forces et faiblesses.
 *
 * Note: Ce challenge est individuel (un profil par étudiant), mais utilise
 * le système d'équipes pour la compatibilité avec le framework.
 */
@RegisterChallenge({
  id: 'player-profile',
  version: '1.0.0',
  author: 'WizardConsole Team',
  tags: ['onboarding', 'profil', 'équipe', 'compétences', 'auto-évaluation']
})
export class PlayerProfileChallenge extends BaseChallenge {

  private playerStates = new Map<string, PlayerProfileState>();

  constructor() {
    const config: ChallengeConfig = {
      id: 'player-profile',
      name: '💾 Player.init() - Character Sheet',
      description: `Initialisez votre profil de hacker et déployez vos compétences !
        Créez votre character sheet avec une auto-évaluation de vos skills techniques,
        définissez votre class préférée et partagez votre XP. Un diagramme radar type RPG
        visualisera vos stats pour aider à builder les meilleures teams équilibrées.`,
      hasCountdown: false, // Pas de compte à rebours pour un formulaire
      customConfig: {
        maxSubmissions: 1,  // Une seule soumission par étudiant
        canModify: true,    // Peut modifier après soumission
        requiresValidation: false, // Auto-validé
        pointsForCompletion: 100
      }
    };

    super(config);
  }

  /**
   * Vérifie si une équipe (étudiant) peut participer au challenge
   */
  async canTeamParticipate(team: Team): Promise<boolean> {
    if (!team.id || !team.name) {
      return false;
    }

    // Le challenge doit être ouvert pour soumettre un nouveau profil
    if (!this.isOpen()) {
      const state = this.playerStates.get(team.id);
      // Mais on peut voir son profil même si fermé
      return state !== undefined;
    }

    return true;
  }

  /**
   * Prépare le challenge pour une équipe (étudiant)
   */
  async prepareForTeam(team: Team): Promise<void> {
    if (!this.playerStates.has(team.id)) {
      const initialState: PlayerProfileState = {
        profile: null,
        status: ChallengeStatus.WAITING,
        submittedAt: null
      };
      this.playerStates.set(team.id, initialState);
    }
    console.log(`📝 Challenge Profil Joueur préparé pour ${team.name}`);
  }

  /**
   * Démarre le challenge (ouvre le formulaire)
   */
  async startChallenge(team: Team): Promise<void> {
    const state = this.playerStates.get(team.id);
    if (!state) {
      throw new Error(`Player ${team.id} not prepared for challenge`);
    }

    if (!this.isOpen() && !state.profile) {
      throw new Error('Challenge is closed for new submissions');
    }

    state.status = ChallengeStatus.IN_PROGRESS;
    console.log(`🚀 ${team.name} commence à remplir son profil`);
  }

  /**
   * Soumet ou met à jour un profil joueur
   */
  async submitProfile(team: Team, profile: Partial<PlayerProfile>): Promise<void> {
    const state = this.playerStates.get(team.id);
    if (!state) {
      throw new Error(`Player ${team.id} not prepared`);
    }

    // Valider le profil
    const validation = this.validateProfile(profile);
    if (!validation.valid) {
      throw new Error(`Invalid profile: ${validation.errors.join(', ')}`);
    }

    // Créer ou mettre à jour le profil
    const now = new Date();
    const fullProfile: PlayerProfile = {
      userId: team.id,
      email: profile.email || '',
      name: profile.name!,
      skills: profile.skills!,
      preferredRole: profile.preferredRole!,
      motivation: profile.motivation!,
      createdAt: state.profile?.createdAt || now,
      updatedAt: now,
      isComplete: true
    };

    state.profile = fullProfile;
    state.status = ChallengeStatus.COMPLETED;
    state.submittedAt = Date.now();

    console.log(`✅ Profil de ${team.name} enregistré avec succès`);
  }

  /**
   * Récupère le profil d'un joueur
   */
  async getProfile(team: Team): Promise<PlayerProfile | null> {
    const state = this.playerStates.get(team.id);
    return state?.profile || null;
  }

  /**
   * Traite les données de télémétrie (non utilisé pour ce challenge)
   */
  async processTelemetry(team: Team, data: any): Promise<void> {
    // Ce challenge n'utilise pas de télémétrie MQTT
    return;
  }

  /**
   * Calcule le score (points fixes pour complétion)
   */
  async calculateScore(result: ChallengeResult): Promise<number> {
    if (result.status !== ChallengeStatus.COMPLETED) {
      return 0;
    }

    const config = this.config.customConfig as any;
    return config.pointsForCompletion || 100;
  }

  /**
   * Vérifie si le challenge est terminé
   */
  async isCompleted(team: Team): Promise<boolean> {
    const state = this.playerStates.get(team.id);
    return state ? state.status === ChallengeStatus.COMPLETED : false;
  }

  /**
   * Nettoie après la fin du challenge
   */
  async cleanup(team: Team): Promise<void> {
    // On garde les profils en mémoire, pas de nettoyage nécessaire
    console.log(`🧹 Nettoyage profil de ${team.name} (profil conservé)`);
  }

  /**
   * Valide un profil joueur
   */
  validateProfile(profile: Partial<PlayerProfile>): { valid: boolean; errors: string[] } {
    // Utiliser la validation partagée
    return validateProfile(profile);
  }

  /**
   * Calcule un score global basé sur les compétences
   */
  calculateOverallScore(profile: PlayerProfile): number {
    const skillsTotal =
      profile.skills.development +
      profile.skills.electronics +
      profile.skills.iot +
      profile.skills.mechanics;

    const skillsScore = (skillsTotal / 20) * 70; // 70% basé sur les compétences
    const motivationScore = (profile.motivation.energyLevel / 5) * 30; // 30% basé sur l'énergie

    return Math.round(skillsScore + motivationScore);
  }

  /**
   * Identifie le profil dominant du joueur
   */
  identifyPlayerClass(profile: PlayerProfile): string {
    const { development, electronics, iot, mechanics } = profile.skills;

    // Trouver la compétence la plus forte
    const maxSkill = Math.max(development, electronics, iot, mechanics);

    if (development === maxSkill && development >= 4) {
      return '💻 Maître du Code';
    } else if (electronics === maxSkill && electronics >= 4) {
      return '⚡ Sorcier de l\'Électronique';
    } else if (iot === maxSkill && iot >= 4) {
      return '📡 Expert IoT';
    } else if (mechanics === maxSkill && mechanics >= 4) {
      return '🔧 Génie Mécanique';
    } else if (development >= 3 && electronics >= 3) {
      return '🎯 Hacker Full Stack';
    } else if (iot >= 3 && development >= 3) {
      return '🌐 Architecte Connecté';
    } else {
      return '🎮 Joueur Polyvalent';
    }
  }

  /**
   * Génère des suggestions pour améliorer le profil
   */
  generateSuggestions(profile: PlayerProfile): string[] {
    const suggestions: string[] = [];
    const { development, electronics, iot, mechanics } = profile.skills;

    if (development < 3 && electronics < 3) {
      suggestions.push('💡 Conseil : Renforce tes compétences en développement ou électronique pour devenir plus polyvalent');
    }

    if (iot < 2) {
      suggestions.push('📡 N\'oublie pas d\'explorer MQTT et les protocoles IoT pendant le hackathon !');
    }

    if (mechanics < 2 && (development >= 3 || electronics >= 3)) {
      suggestions.push('🔧 Ta force est dans le code et l\'électronique, mais pense à collaborer sur la partie mécanique');
    }

    if (profile.motivation.energyLevel >= 4) {
      suggestions.push('🔋 Ton énergie est un atout ! Utilise-la pour motiver ton équipe');
    }

    return suggestions;
  }

  /**
   * Obtient tous les profils (pour l'admin)
   */
  getAllProfiles(): PlayerProfile[] {
    return Array.from(this.playerStates.values())
      .filter(state => state.profile !== null)
      .map(state => state.profile!);
  }

  /**
   * Réinitialise le challenge
   */
  reset(): void {
    this.playerStates.clear();
    this.close(); // Utilise la méthode héritée
    console.log('🔄 Challenge Profil Joueur réinitialisé');
  }
}

// Export par défaut
export default PlayerProfileChallenge;
