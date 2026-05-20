import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { LoopDetectionCache } from '../../src/lib/LoopDetectionCache.ts';

describe('LoopDetectionCache', () => {
  beforeEach(() => {
    LoopDetectionCache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should set and get attempts correctly', () => {
    LoopDetectionCache.setAttempt('monitor-1', 'job-1', 1);
    const entry = LoopDetectionCache.get('monitor-1', 'job-1');
    expect(entry).toBeDefined();
    expect(entry?.attempt).toBe(1);
    expect(entry?.circuitBroken).toBe(false);
  });

  it('should return undefined for non-existent key', () => {
    const entry = LoopDetectionCache.get('monitor-1', 'non-existent');
    expect(entry).toBeUndefined();
  });

  it('should trip the circuit breaker and respect cooldown', () => {
    LoopDetectionCache.tripBreaker('monitor-1', 'job-1', 60_000); // 1 minute cooldown

    let state = LoopDetectionCache.isBroken('monitor-1', 'job-1');
    expect(state.broken).toBe(true);
    expect(state.cooldownRemainingMs).toBeGreaterThan(0);

    // Fast-forward 30 seconds
    vi.advanceTimersByTime(30_000);
    state = LoopDetectionCache.isBroken('monitor-1', 'job-1');
    expect(state.broken).toBe(true);

    // Fast-forward another 31 seconds
    vi.advanceTimersByTime(31_000);
    state = LoopDetectionCache.isBroken('monitor-1', 'job-1');
    expect(state.broken).toBe(false);
    expect(state.cooldownRemainingMs).toBe(0);
  });

  it('should evict entries after TTL (5 minutes)', () => {
    LoopDetectionCache.setAttempt('monitor-1', 'job-1', 2);
    
    // Fast-forward 4 minutes
    vi.advanceTimersByTime(4 * 60 * 1000);
    let entry = LoopDetectionCache.get('monitor-1', 'job-1');
    expect(entry).toBeDefined();

    // Fast-forward another 2 minutes (exceeding 5 min TTL)
    vi.advanceTimersByTime(2 * 60 * 1000);
    entry = LoopDetectionCache.get('monitor-1', 'job-1');
    expect(entry).toBeUndefined();
  });
});
