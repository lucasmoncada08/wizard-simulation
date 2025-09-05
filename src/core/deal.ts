import { type RNG } from './rng';
import { Deck, type GameCard } from './cards';

export interface DealResult {
  hands: GameCard[][];
  remainingDeck: GameCard[];
}

export class Dealer {
  dealRound(numPlayers: number, round: number, rng: RNG): DealResult {
    if (numPlayers <= 0) {
      throw new Error('Number of players must be positive');
    }

    if (round <= 0) {
      throw new Error('Round number must be positive');
    }

    const deck = new Deck();
    const shuffledDeck = deck.shuffle(rng);
    const hands = shuffledDeck.dealCards(numPlayers, round);

    // Calculate remaining cards
    const cardsDealt = numPlayers * round;
    const remainingDeck = shuffledDeck.cards.slice(cardsDealt);

    return {
      hands,
      remainingDeck,
    };
  }

  validateDeal(deal: DealResult, numPlayers: number, round: number): boolean {
    // Check that each hand has the correct number of cards
    const expectedCardsPerHand = round;
    for (const hand of deal.hands) {
      if (hand.length !== expectedCardsPerHand) {
        return false;
      }
    }

    // Check that we have the right number of hands
    if (deal.hands.length !== numPlayers) {
      return false;
    }

    // Check that total cards dealt + remaining equals deck size
    const totalDealt = deal.hands.reduce((sum, hand) => sum + hand.length, 0);
    const totalCards = totalDealt + deal.remainingDeck.length;
    const expectedTotal = 60; // Standard Wizard deck size

    return totalCards === expectedTotal;
  }
}
