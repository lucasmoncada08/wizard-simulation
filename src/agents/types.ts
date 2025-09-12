import { type Suit, type GameCard } from '../core/cards';
import { type RNG } from '../core/rng';
import { type GameRules } from '../core/gameRules';

export interface BidContext {
  hand: GameCard[];
  rng: RNG;
  rules: GameRules;
}

export interface PlayContext {
  hand: GameCard[];
  ledSuit: Suit | undefined;
  // Trump suit for the current trick; undefined when there is no trump (NONE)
  trumpSuit?: Suit;
  // Ordered list of cards already played in the current trick
  playsSoFar?: GameCard[];
  rng: RNG;
  rules: GameRules;
}

export interface ChooseTrumpContext {
  rng: RNG;
  rules: GameRules;
}

export interface Agent {
  /** Display name for this player/agent */
  name: string;
  bid(ctx: BidContext): number;
  play(ctx: PlayContext): GameCard;
  chooseTrump?(ctx: ChooseTrumpContext): Suit;
}
