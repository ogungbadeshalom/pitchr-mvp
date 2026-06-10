import { describe, it, expect } from 'vitest';
import { getSessionPrice, getSubscriptionPrice } from '../paymentService';

describe('getSessionPrice', () => {
  it('should return 500 for flash', () => {
    expect(getSessionPrice('flash')).toBe(500);
  });

  it('should return 1200 for power', () => {
    expect(getSessionPrice('power')).toBe(1200);
  });

  it('should return 500 for unknown plan', () => {
    expect(getSessionPrice('ultra')).toBe(500);
  });
});

describe('getSubscriptionPrice', () => {
  it('should return 2000 for starter', () => {
    expect(getSubscriptionPrice('starter')).toBe(2000);
  });

  it('should return 3500 for pro', () => {
    expect(getSubscriptionPrice('pro')).toBe(3500);
  });

  it('should return 5000 for ultra', () => {
    expect(getSubscriptionPrice('ultra')).toBe(5000);
  });

  it('should return 2000 for unknown plan', () => {
    expect(getSubscriptionPrice('flash')).toBe(2000);
  });
});
