import { describe, it, expect } from 'vitest';
import {
  Card,
  JesterCard,
  WizardCard,
  type GameCard,
  type Suit,
} from '../core/cards';
import { createRNG, type RNG } from '../core/rng';
import { loadRules, type GameRules } from '../core/gameRules';
import { getLegalPlays } from '../sim/legal';
import { type Agent } from '../index';
import { randomAgent } from '../index';

function makeHand(): GameCard[] {
  return [
    new Card('♠', 10),
    new Card('♥', 7),
    new Card('♦', 12),
    new Card('♣', 4),
    new WizardCard(),
    new JesterCard(),
  ];
}

function cloneHand(hand: GameCard[]): GameCard[] {
  // Cards are immutable in this model; shallow copy is fine for safety in tests
  return hand.slice();
}

function makeCtx(
  overrides: Partial<{
    hand: GameCard[];
    ledSuit: Suit | undefined;
    rules: GameRules;
    rng: RNG;
  }> = {}
): { hand: GameCard[]; ledSuit: Suit | undefined; rules: GameRules; rng: RNG } {
  const rules = overrides.rules ?? loadRules('gameRules.yaml');
  return {
    hand: overrides.hand ?? makeHand(),
    ledSuit: overrides.ledSuit,
    rules,
    rng: overrides.rng ?? createRNG(123),
  };
}

describe('RandomAgent.bid', () => {
  it('returns integer in [0, hand.length]', () => {
    const agent: Agent = randomAgent;
    const hand = makeHand();
    const ctx = makeCtx({ hand, rng: createRNG(1) });
    const bid = agent.bid(ctx as never);
    expect(Number.isInteger(bid)).toBe(true);
    expect(bid).toBeGreaterThanOrEqual(0);
    expect(bid).toBeLessThanOrEqual(hand.length);
  });

  it('is deterministic with a fixed seed', () => {
    const agent: Agent = randomAgent;
    const hand = makeHand();
    const bid1 = agent.bid(makeCtx({ hand, rng: createRNG(42) }) as never);
    const bid2 = agent.bid(makeCtx({ hand, rng: createRNG(42) }) as never);
    expect(bid1).toBe(bid2);
  });
});

describe('RandomAgent.play', () => {
  it('picks uniformly from legal plays when a suit is led', () => {
    const agent: Agent = randomAgent;
    const hand = [
      new Card('♠', 2),
      new Card('♠', 14),
      new Card('♥', 9),
      new JesterCard(),
      new WizardCard(),
    ];
    const ledSuit: Suit = '♠';

    const ctx = makeCtx({ hand: cloneHand(hand), ledSuit, rng: createRNG(7) });
    const played = agent.play(ctx as never);

    const legal = getLegalPlays(hand, ledSuit);
    expect(legal).toContain(played);
  });

  it('when no suit is led, may pick any card from hand', () => {
    const agent: Agent = randomAgent;
    const hand = makeHand();
    const ctx = makeCtx({ hand, ledSuit: undefined, rng: createRNG(9) });
    const played = agent.play(ctx as never);
    expect(hand).toContain(played);
  });

  it('is deterministic with a fixed seed', () => {
    const agent: Agent = randomAgent;
    const hand = makeHand();
    const ctx1 = makeCtx({
      hand: cloneHand(hand),
      ledSuit: '♦',
      rng: createRNG(101),
    });
    const ctx2 = makeCtx({
      hand: cloneHand(hand),
      ledSuit: '♦',
      rng: createRNG(101),
    });
    const p1 = agent.play(ctx1 as never);
    const p2 = agent.play(ctx2 as never);
    expect(p1).toEqual(p2);
  });
});

describe('RandomAgent.chooseTrump', () => {
  it('when rules say dealerChooses, picks uniformly among suits (no NONE)', () => {
    const agent: Agent = randomAgent;
    const rules = loadRules('gameRules.yaml');
    expect(rules.trump.flip_interpretation.wizard).toBe('dealerChooses');

    const choice = agent.chooseTrump?.(
      makeCtx({ rules, rng: createRNG(2024) }) as never
    );
    const allowed: Suit[] = ['♠', '♥', '♦', '♣'];
    expect(choice === undefined ? false : allowed.includes(choice)).toBe(true);
  });

  it('is deterministic with a fixed seed', () => {
    const agent: Agent = randomAgent;
    const rules = loadRules('gameRules.yaml');
    expect(rules.trump.flip_interpretation.wizard).toBe('dealerChooses');

    const c1 = agent.chooseTrump?.(
      makeCtx({ rules, rng: createRNG(777) }) as never
    );
    const c2 = agent.chooseTrump?.(
      makeCtx({ rules, rng: createRNG(777) }) as never
    );
    expect(c1).toEqual(c2);
  });
});
