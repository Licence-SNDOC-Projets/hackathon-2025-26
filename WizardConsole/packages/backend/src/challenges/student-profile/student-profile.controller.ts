import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus, Query } from '@nestjs/common';
import { StudentProfileService } from './student-profile.service';

@Controller('student-profile')
export class StudentProfileController {
  constructor(private readonly studentProfileService: StudentProfileService) {}

  /**
   * Créer un nouveau profil étudiant
   */
  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  async createProfile(@Body() createDto: any): Promise<any> {
    console.log('🎓 Nouvelle demande de création profil:', createDto.email);
    return this.studentProfileService.createProfile(createDto);
  }

  /**
   * Compléter le questionnaire d'auto-évaluation
   */
  @Post(':studentId/questionnaire')
  @HttpCode(HttpStatus.OK)
  async completeQuestionnaire(
    @Param('studentId') studentId: string,
    @Body() assessmentDto: any
  ): Promise<any> {
    console.log('📋 Soumission questionnaire pour:', studentId);
    return this.studentProfileService.completeQuestionnaire(studentId, assessmentDto);
  }

  /**
   * Obtenir le profil d'un étudiant
   */
  @Get(':studentId')
  async getProfile(@Param('studentId') studentId: string): Promise<any> {
    return this.studentProfileService.getProfile(studentId);
  }

  /**
   * Obtenir le profil par email
   */
  @Get('by-email/:email')
  async getProfileByEmail(@Param('email') email: string): Promise<any> {
    return this.studentProfileService.getProfileByEmail(email);
  }

  /**
   * Vérifier si un étudiant a complété son questionnaire
   */
  @Get(':studentId/questionnaire/status')
  async getQuestionnaireStatus(@Param('studentId') studentId: string) {
    const completed = this.studentProfileService.hasCompletedQuestionnaire(studentId);
    return {
      studentId,
      questionnaireCompleted: completed,
      message: completed 
        ? 'Questionnaire déjà complété' 
        : 'Questionnaire en attente'
    };
  }

  /**
   * Lister tous les étudiants (pour l'arbitre)
   */
  @Get()
  async getAllStudents(@Query('role') role?: string): Promise<any> {
    if (role === 'arbitre') {
      return this.studentProfileService.getAllStudents();
    }
    
    return {
      message: 'Accès restreint - rôle arbitre requis',
      statusCode: 403
    };
  }

  /**
   * Obtenir les statistiques générales
   */
  @Get('stats/overview')
  async getStatistics() {
    return this.studentProfileService.getStatistics();
  }

  /**
   * Health check spécifique au module
   */
  @Get('health/check')
  @HttpCode(HttpStatus.OK)
  getHealth() {
    return {
      module: 'StudentProfile',
      status: 'OK',
      timestamp: new Date().toISOString(),
      features: {
        profileCreation: true,
        questionnaire: true,
        mqttIntegration: true,
        validation: true
      }
    };
  }
}