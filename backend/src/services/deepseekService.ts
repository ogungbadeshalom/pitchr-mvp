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

  try {
    const timeoutMs = parseInt(process.env.DEEPSEEK_TIMEOUT_MS || '30000', 10);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
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
      const body = await response.text().catch(() => '');
      logger.error('DeepSeek API error', { status: response.status, body: body.slice(0, 500) });
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as DeepSeekResponse;
    if (!data.choices?.length) throw new Error('DeepSeek returned empty response');
    return data.choices[0].message.content;
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Proposal generation timed out. Please try again.'
      : 'Failed to generate proposal. Please try again.';
    logger.error('DeepSeek API call failed', { error: String(error) });
    throw new Error(message);
  }
}


