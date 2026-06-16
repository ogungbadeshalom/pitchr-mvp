import { describe, it, expect } from 'vitest';
import { getProposalLimit } from '../queries';

describe('getProposalLimit', () => {
  it('should return 30 for starter', () => {
    expect(getProposalLimit('starter')).toBe(30);
  });

  it('should return 0 for pro (unlimited)', () => {
    expect(getProposalLimit('pro')).toBe(0);
  });

  it('should return 0 for free', () => {
    expect(getProposalLimit('free')).toBe(0);
  });

  it('should return 0 for unknown plan', () => {
    expect(getProposalLimit('unknown')).toBe(0);
  });
});
