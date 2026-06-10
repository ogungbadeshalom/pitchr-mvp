import { describe, it, expect } from 'vitest';
import { generateProposal } from '../proposalEngine';

describe('proposalEngine', () => {
  it('should generate a proposal with mock data when no API key', async () => {
    const result = await generateProposal({
      jobDescription: 'Need a React developer for e-commerce site',
      platform: 'upwork',
      length: 'standard',
    });

    expect(result.proposal).toBeTruthy();
    expect(result.characterCount).toBeGreaterThan(0);
    expect(typeof result.proposal).toBe('string');
  });

  it('should return character count matching proposal length', async () => {
    const result = await generateProposal({
      jobDescription: 'Test job description here',
      platform: 'fiverr',
      length: 'short',
    });

    expect(result.characterCount).toBe(result.proposal.length);
  });
});
