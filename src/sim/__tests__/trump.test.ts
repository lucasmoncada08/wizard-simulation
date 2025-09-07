import { describe, it, expect } from 'vitest';
import {
  type Suit,
  Card,
  WizardCard,
  JesterCard,
  type GameCard,
} from '../../core/cards';
import { type GameRules } from '../../core/gameRules';

// The SUT will be implemented in src/sim/trump.ts
import { interpretFlip } from '../trump';

function makeRules(
  wizardMode: GameRules['trump']['flip_interpretation']['wizard']
): GameRules {
  return {
    players: 4,
    deck: {
      suits: ['♠', '♥', '♦', '♣'],
      ranks: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      wizards: 4,
      jesters: 4,
    },
    rounds: { min: 1, max: 'auto' },
    trump: {
      flip_interpretation: {
        jester: 'NONE',
        wizard: wizardMode,
      },
    },
    bidding: { scoring: { exact: '20 + 10*bid', miss_penalty_per_trick: -10 } },
    play: {
      priority: ['WIZARD', 'TRUMP', 'LED_SUIT', 'OTHER'],
      first_wizard_wins_ties: true,
      all_jesters_first_jester_wins: true,
    },
  };
}

function expectResult(
  result: { trumpSuit: Suit | 'NONE'; needsDealerChoice: boolean },
  {
    suit,
    needsDealerChoice,
  }: { suit: Suit | 'NONE'; needsDealerChoice: boolean }
): void {
  expect(result.trumpSuit).toBe(suit);
  expect(result.needsDealerChoice).toBe(needsDealerChoice);
}

describe('interpretFlip', () => {
  describe('regular card flip', () => {
    it('sets trump to the card suit and no dealer choice', () => {
      const rules = makeRules('dealerChooses');
      const card: GameCard = new Card('♠', 10);
      const result = interpretFlip(card, rules);
      expectResult(result, { suit: '♠', needsDealerChoice: false });
    });
  });

  describe('jester flip', () => {
    it('produces NONE and no dealer choice (per rules trump.flip_interpretation.jester)', () => {
      const rules = makeRules('dealerChooses');
      const card: GameCard = new JesterCard();
      const result = interpretFlip(card, rules);
      expectResult(result, { suit: 'NONE', needsDealerChoice: false });
    });
  });

  describe('wizard flip', () => {
    it('dealerChooses: requires dealer choice, trumpSuit NONE placeholder', () => {
      const rules = makeRules('dealerChooses');
      const card: GameCard = new WizardCard();
      const result = interpretFlip(card, rules);
      expectResult(result, { suit: 'NONE', needsDealerChoice: true });
    });

    it('ledSuit: no immediate trump (NONE), no dealer choice; engine will set later to led suit of first trick', () => {
      const rules = makeRules('ledSuit');
      const card: GameCard = new WizardCard();
      const result = interpretFlip(card, rules);
      expectResult(result, { suit: 'NONE', needsDealerChoice: false });
    });

    it('fixedNone: no trump this round, no dealer choice', () => {
      const rules = makeRules('fixedNone');
      const card: GameCard = new WizardCard();
      const result = interpretFlip(card, rules);
      expectResult(result, { suit: 'NONE', needsDealerChoice: false });
    });
  });
});
