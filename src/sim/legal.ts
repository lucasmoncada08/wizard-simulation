import { type Suit, type GameCard } from '../core/cards';

export function getLegalPlays(
  hand: GameCard[],
  ledSuit: Suit | undefined
): GameCard[] {
  if (ledSuit === undefined) {
    return hand.slice();
  }

  const regularOfLedSuit = hand.filter(
    (c) =>
      c.isRegularCard() && (c as import('../core/cards').Card).suit === ledSuit
  );

  if (regularOfLedSuit.length === 0) {
    return hand.slice();
  }

  const wizardsAndJesters = hand.filter((c) => c.isWizard() || c.isJester());
  return [...regularOfLedSuit, ...wizardsAndJesters];
}

// OOP-friendly facade allowing strategy substitution later if needed.
export class LegalPlayEvaluator {
  getLegalPlays(hand: GameCard[], ledSuit: Suit | undefined): GameCard[] {
    return getLegalPlays(hand, ledSuit);
  }
}
