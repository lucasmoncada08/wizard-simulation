import { describe, it, expect } from 'vitest';
import { TrickResolver, Trick } from '../trick';
import { Card, WizardCard, JesterCard } from '../cards';

describe('Trick Resolution', () => {
  it('should throw error for empty trick', () => {
    const resolver = new TrickResolver();
    const trick = new Trick([]);
    expect(() => resolver.resolveTrick(trick)).toThrow(
      'Cannot resolve empty trick'
    );
  });

  it('should make first wizard win', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new Card('♠', 13), // King of spades
        new WizardCard(), // Wizard
        new Card('♥', 14), // Ace of hearts
      ],
      '♠'
    );

    expect(resolver.resolveTrick(trick)).toBe(1); // Wizard wins
  });

  it('should make first wizard win even if multiple wizards', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new WizardCard(), // First wizard
        new WizardCard(), // Second wizard
        new Card('♠', 13), // King of spades
      ],
      '♠'
    );

    expect(resolver.resolveTrick(trick)).toBe(0); // First wizard wins
  });

  it('should make first jester win when all jesters', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new JesterCard(), // First jester
        new JesterCard(), // Second jester
        new JesterCard(), // Third jester
      ],
      '♠'
    );

    expect(resolver.resolveTrick(trick)).toBe(0); // First jester wins
  });

  it('should make highest trump win when no wizards', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new Card('♠', 10), // 10 of spades (trump)
        new Card('♥', 14), // Ace of hearts
        new Card('♠', 13), // King of spades (trump)
      ],
      '♥',
      '♠'
    );

    expect(resolver.resolveTrick(trick)).toBe(2); // King of spades wins
  });

  it('should make highest led suit win when no wizards or trump', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new Card('♥', 5), // 5 of hearts (led suit)
        new Card('♠', 13), // King of spades
        new Card('♥', 14), // Ace of hearts (led suit)
      ],
      '♥'
    );

    expect(resolver.resolveTrick(trick)).toBe(2); // Ace of hearts wins (rank 14 > rank 5)
  });

  it('should prioritize wizard over trump', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new Card('♠', 13), // King of spades (trump)
        new WizardCard(), // Wizard
        new Card('♥', 14), // Ace of hearts
      ],
      '♥',
      '♠'
    );

    expect(resolver.resolveTrick(trick)).toBe(1); // Wizard wins over trump
  });

  it('should prioritize wizard over led suit', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new Card('♥', 13), // King of hearts (led suit)
        new WizardCard(), // Wizard
        new Card('♠', 14), // Ace of spades
      ],
      '♥'
    );

    expect(resolver.resolveTrick(trick)).toBe(1); // Wizard wins over led suit
  });

  it('should prioritize trump over led suit', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new Card('♥', 13), // King of hearts (led suit)
        new Card('♠', 5), // 5 of spades (trump)
        new Card('♥', 14), // Ace of hearts (led suit)
      ],
      '♥',
      '♠'
    );

    expect(resolver.resolveTrick(trick)).toBe(1); // Trump wins over led suit
  });

  it('should make Ace the highest value in led suit', () => {
    const resolver = new TrickResolver();
    const trick = new Trick(
      [
        new Card('♥', 13), // King of hearts (led suit)
        new Card('♠', 5), // 5 of spades
        new Card('♥', 14), // Ace of hearts (led suit)
      ],
      '♥'
    );

    expect(resolver.resolveTrick(trick)).toBe(2); // Ace of hearts wins (rank 14 > rank 13)
  });
});
