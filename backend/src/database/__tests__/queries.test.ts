import { describe, it, expect } from 'vitest';
import { getProposalLimit } from '../queries';

describe('getProposalLimit', () => {
  it('should return 30 for starter', () => {
    expect(getProposalLimit('starter')).toBe(30);
  });

  it('should return 0 for pro (unlimited)', () => {
    expect(getProposalLimit('pro')).toBe(0);
  });

  it('should return 5 for free (safe default)', () => {
    expect(getProposalLimit('free')).toBe(5);
  });

  it('should return 5 for unknown plan', () => {
    expect(getProposalLimit('unknown')).toBe(5);
  });
});
