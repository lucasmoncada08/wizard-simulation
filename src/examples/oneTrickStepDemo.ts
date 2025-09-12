import { loadRules } from '../core/gameRules';
import { createRNG } from '../core/rng';
import { createRandomAgent } from '../agents/randomAgent';
import { createNaiveAgent } from '../agents/naiveAgent';
import { OneTrickSimulator } from '../sim/oneTrick';
import { CliStepper } from '../sim/cliStepper';

async function main(): Promise<void> {
  const seedArg = process?.argv[2];
  const seed = Number.isFinite(Number(seedArg)) ? Number(seedArg) : 123;

  const rules = loadRules();
  const sim = new OneTrickSimulator(rules);
  const stepper = new CliStepper();

  const agents = [
    createNaiveAgent('Naive Agent 1'),
    createRandomAgent('Random Agent 1'),
    createRandomAgent('Random Agent 2'),
    createNaiveAgent('Naive Agent 2'),
  ];

  const result = await sim.run({
    agents,
    rng: createRNG(seed),
    dealerIndex: 0,
    round: 1,
    mode: 'step',
    stepper,
  });

  console.log('\nFinal Summary:', result.summary);
  stepper.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
