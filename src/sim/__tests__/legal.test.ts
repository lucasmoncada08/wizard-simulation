import { describe, it, expect } from 'vitest';
import { Card, WizardCard, JesterCard, type GameCard } from '../../core/cards';
import { getLegalPlays } from '../../index';

const sortByIdentity = (cards: GameCard[]): string[] =>
  cards.map((c) => {
    if (c.isWizard()) return 'W';
    if (c.isJester()) return 'J';
    const rc = c as import('../core/cards').Card;
    return `${rc.suit}${rc.rank}`;
  });

describe('getLegalPlays', () => {
  it('returns all cards when no card led (undefined ledSuit)', () => {
    const hand = [
      new Card('♠', 10),
      new Card('♥', 3),
      new WizardCard(),
      new JesterCard(),
    ];

    const legal = getLegalPlays(hand, undefined);
    expect(legal).toHaveLength(hand.length);
    expect(sortByIdentity(legal)).toEqual(sortByIdentity(hand));
  });

  it('when ledSuit present and hand contains that suit: only those cards + wizards + jesters', () => {
    const hand = [
      new Card('♠', 10),
      new Card('♠', 3),
      new Card('♥', 7),
      new WizardCard(),
      new JesterCard(),
    ];

    const legal = getLegalPlays(hand, '♠');

    // Expect both spades + both special cards
    expect(sortByIdentity(legal)).toEqual(
      sortByIdentity([hand[0], hand[1], hand[3], hand[4]])
    );
  });

  it('when ledSuit present and no card of that suit: all cards legal', () => {
    const hand = [
      new Card('♥', 10),
      new Card('♦', 3),
      new JesterCard(),
      new WizardCard(),
    ];

    const legal = getLegalPlays(hand, '♣');
    expect(sortByIdentity(legal)).toEqual(sortByIdentity(hand));
  });

  it('ledSuit present, only wizards/jesters in hand: all cards legal', () => {
    const hand = [new WizardCard(), new JesterCard()];
    const legal = getLegalPlays(hand, '♦');
    expect(sortByIdentity(legal)).toEqual(sortByIdentity(hand));
  });

  it('ledSuit present, mix without the suit but includes wizard and jester: still all cards', () => {
    const hand = [
      new Card('♥', 9),
      new Card('♦', 12),
      new WizardCard(),
      new JesterCard(),
    ];
    const legal = getLegalPlays(hand, '♣');
    expect(sortByIdentity(legal)).toEqual(sortByIdentity(hand));
  });

  it('ledSuit present, has suit plus wizard/jester: includes suit cards and special cards only', () => {
    const hand = [
      new Card('♣', 2),
      new Card('♣', 14),
      new Card('♦', 5),
      new WizardCard(),
      new JesterCard(),
    ];
    const legal = getLegalPlays(hand, '♣');
    expect(sortByIdentity(legal)).toEqual(
      sortByIdentity([hand[0], hand[1], hand[3], hand[4]])
    );
  });
});
