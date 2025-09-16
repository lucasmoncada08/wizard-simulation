import { describe, it, expect } from 'vitest';
import {
  Card,
  WizardCard,
  JesterCard,
  type GameCard,
  type Suit,
} from '../../core/cards';
import { createRNG, type RNG } from '../../core/rng';
import { loadRules, type GameRules } from '../../core/gameRules';
import { type Agent } from '../../agents/types';
import { naiveAgent } from '../../agents/naiveAgent';

function makeCtx(hand: GameCard[], trumpSuit?: Suit): {
  hand: GameCard[];
  trumpSuit: Suit | undefined;
  rng: RNG;
  rules: GameRules;
} {
  const rules = loadRules('gameRules.yaml');
  return {
    hand,
    trumpSuit,
    rng: createRNG(123),
    rules,
  } as const;
}

describe('NaiveAgent.bid', () => {
  it('adds +1 per wizard', () => {
    const agent: Agent = naiveAgent;
    expect(agent.name).toBe('Naive Agent');
    const hand: GameCard[] = [
      new WizardCard(),
      new WizardCard(),
      new JesterCard(),
    ];
    const bid = agent.bid(makeCtx(hand) as never);
    expect(bid).toBe(2);
  });

  it('adds +1 per Ace or King', () => {
    const agent: Agent = naiveAgent;
    const hand: GameCard[] = [
      new Card('♠', 14),
      new Card('♥', 13),
      new JesterCard(),
    ];
    const bid = agent.bid(makeCtx(hand) as never);
    expect(bid).toBe(2);
  });

  it('ignores non AK regular cards and jesters', () => {
    const agent: Agent = naiveAgent;
    const hand: GameCard[] = [
      new Card('♠', 10),
      new Card('♥', 9),
      new JesterCard(),
    ];
    const bid = agent.bid(makeCtx(hand) as never);
    expect(bid).toBe(0);
  });

  it('combines wizard and AK counts', () => {
    const agent: Agent = naiveAgent;
    const hand: GameCard[] = [
      new WizardCard(),
      new Card('♠', 14),
      new Card('♥', 13),
      new Card('♦', 2),
    ];
    const bid = agent.bid(makeCtx(hand) as never);
    expect(bid).toBe(3);
  });

  it('with trumpSuit set, counts only Ace/King of trump suit (ignores others)', () => {
    const agent: Agent = naiveAgent;
    const hand: GameCard[] = [
      new Card('♠', 14), // Ace of trump
      new Card('♥', 13), // King off-suit
      new JesterCard(),
    ];
    const bid = agent.bid(makeCtx(hand, '♠') as never);
    expect(bid).toBe(1);
  });

  it('with trumpSuit set, Wizard still counts +1', () => {
    const agent: Agent = naiveAgent;
    const hand: GameCard[] = [
      new WizardCard(),
      new Card('♥', 14), // Ace off-suit, not trump
    ];
    const bid = agent.bid(makeCtx(hand, '♠') as never);
    expect(bid).toBe(1);
  });

  it('with trumpSuit set, AK off-suit are ignored', () => {
    const agent: Agent = naiveAgent;
    const hand: GameCard[] = [
      new Card('♥', 14),
      new Card('♦', 13),
      new JesterCard(),
    ];
    const bid = agent.bid(makeCtx(hand, '♠') as never);
    expect(bid).toBe(0);
  });
});

function willSpendIfWinning(
  hand: GameCard[],
  playsSoFar: GameCard[],
  led: Suit | undefined,
  trump: Suit | undefined
): GameCard {
  const agent: Agent = naiveAgent;
  return agent.play({
    ...makeCtx(hand),
    ledSuit: led,
    trumpSuit: trump,
    playsSoFar,
  } as never);
}

describe('NaiveAgent.play (spend winners only when they currently take the lead)', () => {
  it('when leading (no current winner), conserves winners and plays a non-winner', () => {
    const hand: GameCard[] = [
      new WizardCard(),
      new Card('♠', 14),
      new Card('♣', 2),
      new JesterCard(),
    ];
    const played = willSpendIfWinning(hand, [], undefined, undefined);
    // Should not spend Wizard or Ace when leading
    expect([hand[0], hand[1]]).not.toContain(played);
  });

  it('when following, plays Ace of led suit if it currently takes the lead', () => {
    const led: Suit = '♠';
    const playsSoFar: GameCard[] = [new Card('♠', 10)];
    const hand: GameCard[] = [
      new Card('♠', 14),
      new Card('♠', 7),
      new JesterCard(),
    ];
    const played = willSpendIfWinning(hand, playsSoFar, led, undefined);
    expect(played).toBe(hand[0]);
  });

  it('when following and current winner is Wizard, does not spend Wizard or AK', () => {
    const led: Suit = '♠';
    const playsSoFar: GameCard[] = [new WizardCard()];
    const hand: GameCard[] = [
      new WizardCard(),
      new Card('♠', 14),
      new JesterCard(),
      new Card('♠', 9),
    ];
    const played = willSpendIfWinning(hand, playsSoFar, led, undefined);
    // Should avoid spending Wizard or Ace since cannot beat a Wizard
    expect([hand[0], hand[1]]).not.toContain(played);
  });

  it('when following off-suit, off-suit AK that do not win are conserved', () => {
    const led: Suit = '♠';
    const playsSoFar: GameCard[] = [new Card('♠', 12)];
    const hand: GameCard[] = [
      new Card('♥', 14),
      new Card('♦', 13),
      new JesterCard(),
      new Card('♠', 7),
    ];
    const played = willSpendIfWinning(hand, playsSoFar, led, undefined);
    expect([hand[0], hand[1]]).not.toContain(played);
  });

  it('respects trump: will spend a Wizard to take the lead only if it wins', () => {
    const led: Suit = '♠';
    const playsSoFar: GameCard[] = [new Card('♠', 14)];
    const hand: GameCard[] = [new WizardCard(), new Card('♠', 2)];
    // Wizard always wins against non-wizard, so it should be played
    const played = willSpendIfWinning(hand, playsSoFar, led, '♥');
    expect(played).toBe(hand[0]);
  });
});
