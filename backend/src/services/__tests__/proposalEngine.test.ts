import { describe, it, expect } from 'vitest';

vi.mock('../deepseekService', () => ({
  callDeepSeek: vi.fn().mockResolvedValue('Mock proposal content here for testing purposes.'),
}));

import { vi } from 'vitest';
import { generateProposal } from '../proposalEngine';

describe('proposalEngine', () => {
  it('should generate a proposal with mock data', async () => {
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

  it('should handle very long job descriptions', async () => {
    const longJob = 'A'.repeat(5000);
    const result = await generateProposal({
      jobDescription: longJob,
      platform: 'upwork',
      length: 'detailed',
    });
    expect(result.proposal).toBeTruthy();
  });

  it('should handle user_context when provided', async () => {
    const result = await generateProposal({
      jobDescription: 'Need a designer',
      platform: 'fiverr',
      length: 'standard',
      userContext: '5 years experience with Figma',
    });
    expect(result.proposal).toBeTruthy();
  });
});
