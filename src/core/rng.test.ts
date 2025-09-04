import { describe, it, expect } from 'vitest';
import { createRNG } from './rng';

describe('RNG', () => {
  it('should be deterministic with same seed', () => {
    const rng1 = createRNG(42);
    const rng2 = createRNG(42);
    
    expect(rng1.nextInt(100)).toBe(rng2.nextInt(100));
    expect(rng1.nextInt(50, 100)).toBe(rng2.nextInt(50, 100));
    expect(rng1.nextDouble()).toBe(rng2.nextDouble());
  });

  it('should generate different numbers with different seeds', () => {
    const rng1 = createRNG(42);
    const rng2 = createRNG(43);
    
    expect(rng1.nextInt(100)).not.toBe(rng2.nextInt(100));
  });

  it('should respect min/max bounds for nextInt', () => {
    const rng = createRNG(42);
    const min = 10;
    const max = 20;
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextInt(min, max);
      expect(value).toBeGreaterThanOrEqual(min);
      expect(value).toBeLessThan(max);
    }
  });

  it('should generate doubles between 0 and 1', () => {
    const rng = createRNG(42);
    
    for (let i = 0; i < 100; i++) {
      const value = rng.nextDouble();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('should create independent RNGs when split', () => {
    const rng1 = createRNG(42);
    const rng2 = rng1.split();
    
    // Both should be deterministic but different from each other
    const rng1Copy = createRNG(42);
    const rng2Copy = rng1Copy.split();
    
    expect(rng1.nextInt(100)).toBe(rng1Copy.nextInt(100));
    expect(rng2.nextInt(100)).toBe(rng2Copy.nextInt(100));
    expect(rng1.nextInt(100)).not.toBe(rng2.nextInt(100));
  });
});
