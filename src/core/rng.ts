import { RandomGenerator, xoroshiro128plus } from 'pure-rand';

export type Seed = number;

export interface RNG {
  nextIntWithinBounds(min: number, max: number): number;
  nextIntWithinBounds(max: number): number;
  nextDouble(): number;
  split(): RNG;
}

export class PureRNG implements RNG {
  private generator: RandomGenerator;

  constructor(seed: Seed) {
    this.generator = xoroshiro128plus(seed);
  }

  nextIntWithinBounds(minOrMax: number, max?: number): number {
    if (max === undefined) {
      // Single argument: nextInt(max)
      const value = Math.abs(this.generator.unsafeNext());
      this.generator = this.generator.clone();
      return value % minOrMax;
    } else {
      // Two arguments: nextInt(min, max)
      const value = Math.abs(this.generator.unsafeNext());
      this.generator = this.generator.clone();
      return minOrMax + (value % (max - minOrMax));
    }
  }

  nextDouble(): number {
    const value = Math.abs(this.generator.unsafeNext());
    this.generator = this.generator.clone();
    return value / Number.MAX_SAFE_INTEGER;
  }

  split(): RNG {
    const value = this.generator.unsafeNext();
    this.generator = this.generator.clone();
    return new PureRNG(value);
  }
}

export function createRNG(seed: Seed): RNG {
  return new PureRNG(seed);
}
