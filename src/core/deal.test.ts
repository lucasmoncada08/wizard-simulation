import { describe, it, expect } from 'vitest';
import { createRNG } from './rng';
import { Dealer } from './deal';

describe('Deal', () => {
  it('should deal correct number of cards per player', () => {
    const dealer = new Dealer();
    const rng = createRNG(42);
    const numPlayers = 4;
    const round = 3;
    
    const result = dealer.dealRound(numPlayers, round, rng);
    
    expect(result.hands).toHaveLength(numPlayers);
    result.hands.forEach(hand => {
      expect(hand).toHaveLength(round);
    });
  });

  it('should be deterministic with same seed', () => {
    const dealer = new Dealer();
    const rng1 = createRNG(42);
    const rng2 = createRNG(42);
    const numPlayers = 3;
    const round = 2;
    
    const result1 = dealer.dealRound(numPlayers, round, rng1);
    const result2 = dealer.dealRound(numPlayers, round, rng2);
    
    expect(result1.hands).toEqual(result2.hands);
    expect(result1.remainingDeck).toEqual(result2.remainingDeck);
  });

  it('should have different results with different seeds', () => {
    const dealer = new Dealer();
    const rng1 = createRNG(42);
    const rng2 = createRNG(43);
    const numPlayers = 3;
    const round = 2;
    
    const result1 = dealer.dealRound(numPlayers, round, rng1);
    const result2 = dealer.dealRound(numPlayers, round, rng2);
    
    expect(result1.hands).not.toEqual(result2.hands);
  });

  it('should validate correct deal', () => {
    const dealer = new Dealer();
    const rng = createRNG(42);
    const numPlayers = 4;
    const round = 3;
    
    const result = dealer.dealRound(numPlayers, round, rng);
    const isValid = dealer.validateDeal(result, numPlayers, round);
    
    expect(isValid).toBe(true);
  });

  it('should reject invalid deal with wrong number of players', () => {
    const dealer = new Dealer();
    const rng = createRNG(42);
    const numPlayers = 4;
    const round = 3;
    
    const result = dealer.dealRound(numPlayers, round, rng);
    const isValid = dealer.validateDeal(result, 3, round); // Wrong number of players
    
    expect(isValid).toBe(false);
  });

  it('should reject invalid deal with wrong round number', () => {
    const dealer = new Dealer();
    const rng = createRNG(42);
    const numPlayers = 4;
    const round = 3;
    
    const result = dealer.dealRound(numPlayers, round, rng);
    const isValid = dealer.validateDeal(result, numPlayers, 2); // Wrong round number
    
    expect(isValid).toBe(false);
  });

  it('should throw error for invalid parameters', () => {
    const dealer = new Dealer();
    const rng = createRNG(42);
    
    expect(() => dealer.dealRound(0, 3, rng)).toThrow('Number of players must be positive');
    expect(() => dealer.dealRound(4, 0, rng)).toThrow('Round number must be positive');
  });
});
