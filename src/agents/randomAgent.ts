import { type Suit, type GameCard } from '../core/cards';
import { getLegalPlays } from '../sim/legal';
import {
  type Agent,
  type BidContext,
  type PlayContext,
  type ChooseTrumpContext,
} from './types';

function pickUniformIndex(
  rng: { nextIntWithinBounds: (max: number) => number },
  maxExclusive: number
): number {
  if (maxExclusive <= 0) return 0;
  return rng.nextIntWithinBounds(maxExclusive);
}

export const randomAgent: Agent = {
  bid(ctx: BidContext): number {
    const max = ctx.hand.length;
    // inclusive upper bound -> pick in [0, max]
    return ctx.rng.nextIntWithinBounds(max + 1);
  },

  play(ctx: PlayContext): GameCard {
    const legal = getLegalPlays(ctx.hand, ctx.ledSuit);
    const index = pickUniformIndex(ctx.rng, legal.length);
    return legal[index];
  },

  chooseTrump(ctx: ChooseTrumpContext): Suit {
    // Only suits allowed, no NONE per spec
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const index = pickUniformIndex(ctx.rng, suits.length);
    return suits[index];
  },
};
