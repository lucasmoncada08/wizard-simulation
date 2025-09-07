import { describe, it, expect } from 'vitest';
import { createRNG } from '../rng';
import { Deck, Card, WizardCard, JesterCard } from '../cards';

describe('Cards', () => {
  describe('Card classes', () => {
    it('should create regular card correctly', () => {
      const card = new Card('♠', 14);
      expect(card.suit).toBe('♠');
      expect(card.rank).toBe(14);
      expect(card.isWizard()).toBe(false);
      expect(card.isJester()).toBe(false);
      expect(card.isRegularCard()).toBe(true);
    });

    it('should create wizard card correctly', () => {
      const wizard = new WizardCard();
      expect(wizard.isWizard()).toBe(true);
      expect(wizard.isJester()).toBe(false);
      expect(wizard.isRegularCard()).toBe(false);
    });

    it('should create jester card correctly', () => {
      const jester = new JesterCard();
      expect(jester.isWizard()).toBe(false);
      expect(jester.isJester()).toBe(true);
      expect(jester.isRegularCard()).toBe(false);
    });
  });

  describe('Deck class', () => {
    it('should create a deck with 60 cards', () => {
      const deck = new Deck();
      expect(deck.cards).toHaveLength(60);
    });

    it('should have correct card distribution', () => {
      const deck = new Deck();
      const wizards = deck.cards.filter((card) => card.isWizard());
      const jesters = deck.cards.filter((card) => card.isJester());
      const regularCards = deck.cards.filter((card) => card.isRegularCard());

      expect(wizards).toHaveLength(4);
      expect(jesters).toHaveLength(4);
      expect(regularCards).toHaveLength(52);
    });

    it('should have all suits and ranks in regular cards', () => {
      const deck = new Deck();
      const regularCards = deck.cards.filter((card) =>
        card.isRegularCard()
      ) as Card[];

      const suits = new Set(regularCards.map((card) => card.suit));
      const ranks = new Set(regularCards.map((card) => card.rank));

      expect(suits).toEqual(new Set(['♠', '♥', '♦', '♣']));
      expect(ranks).toEqual(
        new Set([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14])
      );
    });

    it('should shuffle deterministically with same seed', () => {
      const deck = new Deck();
      const rng1 = createRNG(42);
      const rng2 = createRNG(42);

      const shuffled1 = deck.shuffle(rng1);
      const shuffled2 = deck.shuffle(rng2);

      expect(shuffled1.cards).toEqual(shuffled2.cards);
    });

    it('should shuffle differently with different seeds', () => {
      const deck = new Deck();
      const rng1 = createRNG(42);
      const rng2 = createRNG(43);

      const shuffled1 = deck.shuffle(rng1);
      const shuffled2 = deck.shuffle(rng2);

      expect(shuffled1.cards).not.toEqual(shuffled2.cards);
    });

    it('should preserve all cards after shuffle', () => {
      const deck = new Deck();
      const rng = createRNG(42);
      const shuffled = deck.shuffle(rng);

      expect(shuffled.cards).toHaveLength(deck.cards.length);
      expect(shuffled.cards.filter((card) => card.isWizard())).toHaveLength(4);
      expect(shuffled.cards.filter((card) => card.isJester())).toHaveLength(4);
      expect(
        shuffled.cards.filter((card) => card.isRegularCard())
      ).toHaveLength(52);
    });

    it('should deal correct number of cards per player', () => {
      const deck = new Deck();
      const numPlayers = 4;
      const round = 3;

      const hands = deck.dealCards(numPlayers, round);

      expect(hands).toHaveLength(numPlayers);
      hands.forEach((hand) => {
        expect(hand).toHaveLength(round);
      });
    });

    it('should deal cards in round-robin order', () => {
      const deck = new Deck();
      const numPlayers = 3;
      const round = 2;

      const hands = deck.dealCards(numPlayers, round);

      // First card should go to player 0, second to player 1, etc.
      expect(hands[0][0]).toBe(deck.cards[0]);
      expect(hands[1][0]).toBe(deck.cards[1]);
      expect(hands[2][0]).toBe(deck.cards[2]);
      expect(hands[0][1]).toBe(deck.cards[3]);
      expect(hands[1][1]).toBe(deck.cards[4]);
      expect(hands[2][1]).toBe(deck.cards[5]);
    });

    it('should have Ace as highest rank', () => {
      const deck = new Deck();
      const regularCards = deck.cards.filter((card) =>
        card.isRegularCard()
      ) as Card[];

      // Find the highest rank
      const highestRank = Math.max(...regularCards.map((card) => card.rank));
      expect(highestRank).toBe(14); // Ace should be highest

      // Find the lowest rank
      const lowestRank = Math.min(...regularCards.map((card) => card.rank));
      expect(lowestRank).toBe(2); // 2 should be lowest
    });
  });
});
