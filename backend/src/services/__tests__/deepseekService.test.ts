import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();

vi.stubGlobal('fetch', mockFetch);

vi.mock('../../config/deepseek', () => ({
  getDeepseekConfig: vi.fn(() => ({
    apiKey: 'sk-real-key',
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    temperature: 0.7,
  })),
}));

import { callDeepSeek } from '../deepseekService';

describe('callDeepSeek', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return content from the DeepSeek API', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Generated proposal text' } }],
      }),
    });

    const result = await callDeepSeek('system prompt', 'Need a React developer', 500);
    expect(result).toBe('Generated proposal text');
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.deepseek.com/v1/chat/completions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-real-key',
        }),
      })
    );
  });

  it('should include the user prompt in the API request body', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'response' } }],
      }),
    });

    await callDeepSeek('system', 'Custom job: Build an API', 500);

    const callBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(callBody.messages[1].content).toBe('Custom job: Build an API');
  });

  it('should throw on API error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      statusText: 'Unauthorized',
      status: 401,
    });

    await expect(callDeepSeek('system', 'test', 500)).rejects.toThrow('Failed to generate proposal');
  });

  it('should throw on timeout', async () => {
    mockFetch.mockImplementation(() => {
      const error = new Error('The operation was aborted');
      error.name = 'AbortError';
      throw error;
    });

    await expect(callDeepSeek('system', 'test', 500)).rejects.toThrow('Proposal generation timed out');
  });
});
