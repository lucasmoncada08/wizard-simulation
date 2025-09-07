import { type GameCard, Card, type Suit } from '../core/cards';
import { getLegalPlays } from '../sim/legal';
import { type Agent, type BidContext, type PlayContext } from './types';
import { Trick, TrickResolver } from '../core/trick';

function isAceOrKing(card: GameCard): boolean {
  if (!card.isRegularCard()) return false;
  const c = card as Card;
  return c.rank === 14 || c.rank === 13;
}

function computeBidFromHand(hand: GameCard[]): number {
  let bid = 0;
  for (const card of hand) {
    if (card.isWizard()) bid += 1;
    else if (isAceOrKing(card)) bid += 1;
  }
  return bid;
}

function scoreCardForNaivePlay(card: GameCard): number {
  if (card.isJester()) return -1; // prefer throwing jester first
  if (card.isRegularCard()) return (card as Card).rank; // lower rank preferred
  return 100; // wizard: avoid unless necessary
}

function isNaiveWinnerCard(card: GameCard): boolean {
  return card.isWizard() || isAceOrKing(card);
}

function wouldCardTakeLead(
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

export const naiveAgent: Agent = {
  bid(ctx: BidContext): number {
    return computeBidFromHand(ctx.hand);
  },

  play(ctx: PlayContext): GameCard {
    const legalPlays = getLegalPlays(ctx.hand, ctx.ledSuit);

    // Partition legal plays into naive winners (W/AK) and others
    const winnerCandidates: GameCard[] = [];
    const nonWinners: GameCard[] = [];
    for (const c of legalPlays) {
      if (isNaiveWinnerCard(c)) winnerCandidates.push(c);
      else nonWinners.push(c);
    }

    // Only consider spending winners if there is a current winner to beat
    const hasCurrentWinner = (ctx.playsSoFar?.length ?? 0) > 0;
    const viableWinners: Array<{ card: GameCard; cost: number }> = [];
    if (hasCurrentWinner) {
      for (const c of winnerCandidates) {
        if (wouldCardTakeLead(c, ctx.playsSoFar, ctx.ledSuit, ctx.trumpSuit)) {
          const cost = c.isWizard() ? 3 : (c as Card).rank === 14 ? 2 : 1; // prefer cheaper winner: K < A < W
          viableWinners.push({ card: c, cost });
        }
      }
    }

    if (viableWinners.length > 0) {
      // Choose the cheapest winner; tie-break by original order for determinism
      let best = viableWinners[0];
      for (let i = 1; i < viableWinners.length; i++) {
        if (viableWinners[i].cost < best.cost) {
          best = viableWinners[i];
        }
      }
      return best.card;
    }

    // Otherwise, conserve winners and throw the lowest-value non-winner
    const pool = nonWinners.length > 0 ? nonWinners : legalPlays;
    let bestIdx = 0;
    let bestScore = scoreCardForNaivePlay(pool[0]);
    for (let i = 1; i < pool.length; i++) {
      const s = scoreCardForNaivePlay(pool[i]);
      if (s < bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    return pool[bestIdx];
  },
};
