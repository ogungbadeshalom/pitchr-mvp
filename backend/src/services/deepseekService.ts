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

    const rawContent = data.choices[0].message.content || '';
    const reasoning = (data.choices[0].message as any).reasoning_content;

    logger.info('AI response received', {
      model: cfg.model,
      contentLength: rawContent.length,
      reasoningLength: reasoning?.length || 0,
      contentPreview: rawContent.slice(0, 200),
      usage: data.usage,
    });

    let content = rawContent;

    const thinkMatch = content.match(/(.*?)\s*<\/think>/s);
    const hasThinkTags = thinkMatch !== null;

    if (hasThinkTags) {
      content = content.replace(/.*?<\/think>\s*/s, '');
    }

    const greetIdx = content.search(/\bHi\b/);
    if (greetIdx > 0) {
      content = content.slice(greetIdx);
    } else if (hasThinkTags && !content.trim()) {
      const thinking = thinkMatch![1].replace(/<\/?think>/g, '').trim();
      const innerGreet = thinking.search(/\bHi\b/);
      if (innerGreet > -1) {
        content = thinking.slice(innerGreet);
      }
    }

    content = content.trim();

    if (!content) throw new Error('AI returned empty content — increase max_tokens or check model availability');
    return content;
  } catch (error) {
    const message = error instanceof Error && error.name === 'AbortError'
      ? 'Proposal generation timed out. Please try again.'
      : 'Failed to generate proposal. Please try again.';
    logger.error('DeepSeek API call failed', { error: String(error) });
    throw new Error(message);
  }
}


