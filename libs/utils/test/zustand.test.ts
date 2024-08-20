import { describe, expect, it } from 'vitest';
import { create } from 'zustand';

import { computed } from '../zustand';

describe('zustand computed', () => {
  it('computes derived state and updates only when dependencies change', () => {
    // Define a store with initial state
    const useStore = create(() => ({
      a: 1,
      b: 2,
    }));

    const incrementA = () => useStore.setState((state) => ({ a: state.a + 1 }));
    const incrementB = () => useStore.setState((state) => ({ b: state.b + 1 }));

    // Create a computed value that depends on `a`
    const selectComputedA = computed(useStore, (state) => state.a * 2, ['a']);

    // Initial computed value should match initial state
    expect(selectComputedA()).toBe(2);

    // Subscribe to the store and trigger updates
    const unsubscribe = useStore.subscribe(() => {});
    incrementA();
    expect(selectComputedA()).toBe(4); // `a` changed, so computed value updates

    incrementB();
    expect(selectComputedA()).toBe(4); // `b` changed, but computed value depends only on `a`, so it stays the same

    unsubscribe();
  });
});
