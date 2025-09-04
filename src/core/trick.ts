import { type GameCard } from './cards';

export class Trick {
  constructor(
    public readonly cards: GameCard[],
    public readonly ledSuit?: string,
    public readonly trumpSuit?: string
  ) {}
}

export class TrickResolver {
  resolveTrick(trick: Trick): number {
    if (trick.cards.length === 0) {
      throw new Error('Cannot resolve empty trick');
    }

    const { cards, ledSuit, trumpSuit } = trick;
    
    // Find the first wizard played
    const firstWizardIndex = cards.findIndex(card => card.isWizard());
    
    // If there's a wizard, it wins (first wizard wins ties)
    if (firstWizardIndex !== -1) {
      return firstWizardIndex;
    }
    
    // Check if all cards are jesters
    const allJesters = cards.every(card => card.isJester());
    if (allJesters) {
      // First jester wins
      return 0;
    }
    
    // Find the highest trump card
    let highestTrumpIndex = -1;
    let highestTrumpRank = -1;
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (card.isRegularCard()) {
        const regularCard = card as import('./cards').Card;
        if (regularCard.suit === trumpSuit && regularCard.rank > highestTrumpRank) {
          highestTrumpRank = regularCard.rank;
          highestTrumpIndex = i;
        }
      }
    }
    
    // If there's a trump card, it wins
    if (highestTrumpIndex !== -1) {
      return highestTrumpIndex;
    }
    
    // Find the highest card of the led suit
    let highestLedIndex = -1;
    let highestLedRank = -1;
    
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      if (card.isRegularCard()) {
        const regularCard = card as import('./cards').Card;
        if (regularCard.suit === ledSuit && regularCard.rank > highestLedRank) {
          highestLedRank = regularCard.rank;
          highestLedIndex = i;
        }
      }
    }
    
    // If there's a led suit card, it wins
    if (highestLedIndex !== -1) {
      return highestLedIndex;
    }
    
    // If no led suit cards, first card wins (shouldn't happen in normal play)
    return 0;
  }
}
