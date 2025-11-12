import { Injectable } from '@nestjs/common';

@Injectable()
export class ChallengesService {
  private challenges = [
    { name: 'speedrun', displayName: 'Tron Legacy Circuit', isActive: false },
    { name: 'wiggle', displayName: 'Wiggle Protocol', isActive: false },
    { name: 'crash', displayName: 'Schrödinger\'s Crash', isActive: false },
    { name: 'localhost-track', displayName: 'Localhost:Track', isActive: false },
    { name: 'pimp-my-bot', displayName: 'Pimp My Bot', isActive: false },
  ];

  getAllChallenges() {
    return this.challenges;
  }

  getChallenge(name: string) {
    return this.challenges.find(challenge => challenge.name === name);
  }
}