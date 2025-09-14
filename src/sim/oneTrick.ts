import { type GameRules } from '../core/gameRules';
import { Dealer } from '../core/deal';
import { Trick, TrickResolver } from '../core/trick';
import { type RNG } from '../core/rng';
import { type Agent } from '../agents/types';
import { type Suit, Card, type GameCard } from '../core/cards';
import { interpretFlip } from './trump';

export type TrumpSuit = Suit | 'NONE';

export type SimEvent =
  | {
      type: 'deal';
      dealer: number;
      dealerName?: string;
      round: number;
      hands: string[][];
    }
  | {
      type: 'flip';
      cardId: string;
    }
  | {
      type: 'chooseTrump';
      dealer: number;
      dealerName?: string;
      trump: TrumpSuit;
    }
  | {
      type: 'bid';
      player: number;
      playerName?: string;
      bid: number;
      hand: string[];
    }
  | {
      type: 'play';
      player: number;
      playerName?: string;
      cardId: string;
      ledSuit?: Suit;
      trumpSuit: TrumpSuit;
      currentWinner: number;
      currentWinnerName?: string;
      currentWinningCardId: string;
      handAtDecision: string[];
      playNumber: number;
      totalPlayers: number;
    }
  | {
      type: 'resolve';
      winner: number;
      winnerName?: string;
    };

export interface Stepper {
  pause(e: SimEvent): Promise<void>;
}

class NoopStepper implements Stepper {
  async pause(): Promise<void> {}
}

export interface OneTrickRunOptions {
  agents: Agent[];
  rng: RNG;
  dealerIndex: number;
  round: number;
  mode: 'step' | 'fast';
  stepper?: Stepper;
  onEvent?: (e: SimEvent) => void;
}

export interface OneTrickResult {
  events: SimEvent[];
  summary: {
    winner: number;
    bids: number[];
    plays: string[];
    trump: TrumpSuit;
    dealer: number;
    round: number;
  };
}

export class OneTrickSimulator {
  constructor(private readonly rules: GameRules) {}

  async run(opts: OneTrickRunOptions): Promise<OneTrickResult> {
    const { agents, rng, dealerIndex, round, mode, stepper, onEvent } = opts;

    const players = this.ensureAgentCount(agents);
    const effectiveStepper = this.getEffectiveStepper(mode, stepper);
    const events: SimEvent[] = [];

    const { hands, remainingDeck } = this.dealHands(players, round, rng);
    await this.pushDealEvent(
      events,
      effectiveStepper,
      onEvent,
      agents,
      dealerIndex,
      round,
      hands
    );

    const flipCard = remainingDeck[0];
    await this.pushFlipEvent(events, effectiveStepper, onEvent, flipCard);
    let trumpSuit = await this.determineTrumpSuit(
      events,
      effectiveStepper,
      onEvent,
      flipCard,
      agents,
      dealerIndex,
      rng
    );

    const bids = await this.collectBids(
      events,
      effectiveStepper,
      onEvent,
      agents,
      hands,
      dealerIndex,
      rng
    );

    const leader = this.computeStartLeader(dealerIndex);
    const { plays, ledSuit, finalTrump } = await this.playTrick(
      events,
      effectiveStepper,
      onEvent,
      agents,
      hands,
      leader,
      rng,
      trumpSuit
    );
    trumpSuit = finalTrump;

    const absoluteWinner = this.resolveTrickWinner(
      plays,
      ledSuit,
      trumpSuit,
      leader
    );
    await this.pushResolveEvent(
      events,
      effectiveStepper,
      onEvent,
      agents,
      absoluteWinner
    );

    return this.buildResult(
      events,
      absoluteWinner,
      bids,
      plays,
      trumpSuit,
      dealerIndex,
      round
    );
  }

  private ensureAgentCount(agents: Agent[]): number {
    const players = this.rules.players;
    if (agents.length !== players) {
      throw new Error(`Expected ${players} agents, got ${agents.length}`);
    }
    return players;
  }

  private getEffectiveStepper(
    mode: 'step' | 'fast',
    stepper?: Stepper
  ): Stepper {
    return mode === 'step' && stepper ? stepper : new NoopStepper();
  }

  private async pushEvent(
    events: SimEvent[],
    stepper: Stepper,
    onEvent: OneTrickRunOptions['onEvent'],
    event: SimEvent
  ): Promise<void> {
    events.push(event);
    if (onEvent) onEvent(event);
    await stepper.pause(event);
  }

  private dealHands(
    players: number,
    round: number,
    rng: RNG
  ): { hands: GameCard[][]; remainingDeck: GameCard[] } {
    const dealer = new Dealer();
    const dealRng = rng.split();
    const { hands, remainingDeck } = dealer.dealRound(players, round, dealRng);
    return { hands, remainingDeck };
  }

  private async pushDealEvent(
    events: SimEvent[],
    stepper: Stepper,
    onEvent: OneTrickRunOptions['onEvent'],
    agents: Agent[],
    dealerIndex: number,
    round: number,
    hands: GameCard[][]
  ): Promise<void> {
    const handsIds = hands.map((h) => h.map(cardId));
    await this.pushEvent(events, stepper, onEvent, {
      type: 'deal',
      dealer: dealerIndex,
      dealerName: agents[dealerIndex]?.name,
      round,
      hands: handsIds,
    });
  }

  private async pushFlipEvent(
    events: SimEvent[],
    stepper: Stepper,
    onEvent: OneTrickRunOptions['onEvent'],
    flipCard: GameCard
  ): Promise<void> {
    await this.pushEvent(events, stepper, onEvent, {
      type: 'flip',
      cardId: cardId(flipCard),
    });
  }

  private async determineTrumpSuit(
    events: SimEvent[],
    stepper: Stepper,
    onEvent: OneTrickRunOptions['onEvent'],
    flipCard: GameCard,
    agents: Agent[],
    dealerIndex: number,
    rng: RNG
  ): Promise<TrumpSuit> {
    const { trumpSuit, needsDealerChoice } = interpretFlip(
      flipCard,
      this.rules
    );
    if (!needsDealerChoice) return trumpSuit;

    const chooseRng = rng.split();
    const dealerAgent = agents[dealerIndex];
    let chosen: Suit;
    if (typeof dealerAgent.chooseTrump === 'function') {
      chosen = dealerAgent.chooseTrump({ rng: chooseRng, rules: this.rules });
    } else {
      const suits: Suit[] = ['♠', '♥', '♦', '♣'];
      const idx = chooseRng.nextIntWithinBounds(suits.length);
      chosen = suits[idx];
    }

    await this.pushEvent(events, stepper, onEvent, {
      type: 'chooseTrump',
      dealer: dealerIndex,
      dealerName: agents[dealerIndex]?.name,
      trump: chosen,
    });
    return chosen;
  }

  private async collectBids(
    events: SimEvent[],
    stepper: Stepper,
    onEvent: OneTrickRunOptions['onEvent'],
    agents: Agent[],
    hands: GameCard[][],
    dealerIndex: number,
    rng: RNG
  ): Promise<number[]> {
    const players = this.rules.players;
    const bids: number[] = new Array(players).fill(0);
    for (let i = 0; i < players; i++) {
      const p = (dealerIndex + 1 + i) % players;
      const bidRng = rng.split();
      const bid = agents[p].bid({
        hand: hands[p].slice(),
        rng: bidRng,
        rules: this.rules,
      });
      bids[p] = bid;
      const bidEvent = this.buildBidEvent(p, bid, hands, agents);
      await this.pushEvent(events, stepper, onEvent, bidEvent);
    }
    return bids;
  }

  private computeStartLeader(dealerIndex: number): number {
    return (dealerIndex + 1) % this.rules.players;
  }

  private async playTrick(
    events: SimEvent[],
    stepper: Stepper,
    onEvent: OneTrickRunOptions['onEvent'],
    agents: Agent[],
    hands: GameCard[][],
    leader: number,
    rng: RNG,
    initialTrump: TrumpSuit
  ): Promise<{
    plays: { player: number; card: GameCard }[];
    ledSuit: Suit | undefined;
    finalTrump: TrumpSuit;
  }> {
    const players = this.rules.players;
    const plays: { player: number; card: GameCard }[] = [];
    let ledSuit: Suit | undefined = undefined;
    let trumpSuit: TrumpSuit = initialTrump;

    for (let i = 0; i < players; i++) {
      const p = (leader + i) % players;
      const playRng = rng.split();
      const chosen = agents[p].play({
        hand: hands[p].slice(),
        ledSuit,
        trumpSuit: trumpSuit === 'NONE' ? undefined : trumpSuit,
        playsSoFar: plays.map((x) => x.card),
        rng: playRng,
        rules: this.rules,
      });
      const handBeforePlay = hands[p].map(cardId);

      this.removeCardFromHand(hands[p], chosen, p);

      if (ledSuit === undefined && chosen.isRegularCard()) {
        const regular = chosen as Card;
        ledSuit = regular.suit;
        if (
          trumpSuit === 'NONE' &&
          this.rules.trump.flip_interpretation.wizard === 'ledSuit'
        ) {
          trumpSuit = regular.suit;
        }
      }

      plays.push({ player: p, card: chosen });
      const playEvent = this.buildPlayEvent({
        player: p,
        chosen,
        ledSuit,
        trumpSuit,
        plays,
        leader,
        handBeforePlay,
        playIndex: i,
        totalPlayers: players,
        agents,
      });
      await this.pushEvent(events, stepper, onEvent, playEvent);
    }

    return { plays, ledSuit, finalTrump: trumpSuit };
  }

  private removeCardFromHand(
    hand: GameCard[],
    chosen: GameCard,
    playerIndex: number
  ): void {
    const byReferenceIndex = hand.indexOf(chosen);
    if (byReferenceIndex !== -1) {
      hand.splice(byReferenceIndex, 1);
      return;
    }
    const structuralIndex = hand.findIndex((c) => equalCard(c, chosen));
    if (structuralIndex === -1) {
      throw new Error(
        `Played card not found in hand for player ${playerIndex}`
      );
    }
    hand.splice(structuralIndex, 1);
  }

  private resolveTrickWinner(
    plays: { player: number; card: GameCard }[],
    ledSuit: Suit | undefined,
    trumpSuit: TrumpSuit,
    leader: number
  ): number {
    const orderedCards = plays.map((x) => x.card);
    const resolver = new TrickResolver();
    const trick = new Trick(
      orderedCards,
      ledSuit,
      trumpSuit === 'NONE' ? undefined : trumpSuit
    );
    const relativeWinner = resolver.resolveTrick(trick);
    const absoluteWinner = (leader + relativeWinner) % this.rules.players;
    return absoluteWinner;
  }

  private async pushResolveEvent(
    events: SimEvent[],
    stepper: Stepper,
    onEvent: OneTrickRunOptions['onEvent'],
    agents: Agent[],
    winner: number
  ): Promise<void> {
    await this.pushEvent(events, stepper, onEvent, {
      type: 'resolve',
      winner,
      winnerName: agents[winner]?.name,
    });
  }

  private buildResult(
    events: SimEvent[],
    winner: number,
    bids: number[],
    plays: { player: number; card: GameCard }[],
    trump: TrumpSuit,
    dealer: number,
    round: number
  ): OneTrickResult {
    return {
      events,
      summary: {
        winner,
        bids,
        plays: plays.map((x) => cardId(x.card)),
        trump,
        dealer,
        round,
      },
    };
  }

  private buildBidEvent(
    player: number,
    bid: number,
    hands: GameCard[][],
    agents: Agent[]
  ): Extract<SimEvent, { type: 'bid' }> {
    return {
      type: 'bid',
      player,
      playerName: agents[player]?.name,
      bid,
      hand: hands[player].map(cardId),
    };
  }

  private buildPlayEvent(params: {
    player: number;
    chosen: GameCard;
    ledSuit: Suit | undefined;
    trumpSuit: TrumpSuit;
    plays: { player: number; card: GameCard }[];
    leader: number;
    handBeforePlay: string[];
    playIndex: number;
    totalPlayers: number;
    agents: Agent[];
  }): Extract<SimEvent, { type: 'play' }> {
    const {
      player,
      chosen,
      ledSuit,
      trumpSuit,
      plays,
      leader,
      handBeforePlay,
      playIndex,
      totalPlayers,
      agents,
    } = params;

    const currentWinner = this.resolveTrickWinner(
      plays,
      ledSuit,
      trumpSuit,
      leader
    );
    const winnerPlayIndex = plays.findIndex((x) => x.player === currentWinner);
    if (winnerPlayIndex === -1) {
      throw new Error('Invariant violation: winner has no corresponding play');
    }
    const currentWinningCardId = cardId(plays[winnerPlayIndex].card);

    return {
      type: 'play',
      player,
      playerName: agents[player]?.name,
      cardId: cardId(chosen),
      ledSuit,
      trumpSuit,
      currentWinner,
      currentWinnerName: agents[currentWinner]?.name,
      currentWinningCardId,
      handAtDecision: handBeforePlay,
      playNumber: playIndex + 1,
      totalPlayers,
    };
  }
}

// Helpers
function cardId(c: GameCard): string {
  return c.toString();
}

function equalCard(a: GameCard, b: GameCard): boolean {
  if (a.isWizard() && b.isWizard()) return true;
  if (a.isJester() && b.isJester()) return true;
  if (a.isRegularCard() && b.isRegularCard()) {
    const ra = a as Card;
    const rb = b as Card;
    return ra.suit === rb.suit && ra.rank === rb.rank;
  }
  return false;
}
