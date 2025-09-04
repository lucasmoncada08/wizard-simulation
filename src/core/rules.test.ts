import { describe, it, expect, vi } from 'vitest';
import { loadRules, getMaxRounds, type GameRules } from './rules';

// Mock fs module
vi.mock('fs', () => ({
  readFileSync: vi.fn()
}));

describe('Rules', () => {
  const mockRules: GameRules = {
    players: 4,
    deck: {
      suits: ['♠', '♥', '♦', '♣'],
      ranks: [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
      wizards: 4,
      jesters: 4
    },
    rounds: {
      min: 1,
      max: 'auto'
    },
    trump: {
      flip_interpretation: {
        jester: 'NONE',
        wizard: 'dealerChooses'
      }
    },
    bidding: {
      scoring: {
        exact: '20 + 10*bid',
        miss_penalty_per_trick: -10
      }
    },
    play: {
      priority: ['WIZARD', 'TRUMP', 'LED_SUIT', 'OTHER'],
      first_wizard_wins_ties: true,
      all_jesters_first_jester_wins: true
    }
  };

  it('should load valid rules from YAML', async () => {
    const { readFileSync } = await import('fs');
    vi.mocked(readFileSync).mockReturnValue(`
players: 4
deck:
  suits: ["♠","♥","♦","♣"]
  ranks: [2,3,4,5,6,7,8,9,10,11,12,13,14]
  wizards: 4
  jesters: 4
rounds:
  min: 1
  max: auto
trump:
  flip_interpretation:
    jester: NONE
    wizard: dealerChooses
bidding:
  scoring:
    exact: "20 + 10*bid"
    miss_penalty_per_trick: -10
play:
  priority: ["WIZARD", "TRUMP", "LED_SUIT", "OTHER"]
  first_wizard_wins_ties: true
  all_jesters_first_jester_wins: true
    `);

    const rules = loadRules();
    expect(rules).toEqual(mockRules);
  });

  it('should throw error for invalid YAML', async () => {
    const { readFileSync } = await import('fs');
    vi.mocked(readFileSync).mockReturnValue('invalid: yaml: content:');

    expect(() => loadRules()).toThrow('Failed to load rules');
  });

  it('should throw error for missing required sections', async () => {
    const { readFileSync } = await import('fs');
    vi.mocked(readFileSync).mockReturnValue(`
players: 4
deck:
  suits: ["♠","♥","♦","♣"]
    `);

    expect(() => loadRules()).toThrow('Invalid rules file: missing required sections');
  });

  it('should calculate max rounds correctly for auto', () => {
    const maxRounds = getMaxRounds(mockRules);
    // 4 suits * 13 ranks + 4 wizards + 4 jesters = 60 cards
    // 60 cards / 4 players = 15 rounds
    expect(maxRounds).toBe(15);
  });

  it('should return fixed max rounds when not auto', () => {
    const rulesWithFixedMax = { ...mockRules, rounds: { ...mockRules.rounds, max: 10 } };
    const maxRounds = getMaxRounds(rulesWithFixedMax);
    expect(maxRounds).toBe(10);
  });
});
