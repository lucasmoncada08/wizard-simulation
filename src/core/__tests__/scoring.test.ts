import { describe, it, expect } from 'vitest';
import { Scorer, type ScoreResult } from './scoring';

describe('Scoring', () => {
  const rules = {
    exact: '20 + 10*bid',
    miss_penalty_per_trick: -10,
  };

  describe('calculateScore', () => {
    it('should give exact bid bonus', () => {
      const scorer = new Scorer(rules);
      const result = scorer.calculateScore(3, 3);
      expect(result.score).toBe(50); // 20 + 10*3
      expect(result.exact).toBe(true);
    });

    it('should give penalty for overbidding', () => {
      const scorer = new Scorer(rules);
      const result = scorer.calculateScore(3, 1);
      expect(result.score).toBe(-20); // -10 * |3-1|
      expect(result.exact).toBe(false);
    });

    it('should give penalty for underbidding', () => {
      const scorer = new Scorer(rules);
      const result = scorer.calculateScore(1, 3);
      expect(result.score).toBe(-20); // -10 * |1-3|
      expect(result.exact).toBe(false);
    });

    it('should handle zero bid correctly', () => {
      const scorer = new Scorer(rules);
      const result = scorer.calculateScore(0, 0);
      expect(result.score).toBe(20); // 20 + 10*0
      expect(result.exact).toBe(true);
    });

    it('should handle high bid correctly', () => {
      const scorer = new Scorer(rules);
      const result = scorer.calculateScore(10, 10);
      expect(result.score).toBe(120); // 20 + 10*10
      expect(result.exact).toBe(true);
    });
  });

  describe('calculateRoundScores', () => {
    it('should calculate scores for all players', () => {
      const scorer = new Scorer(rules);
      const bids = [2, 1, 3, 0];
      const tricks = [2, 1, 2, 0];

      const results = scorer.calculateRoundScores(bids, tricks);

      expect(results).toHaveLength(4);
      expect(results[0]).toEqual({ score: 40, exact: true }); // 20 + 10*2
      expect(results[1]).toEqual({ score: 30, exact: true }); // 20 + 10*1
      expect(results[2]).toEqual({ score: -10, exact: false }); // -10 * |3-2|
      expect(results[3]).toEqual({ score: 20, exact: true }); // 20 + 10*0
    });

    it('should throw error for mismatched arrays', () => {
      const scorer = new Scorer(rules);
      const bids = [1, 2, 3];
      const tricks = [1, 2];

      expect(() => scorer.calculateRoundScores(bids, tricks)).toThrow(
        'Bids and tricks arrays must have the same length'
      );
    });
  });

  describe('sumScores', () => {
    it('should sum all scores correctly', () => {
      const scorer = new Scorer(rules);
      const scores: ScoreResult[] = [
        { score: 40, exact: true },
        { score: -10, exact: false },
        { score: 30, exact: true },
        { score: -20, exact: false },
      ];

      const total = scorer.sumScores(scores);
      expect(total).toBe(40); // 40 + (-10) + 30 + (-20)
    });

    it('should return zero for empty array', () => {
      const scorer = new Scorer(rules);
      const total = scorer.sumScores([]);
      expect(total).toBe(0);
    });

    it('should handle negative totals', () => {
      const scorer = new Scorer(rules);
      const scores: ScoreResult[] = [
        { score: -30, exact: false },
        { score: -20, exact: false },
        { score: -10, exact: false },
      ];

      const total = scorer.sumScores(scores);
      expect(total).toBe(-60);
    });
  });
});
