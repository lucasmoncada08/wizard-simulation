import { loadRules } from '../core/gameRules';
import { createRNG } from '../core/rng';
import { randomAgent } from '../agents/randomAgent';
import { naiveAgent } from '../agents/naiveAgent';
import { OneTrickSimulator } from '../sim/oneTrick';

async function main(): Promise<void> {
  const seedArg = process?.argv[2] ?? '123';
  const seed = Number.isFinite(Number(seedArg)) ? Number(seedArg) : 123;

  const rules = loadRules();
  const sim = new OneTrickSimulator(rules);

  const agents = [naiveAgent, randomAgent, randomAgent, naiveAgent];

  const result = await sim.run({
    agents,
    rng: createRNG(seed),
    dealerIndex: 0,
    round: 2,
    mode: 'step',
  });

  // Print a concise summary
  console.log('OneTrick Summary:', result.summary);

  // Print events for visibility
  console.log('Events:');
  for (const e of result.events) {
    console.log(e);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
