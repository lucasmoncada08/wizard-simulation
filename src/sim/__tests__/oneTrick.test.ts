import { describe, it, expect } from 'vitest';
import { loadRules } from '../../core/gameRules';
import { createRNG } from '../../core/rng';
import { randomAgent } from '../../agents/randomAgent';

import { OneTrickSimulator, type SimEvent, type Stepper } from '../oneTrick';

function serializeEvent(e: SimEvent): unknown {
  switch (e.type) {
    case 'flip':
      return { t: e.type, card: e.cardId };
    case 'chooseTrump':
      return { t: e.type, trump: e.trump };
    case 'bid':
      return { t: e.type, p: e.player, bid: e.bid };
    case 'play':
      return {
        t: e.type,
        p: e.player,
        card: e.cardId,
        led: e.ledSuit ?? null,
        trump: e.trumpSuit,
      };
    case 'resolve':
      return { t: e.type, winner: e.winner };
    case 'deal':
      return {
        t: e.type,
        round: e.round,
        dealer: e.dealer,
        hands: e.hands.map((h) => h.map((id) => id)),
      };
    default:
      return e;
  }
}

class CountingStepper implements Stepper {
  public count = 0;
  async pause(): Promise<void> {
    this.count += 1;
  }
}

describe('OneTrickSimulator', () => {
  it('runs deterministically with same seed', async () => {
    const rules = loadRules();
    const agents = [randomAgent, randomAgent, randomAgent, randomAgent];

    const sim1 = new OneTrickSimulator(rules);
    const res1 = await sim1.run({
      agents,
      rng: createRNG(42),
      dealerIndex: 0,
      round: 1,
      mode: 'fast',
    });

    const sim2 = new OneTrickSimulator(rules);
    const res2 = await sim2.run({
      agents,
      rng: createRNG(42),
      dealerIndex: 0,
      round: 1,
      mode: 'fast',
    });

    expect(res1.summary.winner).toBe(res2.summary.winner);
    expect(res1.summary.bids).toEqual(res2.summary.bids);
    expect(res1.events.map(serializeEvent)).toEqual(
      res2.events.map(serializeEvent)
    );
  });

  it('pauses on each decision in step mode', async () => {
    const rules = loadRules();
    const agents = [randomAgent, randomAgent, randomAgent, randomAgent];
    const stepper = new CountingStepper();

    const sim = new OneTrickSimulator(rules);
    const res = await sim.run({
      agents,
      rng: createRNG(7),
      dealerIndex: 1,
      round: 1,
      mode: 'step',
      stepper,
    });

    const minEvents = 1 + 1 + 4 + 4 + 1; // deal + flip + 4 bids + 4 plays + resolve
    expect(res.events.length).toBeGreaterThanOrEqual(minEvents);
    expect(stepper.count).toBe(res.events.length);
  });

  it('includes current winner in play events and matches final winner', async () => {
    const rules = loadRules();
    const agents = [randomAgent, randomAgent, randomAgent, randomAgent];

    const sim = new OneTrickSimulator(rules);
    const res = await sim.run({
      agents,
      rng: createRNG(12345),
      dealerIndex: 2,
      round: 1,
      mode: 'fast',
    });

    const playEvents = res.events.filter((e) => e.type === 'play') as Array<
      Extract<(typeof res.events)[number], { type: 'play' }>
    >;
    expect(playEvents.length).toBeGreaterThan(0);

    for (const e of playEvents) {
      expect(e.currentWinner).toBeGreaterThanOrEqual(0);
      expect(e.currentWinner).toBeLessThan(rules.players);
    }

    const lastPlay = playEvents[playEvents.length - 1];
    const resolve = res.events.find((e) => e.type === 'resolve') as
      | Extract<(typeof res.events)[number], { type: 'resolve' }>
      | undefined;
    expect(resolve).toBeDefined();
    expect(lastPlay.currentWinner).toBe(resolve!.winner);
  });

  it('includes current winning card id in play events', async () => {
    const rules = loadRules();
    const agents = [randomAgent, randomAgent, randomAgent, randomAgent];

    const sim = new OneTrickSimulator(rules);
    const res = await sim.run({
      agents,
      rng: createRNG(999),
      dealerIndex: 0,
      round: 1,
      mode: 'fast',
    });

    const playEvents = res.events.filter((e) => e.type === 'play') as Array<
      Extract<(typeof res.events)[number], { type: 'play' }>
    >;
    expect(playEvents.length).toBeGreaterThan(0);

    const soFar: typeof playEvents = [];
    for (const e of playEvents) {
      soFar.push(e);
      expect(typeof e.currentWinningCardId).toBe('string');
      expect(e.currentWinningCardId.length).toBeGreaterThan(0);
      const winnersPlay = soFar.find((x) => x.player === e.currentWinner);
      expect(winnersPlay).toBeDefined();
      expect(winnersPlay!.cardId).toBe(e.currentWinningCardId);
    }

    const resolve = res.events.find((e) => e.type === 'resolve') as
      | Extract<(typeof res.events)[number], { type: 'resolve' }>
      | undefined;
    expect(resolve).toBeDefined();
    const winnersFinalPlay = playEvents.find(
      (x) => x.player === resolve!.winner
    );
    expect(winnersFinalPlay).toBeDefined();
    expect(winnersFinalPlay!.cardId).toBe(
      playEvents[playEvents.length - 1].currentWinningCardId
    );
  });
  it('in a 1-card trick, randomAgent occasionally bids 1 across seeds', async () => {
    const rules = loadRules();
    const agents = [randomAgent, randomAgent, randomAgent, randomAgent];

    let sawOne = false;
    for (let seed = 1; seed <= 5 && !sawOne; seed++) {
      const sim = new OneTrickSimulator(rules);
      const res = await sim.run({
        agents,
        rng: createRNG(seed),
        dealerIndex: 0,
        round: 1,
        mode: 'fast',
      });
      if (res.summary.bids.some((b) => b === 1)) {
        sawOne = true;
      }
    }

    expect(sawOne).toBe(true);
  });

  it('includes player hand on bid events', async () => {
    const rules = loadRules();
    const agents = [randomAgent, randomAgent, randomAgent, randomAgent];

    const sim = new OneTrickSimulator(rules);
    const res = await sim.run({
      agents,
      rng: createRNG(101),
      dealerIndex: 0,
      round: 1,
      mode: 'fast',
    });

    const deal = res.events.find((e) => e.type === 'deal') as Extract<
      (typeof res.events)[number],
      { type: 'deal' }
    >;
    expect(deal).toBeDefined();

    const bidEvents = res.events.filter((e) => e.type === 'bid') as Array<
      Extract<(typeof res.events)[number], { type: 'bid' }>
    >;
    expect(bidEvents.length).toBeGreaterThan(0);

    for (const e of bidEvents) {
      // Hand during bid should be the dealt hand for that player
      expect(e.hand).toEqual(deal.hands[e.player]);
      expect(Array.isArray(e.hand)).toBe(true);
      expect(e.hand.length).toBeGreaterThan(0);
    }
  });

  it('includes player hand at decision time on play events', async () => {
    const rules = loadRules();
    const agents = [randomAgent, randomAgent, randomAgent, randomAgent];

    const sim = new OneTrickSimulator(rules);
    const res = await sim.run({
      agents,
      rng: createRNG(202),
      dealerIndex: 0,
      round: 1,
      mode: 'fast',
    });

    const playEvents = res.events.filter((e) => e.type === 'play') as Array<
      Extract<(typeof res.events)[number], { type: 'play' }>
    >;
    expect(playEvents.length).toBeGreaterThan(0);

    for (const e of playEvents) {
      expect(Array.isArray(e.handAtDecision)).toBe(true);
      expect(e.handAtDecision.length).toBeGreaterThan(0);
      // The card played must have been in the hand at decision time
      expect(e.handAtDecision).toContain(e.cardId);
    }
  });

  it('includes play order info (X/N) in play events', async () => {
    const rules = loadRules();
    const agents = [randomAgent, randomAgent, randomAgent, randomAgent];

    const sim = new OneTrickSimulator(rules);
    const res = await sim.run({
      agents,
      rng: createRNG(303),
      dealerIndex: 0,
      round: 1,
      mode: 'fast',
    });

    const playEvents = res.events.filter((e) => e.type === 'play') as Array<
      Extract<(typeof res.events)[number], { type: 'play' }>
    >;
    expect(playEvents.length).toBe(rules.players);

    playEvents.forEach((e, idx) => {
      expect(e.playNumber).toBe(idx + 1);
      expect(e.totalPlayers).toBe(rules.players);
    });
  });

  it('includes player names in events when Agent.name is provided', async () => {
    const rules = loadRules();
    const agents = [
      { ...randomAgent, name: 'Alice' },
      { ...randomAgent, name: 'Bob' },
      { ...randomAgent, name: 'Carol' },
      { ...randomAgent, name: 'Dave' },
    ];

    const sim = new OneTrickSimulator(rules);
    const res = await sim.run({
      agents,
      rng: createRNG(8080),
      dealerIndex: 1,
      round: 1,
      mode: 'fast',
    });

    const deal = res.events.find((e) => e.type === 'deal');
    expect(deal?.type === 'deal' ? deal.dealerName : undefined).toBe(
      agents[1].name
    );

    const bids = res.events.filter((e) => e.type === 'bid');
    expect(bids.length).toBeGreaterThan(0);
    for (const e of bids) {
      if (e.type === 'bid') {
        expect(e.playerName).toBe(agents[e.player].name);
      }
    }

    const plays = res.events.filter((e) => e.type === 'play');
    expect(plays.length).toBeGreaterThan(0);
    for (const e of plays) {
      if (e.type === 'play') {
        expect(e.playerName).toBe(agents[e.player].name);
        expect(
          e.currentWinnerName === undefined
            ? false
            : typeof e.currentWinnerName === 'string'
        ).toBe(true);
      }
    }

    const resolve = res.events.find((e) => e.type === 'resolve');
    if (resolve && resolve.type === 'resolve') {
      expect(resolve.winnerName).toBe(agents[resolve.winner].name);
    }
  });
});
