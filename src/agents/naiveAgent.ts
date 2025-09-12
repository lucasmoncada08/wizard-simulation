import { type GameCard, Card, type Suit } from '../core/cards';
import { getLegalPlays } from '../sim/legal';
import { type Agent, type BidContext, type PlayContext } from './types';
import { Trick, TrickResolver } from '../core/trick';

export class NaiveAgent implements Agent {
  constructor(public readonly name: string = 'Naive Agent') {}

  bid(ctx: BidContext): number {
    return NaiveAgent.computeBidFromHand(ctx.hand);
  }

  play(ctx: PlayContext): GameCard {
    const legalPlays = getLegalPlays(ctx.hand, ctx.ledSuit);

    const { winnerCandidates, nonWinners } =
      NaiveAgent.partitionWinners(legalPlays);

    const hasCurrentWinner = (ctx.playsSoFar?.length ?? 0) > 0;
    const viableWinners: Array<{ card: GameCard; cost: number }> = [];
    if (hasCurrentWinner) {
      for (const candidate of winnerCandidates) {
        if (
          NaiveAgent.wouldCardTakeLead(
            candidate,
            ctx.playsSoFar,
            ctx.ledSuit,
            ctx.trumpSuit
          )
        ) {
          const cost = candidate.isWizard()
            ? 3
            : (candidate as Card).rank === 14
              ? 2
              : 1; // prefer cheaper winner: K < A < W
          viableWinners.push({ card: candidate, cost });
        }
      }
    }

    if (viableWinners.length > 0) {
      let best = viableWinners[0];
      for (let i = 1; i < viableWinners.length; i++) {
        if (viableWinners[i].cost < best.cost) {
          best = viableWinners[i];
        }
      }
      return best.card;
    }

    const pool = nonWinners.length > 0 ? nonWinners : legalPlays;
    let bestIndex = 0;
    let bestScore = NaiveAgent.scoreCardForNaivePlay(pool[0]);
    for (let i = 1; i < pool.length; i++) {
      const score = NaiveAgent.scoreCardForNaivePlay(pool[i]);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
    return pool[bestIndex];
  }

  private static computeBidFromHand(hand: GameCard[]): number {
    let bid = 0;
    for (const card of hand) {
      if (card.isWizard()) bid += 1;
      else if (NaiveAgent.isAceOrKing(card)) bid += 1;
    }
    return bid;
  }

  private static partitionWinners(cards: GameCard[]): {
    winnerCandidates: GameCard[];
    nonWinners: GameCard[];
  } {
    const winnerCandidates: GameCard[] = [];
    const nonWinners: GameCard[] = [];
    for (const card of cards) {
      if (NaiveAgent.isNaiveWinnerCard(card)) winnerCandidates.push(card);
      else nonWinners.push(card);
    }
    return { winnerCandidates, nonWinners };
  }

  private static scoreCardForNaivePlay(card: GameCard): number {
    if (card.isJester()) return -1; // prefer throwing jester first
    if (card.isRegularCard()) return (card as Card).rank; // lower rank preferred
    return 100; // wizard: avoid unless necessary
  }

  private static isNaiveWinnerCard(card: GameCard): boolean {
    return card.isWizard() || NaiveAgent.isAceOrKing(card);
  }

  private static isAceOrKing(card: GameCard): boolean {
    if (!card.isRegularCard()) return false;
    const c = card as Card;
    return c.rank === 14 || c.rank === 13;
  }

  private static wouldCardTakeLead(
    candidate: GameCard,
    playsSoFar: GameCard[] | undefined,
    ledSuit: Suit | undefined,
    trumpSuit: Suit | undefined
  ): boolean {
    const current = playsSoFar ?? [];
    const cards = current.concat(candidate);
    const resolver = new TrickResolver();
    const trick = new Trick(cards, ledSuit, trumpSuit);
    const winnerIdx = resolver.resolveTrick(trick);
    return winnerIdx === cards.length - 1;
  }
}

// Keep the original plain-object export for compatibility with spreading in examples
const naiveAgentInstance = new NaiveAgent();
export const naiveAgent: Agent = Object.freeze({
  name: naiveAgentInstance.name,
  bid: (ctx: BidContext): number => naiveAgentInstance.bid(ctx),
  play: (ctx: PlayContext): GameCard => naiveAgentInstance.play(ctx),
});

// Optional factory for named agents without mutating or relying on spread semantics
export function createNaiveAgent(name: string): Agent {
  const instance = new NaiveAgent(name);
  return Object.freeze({
    name,
    bid: (ctx: BidContext): number => instance.bid(ctx),
    play: (ctx: PlayContext): GameCard => instance.play(ctx),
  });
}
