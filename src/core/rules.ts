import { parse } from 'yaml';
import { readFileSync } from 'fs';

export interface GameRules {
  players: number;
  deck: {
    suits: string[];
    ranks: number[];
    wizards: number;
    jesters: number;
  };
  rounds: {
    min: number;
    max: 'auto' | number;
  };
  trump: {
    flip_interpretation: {
      jester: 'NONE';
      wizard: 'dealerChooses' | 'ledSuit' | 'fixedNone';
    };
  };
  bidding: {
    scoring: {
      exact: string;
      miss_penalty_per_trick: number;
    };
  };
  play: {
    priority: string[];
    first_wizard_wins_ties: boolean;
    all_jesters_first_jester_wins: boolean;
  };
}

export function loadRules(filePath: string = 'gameRules.yaml'): GameRules {
  try {
    const fileContent = readFileSync(filePath, 'utf8');
    const rules = parse(fileContent) as GameRules;
    
    // Validate required fields
    if (!rules.players || !rules.deck || !rules.rounds || !rules.trump || !rules.bidding || !rules.play) {
      throw new Error('Invalid rules file: missing required sections');
    }
    
    return rules;
  } catch (error) {
    throw new Error(`Failed to load rules from ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export function getMaxRounds(rules: GameRules): number {
  if (rules.rounds.max === 'auto') {
    // Calculate based on deck size and players
    const totalCards = rules.deck.suits.length * rules.deck.ranks.length + rules.deck.wizards + rules.deck.jesters;
    return Math.floor(totalCards / rules.players);
  }
  return rules.rounds.max;
}
