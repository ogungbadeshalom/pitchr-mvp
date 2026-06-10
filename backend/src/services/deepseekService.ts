import { getDeepseekConfig } from '../config/deepseek';
import { logger } from '../utils/logger';

interface DeepSeekResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

export async function callDeepSeek(
  systemPrompt: string,
  userPrompt: string,
  maxTokens: number
): Promise<string> {
  const cfg = getDeepseekConfig();
  if (cfg.apiKey === 'sk-placeholder') {
    logger.warn('DeepSeek API key not configured, returning mock response');
    return mockProposal(userPrompt);
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch(`${cfg.baseUrl}/chat/completions`, {
      signal: controller.signal,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: maxTokens,
        temperature: cfg.temperature,
      }),
    });
    clearTimeout(timeout);

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as DeepSeekResponse;
    return data.choices[0].message.content;
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Proposal generation timed out. Please try again.'
      : 'Failed to generate proposal. Please try again.';
    logger.error('DeepSeek API call failed', { error: String(error) });
    throw new Error(message);
  }
}

function mockProposal(userPrompt: string): string {
  const firstLine = userPrompt.split('\n')[0].replace(/^Job Description:\s*/i, '').slice(0, 60);
  return `I have reviewed your project "${firstLine}" and I am confident I can deliver excellent results.

With 5+ years of experience in web development, I have completed similar projects that required attention to detail and timely delivery. My approach involves understanding your requirements thoroughly, maintaining clear communication throughout, and delivering work that exceeds expectations.

Here is my plan:
1. Review requirements and ask clarifying questions
2. Begin work and provide regular progress updates
3. Deliver on time with thorough testing

Let me know when you would like to get started. I am available to begin immediately.`;
}
