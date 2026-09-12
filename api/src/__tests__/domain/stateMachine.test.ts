import { describe, it, expect } from 'vitest';
import { canTransition } from '../../domain/stateMachine';

describe('canTransition', () => {
  describe('valid transitions', () => {
    it('allows CONFIRMED → PREPARED', () => {
      expect(canTransition('CONFIRMED', 'PREPARED')).toBe(true);
    });

    it('allows PREPARED → PICKED_UP', () => {
      expect(canTransition('PREPARED', 'PICKED_UP')).toBe(true);
    });

    it('allows PICKED_UP → DEPARTED', () => {
      expect(canTransition('PICKED_UP', 'DEPARTED')).toBe(true);
    });

    it('allows DEPARTED → AT_HUB', () => {
      expect(canTransition('DEPARTED', 'AT_HUB')).toBe(true);
    });

    it('allows AT_HUB → DEPARTED (hub loop)', () => {
      expect(canTransition('AT_HUB', 'DEPARTED')).toBe(true);
    });

    it('allows AT_HUB → OUT_FOR_DELIVERY', () => {
      expect(canTransition('AT_HUB', 'OUT_FOR_DELIVERY')).toBe(true);
    });

    it('allows OUT_FOR_DELIVERY → DELIVERED', () => {
      expect(canTransition('OUT_FOR_DELIVERY', 'DELIVERED')).toBe(true);
    });
  });

  describe('invalid transitions', () => {
    it('rejects skipping steps (CONFIRMED → DELIVERED)', () => {
      expect(canTransition('CONFIRMED', 'DELIVERED')).toBe(false);
    });

    it('rejects going backwards (DELIVERED → CONFIRMED)', () => {
      expect(canTransition('DELIVERED', 'CONFIRMED')).toBe(false);
    });

    it('rejects any transition from DELIVERED', () => {
      expect(canTransition('DELIVERED', 'OUT_FOR_DELIVERY')).toBe(false);
      expect(canTransition('DELIVERED', 'AT_HUB')).toBe(false);
      expect(canTransition('DELIVERED', 'DEPARTED')).toBe(false);
    });

    it('rejects jumping from CONFIRMED to mid-chain status', () => {
      expect(canTransition('CONFIRMED', 'AT_HUB')).toBe(false);
      expect(canTransition('CONFIRMED', 'OUT_FOR_DELIVERY')).toBe(false);
    });

    it('rejects AT_HUB → DELIVERED (must go through OUT_FOR_DELIVERY)', () => {
      expect(canTransition('AT_HUB', 'DELIVERED')).toBe(false);
    });
  });
});
