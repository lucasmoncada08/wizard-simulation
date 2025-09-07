import readline from 'node:readline';
import { type Stepper, type SimEvent } from './oneTrick';

export type CliCommand =
  | 'enter'
  | 'q'
  | 'quit'
  | 'n'
  | 'next'
  | 's'
  | 'summary'
  | 'h'
  | 'help';

export interface CliStepperOptions {
  printEvent?: (e: SimEvent) => void;
  printSummary?: (events: SimEvent[]) => void;
}

export class CliStepper implements Stepper {
  private readonly rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  private readonly events: SimEvent[] = [];
  private readonly printEvent: (e: SimEvent) => void;
  private readonly printSummary: (events: SimEvent[]) => void;

  constructor(options: CliStepperOptions = {}) {
    this.printEvent = options.printEvent ?? defaultPrintEvent;
    this.printSummary = options.printSummary ?? defaultPrintSummary;
  }

  async pause(e: SimEvent): Promise<void> {
    this.events.push(e);
    this.printEvent(e);
    while (true) {
      const cmd = await this.prompt('[Enter=next, s=summary, h=help, q=quit] ');
      const normalized = (cmd.trim() || 'enter') as CliCommand;
      if (
        normalized === 'enter' ||
        normalized === 'n' ||
        normalized === 'next'
      ) {
        return;
      }
      if (normalized === 's' || normalized === 'summary') {
        this.printSummary(this.events);
        continue;
      }
      if (normalized === 'h' || normalized === 'help') {
        console.log(
          'Commands: Enter/n/next = continue, s/summary = print summary, q/quit = exit'
        );
        continue;
      }
      if (normalized === 'q' || normalized === 'quit') {
        console.log('Exiting...');
        this.close();
        process.exit(0);
      }

      console.log('Unknown command. Type h for help.');
    }
  }

  close(): void {
    this.rl.close();
  }

  private async prompt(query: string): Promise<string> {
    return await new Promise<string>((resolve) =>
      this.rl.question(query, resolve)
    );
  }
}

function defaultPrintEvent(e: SimEvent): void {
  console.log('\nEVENT:', summarizeEvent(e));
}

function defaultPrintSummary(events: SimEvent[]): void {
  const lastEvent = events[events.length - 1];

  console.log('\nSUMMARY (so far): total events =', events.length);
  if (lastEvent?.type === 'play') {
    console.log(
      `Current trick winner: p${lastEvent.currentWinner} with ${lastEvent.currentWinningCardId}`
    );
  }
  if (lastEvent?.type === 'resolve') {
    console.log(`Trick winner: p${lastEvent.winner}`);
  }
}

function summarizeEvent(e: SimEvent): string {
  switch (e.type) {
    case 'deal':
      return `deal(dealer=${e.dealer}, round=${e.round})`;
    case 'flip':
      return `flip(${e.cardId})`;
    case 'chooseTrump':
      return `chooseTrump(${e.trump})`;
    case 'bid':
      return `bid(p${e.player}=${e.bid}, hand=[${e.hand.join(', ')}])`;
    case 'play':
      return `play(${e.playNumber}/${e.totalPlayers}, p${e.player}=${e.cardId}, led=${e.ledSuit ?? '-'}, trump=${e.trumpSuit}, hand=[${e.handAtDecision.join(', ')}])`;
    case 'resolve':
      return `resolve(winner=${e.winner})`;
  }
}
