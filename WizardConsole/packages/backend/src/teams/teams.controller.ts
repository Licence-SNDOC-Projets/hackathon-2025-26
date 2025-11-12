import { Controller, Get, Param } from '@nestjs/common';
import { TeamsService } from './teams.service';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get()
  getAllTeams() {
    return this.teamsService.getAllTeams();
  }

  @Get(':name')
  getTeam(@Param('name') name: string) {
    const team = this.teamsService.getTeam(name);
    if (!team) {
      return { error: 'Team not found' };
    }
    return team;
  }
}