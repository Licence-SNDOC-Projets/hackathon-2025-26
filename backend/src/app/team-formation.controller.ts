import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { TeamFormationService } from './team-formation.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import type { TeamInfo, TeamProfile, BacklogPlayer } from '@wizard-console/challenge';
import type { PlayerProfile } from '@wizard-console/challenge';

/**
 * DTO pour la création d'équipe
 */
interface CreateTeamDto {
  teamName: string;
  userProfile: PlayerProfile;
}

/**
 * DTO pour rejoindre une équipe
 */
interface JoinTeamDto {
  userProfile: PlayerProfile;
}

/**
 * Contrôleur pour la gestion de la formation d'équipes
 */
@Controller('team-formation')
export class TeamFormationController {
  private readonly logger = new Logger(TeamFormationController.name);

  constructor(private readonly teamFormationService: TeamFormationService) {}

  /**
   * GET /api/team-formation/status
   * Vérifie si le challenge est ouvert
   */
  @Get('status')
  @UseGuards(JwtAuthGuard)
  getStatus(@Request() req: any) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      return {
        success: true,
        data: {
          isOpen,
          challengeId: 'team-formation',
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      this.logger.error('Error checking challenge status:', error);
      throw new HttpException(
        'Failed to check challenge status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/team-formation/open
   * Ouvre le challenge (admin uniquement)
   */
  @Post('open')
  @UseGuards(JwtAuthGuard)
  async openChallenge(@Request() req: any) {
    try {
      // TODO: Vérifier que l'utilisateur est admin
      const result = await this.teamFormationService.openChallenge();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error opening challenge:', error);
      throw new HttpException(
        'Failed to open challenge',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/team-formation/close
   * Ferme le challenge (admin uniquement)
   */
  @Post('close')
  @UseGuards(JwtAuthGuard)
  async closeChallenge(@Request() req: any) {
    try {
      // TODO: Vérifier que l'utilisateur est admin
      const result = await this.teamFormationService.closeChallenge();

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.logger.error('Error closing challenge:', error);
      throw new HttpException(
        'Failed to close challenge',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/team-formation/teams
   * Récupère toutes les équipes
   */
  @Get('teams')
  @UseGuards(JwtAuthGuard)
  getAllTeams(@Request() req: any) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      if (!isOpen) {
        throw new HttpException(
          'Le challenge n\'est pas encore ouvert',
          HttpStatus.FORBIDDEN
        );
      }

      const teams = this.teamFormationService.getAllTeams();

      return {
        success: true,
        data: {
          teams,
          count: teams.length,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error getting teams:', error);
      throw new HttpException(
        'Failed to get teams',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/team-formation/teams/:teamId
   * Récupère une équipe spécifique
   */
  @Get('teams/:teamId')
  @UseGuards(JwtAuthGuard)
  getTeam(@Param('teamId') teamId: string, @Request() req: any) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      if (!isOpen) {
        throw new HttpException(
          'Le challenge n\'est pas encore ouvert',
          HttpStatus.FORBIDDEN
        );
      }

      const team = this.teamFormationService.getTeam(teamId);

      if (!team) {
        throw new HttpException(
          'Équipe non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: { team },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error getting team ${teamId}:`, error);
      throw new HttpException(
        'Failed to get team',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/team-formation/teams/:teamId/profile
   * Récupère le profil agrégé d'une équipe
   */
  @Get('teams/:teamId/profile')
  @UseGuards(JwtAuthGuard)
  getTeamProfile(@Param('teamId') teamId: string, @Request() req: any) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      if (!isOpen) {
        throw new HttpException(
          'Le challenge n\'est pas encore ouvert',
          HttpStatus.FORBIDDEN
        );
      }

      const profile = this.teamFormationService.getTeamProfile(teamId);

      if (!profile) {
        throw new HttpException(
          'Équipe non trouvée',
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: { profile },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error getting team profile ${teamId}:`, error);
      throw new HttpException(
        'Failed to get team profile',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/team-formation/my-team
   * Récupère l'équipe de l'utilisateur connecté
   */
  @Get('my-team')
  @UseGuards(JwtAuthGuard)
  getMyTeam(@Request() req: any) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      if (!isOpen) {
        throw new HttpException(
          'Le challenge n\'est pas encore ouvert',
          HttpStatus.FORBIDDEN
        );
      }

      const userId = req.user.email;
      const team = this.teamFormationService.getUserTeam(userId);

      return {
        success: true,
        data: {
          team: team || null,
          hasTeam: !!team,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error getting user team:', error);
      throw new HttpException(
        'Failed to get user team',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * GET /api/team-formation/backlog
   * Récupère tous les joueurs sans équipe
   */
  @Get('backlog')
  @UseGuards(JwtAuthGuard)
  getBacklog(@Request() req: any) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      if (!isOpen) {
        throw new HttpException(
          'Le challenge n\'est pas encore ouvert',
          HttpStatus.FORBIDDEN
        );
      }

      const players = this.teamFormationService.getBacklogPlayers();

      return {
        success: true,
        data: {
          players,
          count: players.length,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error getting backlog:', error);
      throw new HttpException(
        'Failed to get backlog',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/team-formation/teams
   * Crée une nouvelle équipe
   */
  @Post('teams')
  @UseGuards(JwtAuthGuard)
  async createTeam(@Body() dto: CreateTeamDto, @Request() req: any) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      if (!isOpen) {
        throw new HttpException(
          'Le challenge n\'est pas encore ouvert',
          HttpStatus.FORBIDDEN
        );
      }

      if (!dto.teamName || !dto.userProfile) {
        throw new HttpException(
          'Nom d\'équipe et profil utilisateur requis',
          HttpStatus.BAD_REQUEST
        );
      }

      const userId = req.user.email;

      // Vérifier que l'utilisateur n'est pas déjà dans une équipe
      const existingTeam = this.teamFormationService.getUserTeam(userId);
      if (existingTeam) {
        throw new HttpException(
          'Vous êtes déjà membre d\'une équipe',
          HttpStatus.CONFLICT
        );
      }

      const team = await this.teamFormationService.createTeam(
        userId,
        dto.userProfile,
        dto.teamName
      );

      return {
        success: true,
        data: { team },
        message: `Équipe "${dto.teamName}" créée avec succès`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error creating team:', error);

      // Gestion des erreurs du challenge
      if (error instanceof Error) {
        if (error.message.includes('existe déjà')) {
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        }
        if (error.message.includes('invalide')) {
          throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
        }
      }

      throw new HttpException(
        'Failed to create team',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/team-formation/teams/:teamId/join
   * Rejoint une équipe
   */
  @Post('teams/:teamId/join')
  @UseGuards(JwtAuthGuard)
  async joinTeam(
    @Param('teamId') teamId: string,
    @Body() dto: JoinTeamDto,
    @Request() req: any
  ) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      if (!isOpen) {
        throw new HttpException(
          'Le challenge n\'est pas encore ouvert',
          HttpStatus.FORBIDDEN
        );
      }

      if (!dto.userProfile) {
        throw new HttpException(
          'Profil utilisateur requis',
          HttpStatus.BAD_REQUEST
        );
      }

      const userId = req.user.email;

      // Vérifier que l'utilisateur n'est pas déjà dans une équipe
      const existingTeam = this.teamFormationService.getUserTeam(userId);
      if (existingTeam) {
        throw new HttpException(
          'Vous êtes déjà membre d\'une équipe',
          HttpStatus.CONFLICT
        );
      }

      const team = await this.teamFormationService.joinTeam(
        userId,
        dto.userProfile,
        teamId
      );

      return {
        success: true,
        data: { team },
        message: `Vous avez rejoint l'équipe "${team.name}"`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error joining team:', error);

      // Gestion des erreurs du challenge
      if (error instanceof Error) {
        if (error.message.includes('n\'existe pas')) {
          throw new HttpException(error.message, HttpStatus.NOT_FOUND);
        }
        if (error.message.includes('complète')) {
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        }
        if (error.message.includes('déjà membre')) {
          throw new HttpException(error.message, HttpStatus.CONFLICT);
        }
      }

      throw new HttpException(
        'Failed to join team',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * POST /api/team-formation/leave
   * Quitte l'équipe actuelle
   */
  @Post('leave')
  @UseGuards(JwtAuthGuard)
  async leaveTeam(@Body() body: { userProfile: PlayerProfile }, @Request() req: any) {
    try {
      const isOpen = this.teamFormationService.isOpen();

      if (!isOpen) {
        throw new HttpException(
          'Le challenge n\'est pas encore ouvert',
          HttpStatus.FORBIDDEN
        );
      }

      if (!body.userProfile) {
        throw new HttpException(
          'Profil utilisateur requis',
          HttpStatus.BAD_REQUEST
        );
      }

      const userId = req.user.email;

      // Vérifier que l'utilisateur est dans une équipe
      const existingTeam = this.teamFormationService.getUserTeam(userId);
      if (!existingTeam) {
        throw new HttpException(
          'Vous n\'êtes membre d\'aucune équipe',
          HttpStatus.NOT_FOUND
        );
      }

      await this.teamFormationService.leaveTeam(userId, body.userProfile);

      return {
        success: true,
        data: null,
        message: `Vous avez quitté l'équipe "${existingTeam.name}"`,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error('Error leaving team:', error);

      throw new HttpException(
        'Failed to leave team',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
