export interface ScoreResult {
  score: number;
  exact: boolean;
}

export interface ScoringRules {
  exact: string;
  miss_penalty_per_trick: number;
}

export class Scorer {
  constructor(private readonly rules: ScoringRules) {}

  calculateScore(bid: number, tricks: number): ScoreResult {
    if (bid === tricks) {
      // Exact bid: 20 + 10*bid
      const score = 20 + 10 * bid;
      return { score, exact: true };
    } else {
      // Missed bid: -10 * |difference|
      const difference = Math.abs(bid - tricks);
      const score = this.rules.miss_penalty_per_trick * difference;
      return { score, exact: false };
    }
  }

  calculateRoundScores(bids: number[], tricks: number[]): ScoreResult[] {
    if (bids.length !== tricks.length) {
      throw new Error('Bids and tricks arrays must have the same length');
    }
    
    return bids.map((bid, index) => this.calculateScore(bid, tricks[index]));
  }

  sumScores(scores: ScoreResult[]): number {
    return scores.reduce((sum, result) => sum + result.score, 0);
  }
}
