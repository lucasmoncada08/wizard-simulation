import { type Suit, type GameCard } from '../core/cards';
import { type GameRules } from '../core/gameRules';

export interface TrumpFlipResult {
  trumpSuit: Suit | 'NONE';
  needsDealerChoice: boolean;
}

export function interpretFlip(
  card: GameCard,
  rules: GameRules
): TrumpFlipResult {
  if (card.isRegularCard()) {
    const regular = card as unknown as { suit: Suit };
    return { trumpSuit: regular.suit, needsDealerChoice: false };
  }

  if (card.isJester()) {
    // Currently only NONE is supported for jester per rules schema
    return { trumpSuit: 'NONE', needsDealerChoice: false };
  }

  // Wizard flipped
  const wizardMode = rules.trump.flip_interpretation.wizard;
  if (wizardMode === 'dealerChooses') {
    return { trumpSuit: 'NONE', needsDealerChoice: true };
  }

  // ledSuit and fixedNone both imply no trump is set, and no dealer choice
  return { trumpSuit: 'NONE', needsDealerChoice: false };
}
