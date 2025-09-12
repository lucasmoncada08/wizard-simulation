import { type Suit, type GameCard } from '../core/cards';
import { getLegalPlays } from '../sim/legal';
import {
  type Agent,
  type BidContext,
  type PlayContext,
  type ChooseTrumpContext,
} from './types';

export class RandomAgent implements Agent {
  constructor(public readonly name: string = 'Random Agent') {}

  bid(ctx: BidContext): number {
    const max = ctx.hand.length;
    return ctx.rng.nextIntWithinBounds(max + 1);
  }

  play(ctx: PlayContext): GameCard {
    const legalPlays = getLegalPlays(ctx.hand, ctx.ledSuit);
    const index = RandomAgent.pickUniformIndex(ctx, legalPlays.length);
    return legalPlays[index];
  }

  chooseTrump(ctx: ChooseTrumpContext): Suit {
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const index = RandomAgent.pickUniformIndex(ctx, suits.length);
    return suits[index];
  }

  private static pickUniformIndex(
    ctx: { rng: { nextIntWithinBounds: (max: number) => number } },
    maxExclusive: number
  ): number {
    if (maxExclusive <= 0) return 0;
    return ctx.rng.nextIntWithinBounds(maxExclusive);
  }
}

// Backward-compatible plain object export
const randomAgentInstance = new RandomAgent();
export const randomAgent: Agent = Object.freeze({
  name: randomAgentInstance.name,
  bid: (ctx: BidContext): number => randomAgentInstance.bid(ctx),
  play: (ctx: PlayContext): GameCard => randomAgentInstance.play(ctx),
  chooseTrump: (ctx: ChooseTrumpContext): Suit =>
    randomAgentInstance.chooseTrump(ctx),
});

// Factory for named random agents without mutation
export function createRandomAgent(name: string): Agent {
  const instance = new RandomAgent(name);
  return Object.freeze({
    name,
    bid: (ctx: BidContext): number => instance.bid(ctx),
    play: (ctx: PlayContext): GameCard => instance.play(ctx),
    chooseTrump: (ctx: ChooseTrumpContext): Suit => instance.chooseTrump(ctx),
  });
}
