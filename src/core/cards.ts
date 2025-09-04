import { type RNG } from './rng';

export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // Ace=14 (highest)

// Base class for all game cards
export abstract class GameCard {
  abstract isWizard(): boolean;
  abstract isJester(): boolean;
  abstract isRegularCard(): boolean;
}

export class Card extends GameCard {
  constructor(
    public readonly suit: Suit,
    public readonly rank: Rank
  ) {
    super();
  }

  isWizard(): boolean {
    return false;
  }

  isJester(): boolean {
    return false;
  }

  isRegularCard(): boolean {
    return true;
  }
}

export class WizardCard extends GameCard {
  isWizard(): boolean {
    return true;
  }

  isJester(): boolean {
    return false;
  }

  isRegularCard(): boolean {
    return false;
  }
}

export class JesterCard extends GameCard {
  isWizard(): boolean {
    return false;
  }

  isJester(): boolean {
    return true;
  }

  isRegularCard(): boolean {
    return false;
  }
}

export class Deck {
  public readonly cards: GameCard[];

  constructor() {
    this.cards = this.createDeck();
  }

  private createDeck(): GameCard[] {
    const deck: GameCard[] = [];
    
    // Add regular cards
    const suits: Suit[] = ['♠', '♥', '♦', '♣'];
    const ranks: Rank[] = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]; // Ace=14 (highest)
    
    for (const suit of suits) {
      for (const rank of ranks) {
        deck.push(new Card(suit, rank));
      }
    }
    
    // Add wizards
    for (let i = 0; i < 4; i++) {
      deck.push(new WizardCard());
    }
    
    // Add jesters
    for (let i = 0; i < 4; i++) {
      deck.push(new JesterCard());
    }
    
    return deck;
  }

  shuffle(rng: RNG): Deck {
    const shuffled = new Deck();
    shuffled.cards.length = 0; // Clear the default deck
    shuffled.cards.push(...this.cards);
    
    // Fisher-Yates shuffle
    for (let i = shuffled.cards.length - 1; i > 0; i--) {
      const j = rng.nextInt(i + 1);
      [shuffled.cards[i], shuffled.cards[j]] = [shuffled.cards[j], shuffled.cards[i]];
    }
    
    return shuffled;
  }

  dealCards(numPlayers: number, round: number): GameCard[][] {
    const hands: GameCard[][] = Array.from({ length: numPlayers }, () => []);
    const cardsPerPlayer = round;
    
    for (let i = 0; i < cardsPerPlayer; i++) {
      for (let player = 0; player < numPlayers; player++) {
        const cardIndex = i * numPlayers + player;
        if (cardIndex < this.cards.length) {
          hands[player].push(this.cards[cardIndex]);
        }
      }
    }
    
    return hands;
  }
}

// Type aliases for backward compatibility
export type GameCardType = GameCard;
