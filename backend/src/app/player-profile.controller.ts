import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  HttpException,
  HttpStatus,
  UseGuards,
  Param
} from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PlayerProfileService } from './player-profile.service';
import { SubmitProfileDto, validateProfile } from '@wizard-console/challenge';

/**
 * Contrôleur pour la gestion des profils joueurs
 */
@Controller('player-profile')
export class PlayerProfileController {
  constructor(
    private readonly playerProfileService: PlayerProfileService
  ) {}

  /**
   * GET /api/player-profile/status
   * Vérifie si le challenge est ouvert
   */
  @Get('status')
  getStatus() {
    try {
      const isOpen = this.playerProfileService.isOpen();

      return {
        success: true,
        data: {
          isOpen,
          message: isOpen
            ? 'Le challenge est ouvert, vous pouvez remplir votre profil'
            : 'Le challenge est fermé'
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la vérification du statut: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/player-profile/open
   * Ouvre le challenge (admin uniquement)
   */
  @UseGuards(JwtAuthGuard)
  @Post('open')
  async openChallenge(@Request() req: any) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 'admin') {
        throw new HttpException(
          'Seuls les administrateurs peuvent ouvrir le challenge',
          HttpStatus.FORBIDDEN
        );
      }

      const result = await this.playerProfileService.openChallenge();

      return {
        success: true,
        data: result
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de l'ouverture du challenge: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/player-profile/close
   * Ferme le challenge (admin uniquement)
   */
  @UseGuards(JwtAuthGuard)
  @Post('close')
  async closeChallenge(@Request() req: any) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 'admin') {
        throw new HttpException(
          'Seuls les administrateurs peuvent fermer le challenge',
          HttpStatus.FORBIDDEN
        );
      }

      const result = await this.playerProfileService.closeChallenge();

      return {
        success: true,
        data: result
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la fermeture du challenge: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/player-profile/submit
   * Soumet ou met à jour le profil de l'utilisateur connecté
   */
  @UseGuards(JwtAuthGuard)
  @Post('submit')
  async submitProfile(@Request() req: any, @Body() profileData: SubmitProfileDto) {
    try {
      const userId = req.user.sub || req.user.email;
      const email = req.user.email;

      if (!userId || !email) {
        throw new HttpException(
          'Utilisateur non identifié',
          HttpStatus.UNAUTHORIZED
        );
      }

      // Valider les données avec la lib partagée
      const validation = validateProfile({
        name: profileData.name,
        skills: profileData.skills,
        preferredRole: profileData.preferredRole,
        motivation: profileData.motivation
      });

      if (!validation.valid) {
        throw new HttpException(
          `Données invalides: ${validation.errors.join(', ')}`,
          HttpStatus.BAD_REQUEST
        );
      }

      const profile = await this.playerProfileService.submitProfile(
        userId,
        email,
        profileData
      );

      return {
        success: true,
        data: {
          profile,
          message: 'Profil enregistré avec succès'
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la soumission du profil: ${error.message || error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/player-profile/me
   * Récupère le profil de l'utilisateur connecté
   */
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Request() req: any) {
    try {
      const userId = req.user.sub || req.user.email;

      if (!userId) {
        throw new HttpException(
          'Utilisateur non identifié',
          HttpStatus.UNAUTHORIZED
        );
      }

      const profile = await this.playerProfileService.getProfile(userId);

      if (!profile) {
        return {
          success: true,
          data: {
            profile: null,
            message: 'Aucun profil trouvé'
          }
        };
      }

      return {
        success: true,
        data: {
          profile
        }
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération du profil: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/player-profile/me/enriched
   * Récupère le profil enrichi (avec classe, suggestions, etc.)
   */
  @UseGuards(JwtAuthGuard)
  @Get('me/enriched')
  async getMyEnrichedProfile(@Request() req: any) {
    try {
      const userId = req.user.sub || req.user.email;

      if (!userId) {
        throw new HttpException(
          'Utilisateur non identifié',
          HttpStatus.UNAUTHORIZED
        );
      }

      const enrichedProfile = await this.playerProfileService.getEnrichedProfile(userId);

      if (!enrichedProfile) {
        return {
          success: true,
          data: {
            profile: null,
            message: 'Aucun profil trouvé'
          }
        };
      }

      return {
        success: true,
        data: enrichedProfile
      };
    } catch (error) {
      throw new HttpException(
        `Erreur lors de la récupération du profil enrichi: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/player-profile/all
   * Récupère tous les profils (admin uniquement)
   */
  @UseGuards(JwtAuthGuard)
  @Get('all')
  async getAllProfiles(@Request() req: any) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 'admin') {
        throw new HttpException(
          'Seuls les administrateurs peuvent voir tous les profils',
          HttpStatus.FORBIDDEN
        );
      }

      const profiles = await this.playerProfileService.getAllProfiles();

      return {
        success: true,
        data: {
          profiles,
          count: profiles.length
        }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération des profils: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/player-profile/stats
   * Récupère les statistiques des profils (admin uniquement)
   */
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  async getProfileStats(@Request() req: any) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 'admin') {
        throw new HttpException(
          'Seuls les administrateurs peuvent voir les statistiques',
          HttpStatus.FORBIDDEN
        );
      }

      const stats = await this.playerProfileService.getProfileStats();

      return {
        success: true,
        data: stats
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération des statistiques: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/player-profile/:userId
   * Récupère le profil d'un utilisateur spécifique (admin uniquement)
   */
  @UseGuards(JwtAuthGuard)
  @Get(':userId')
  async getProfileByUserId(@Request() req: any, @Param('userId') userId: string) {
    try {
      // Vérifier que l'utilisateur est admin
      if (req.user.role !== 'admin') {
        throw new HttpException(
          'Seuls les administrateurs peuvent voir les profils des autres',
          HttpStatus.FORBIDDEN
        );
      }

      const profile = await this.playerProfileService.getProfile(userId);

      if (!profile) {
        throw new HttpException(
          `Profil non trouvé pour l'utilisateur ${userId}`,
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: { profile }
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Erreur lors de la récupération du profil: ${error}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
