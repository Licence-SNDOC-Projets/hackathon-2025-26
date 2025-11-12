import { Injectable } from '@nestjs/common';

@Injectable()
export class TeamsService {
  private teams = [
    { name: 'alpha', displayName: 'Alpha Team', status: 'offline' },
    { name: 'beta', displayName: 'Beta Team', status: 'offline' },
    { name: 'gamma', displayName: 'Gamma Team', status: 'offline' },
    { name: 'delta', displayName: 'Delta Team', status: 'offline' },
  ];

  getAllTeams() {
    return this.teams;
  }

  getTeam(name: string) {
    return this.teams.find(team => team.name === name);
  }
}