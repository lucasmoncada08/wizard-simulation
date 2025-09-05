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
  rng: RNG;
  rules: GameRules;
}

export interface ChooseTrumpContext {
  rng: RNG;
  rules: GameRules;
}

export interface Agent {
  bid(ctx: BidContext): number;
  play(ctx: PlayContext): GameCard;
  chooseTrump?(ctx: ChooseTrumpContext): Suit;
}
