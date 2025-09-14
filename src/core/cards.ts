import { type RNG } from './rng';

export type Suit = '♠' | '♥' | '♦' | '♣';
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14; // Ace=14 (highest)
export type RankLabel =
  | '2'
  | '3'
  | '4'
  | '5'
  | '6'
  | '7'
  | '8'
  | '9'
  | '10'
  | 'J'
  | 'Q'
  | 'K'
  | 'A';
export const LABEL_TO_RANK_MAP: Record<RankLabel, Rank> = {
  '2': 2,
  '3': 3,
  '4': 4,
  '5': 5,
  '6': 6,
  '7': 7,
  '8': 8,
  '9': 9,
  '10': 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

export const RANK_TO_LABEL_MAP: Record<Rank, RankLabel> = {
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  8: '8',
  9: '9',
  10: '10',
  11: 'J',
  12: 'Q',
  13: 'K',
  14: 'A',
};

export function rankLabelToRank(label: RankLabel): Rank {
  return LABEL_TO_RANK_MAP[label];
}

export function rankToRankLabel(rank: Rank): RankLabel {
  return RANK_TO_LABEL_MAP[rank];
}

// Base class for all game cards
export abstract class GameCard {
  abstract isWizard(): boolean;
  abstract isJester(): boolean;
  abstract isRegularCard(): boolean;
  abstract toString(): string;
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

  toString(): string {
    return `${rankToRankLabel(this.rank)}${this.suit}`;
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

  toString(): string {
    return 'W';
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

  toString(): string {
    return 'JE';
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
      const j = rng.nextIntWithinBounds(i + 1);
      [shuffled.cards[i], shuffled.cards[j]] = [
        shuffled.cards[j],
        shuffled.cards[i],
      ];
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
