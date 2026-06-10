import { callDeepSeek } from './deepseekService';

const SYSTEM_PROMPT = `You are a professional proposal writer for Nigerian freelancers on Upwork and Fiverr.

RULES:
1. NEVER start with "I am passionate" or generic phrases.
2. ALWAYS open with a specific insight from the job listing.
3. Use professional, warm Nigerian English (not robotic).
4. Do NOT mention time zone (WAT) unless the client explicitly asks for it.
5. For Upwork: detailed (project focused, timeline estimate).
6. For Fiverr: punchy (gig focused, short).
7. Avoid clichés ("look no further", "I am the perfect fit").
8. End with a clear, confident statement of next steps. Do NOT end with a question.
9. Keep under word limit (150 for Fiverr, 250 for Upwork, 350 for technical).
10. Sound human, not AI. Use contractions. Do not use dashes (em or en). Use periods or spaces instead.

STRUCTURE:
- Hook: Show you understand THEIR specific need (2-3 sentences)
- Your fit: Relevant experience + why different (3-4 sentences)
- Approach: How you'll solve (2-3 sentences)
- Closing: Confident next steps (1-2 sentences, no questions)`;

const WORD_LIMITS: Record<string, number> = {
  short: 150,
  standard: 250,
  detailed: 350,
};

export async function generateProposal(params: {
  jobDescription: string;
  platform: string;
  length: string;
  userContext?: string;
}): Promise<{ proposal: string; characterCount: number }> {
  const wordLimit = WORD_LIMITS[params.length] || 250;

  let userPrompt = `Job Description:\n${params.jobDescription}\n\nPlatform: ${params.platform}\nLength: ${params.length}`;
  if (params.userContext) {
    userPrompt += `\n\nMy Background:\n${params.userContext}`;
  }

  const proposal = await callDeepSeek(SYSTEM_PROMPT, userPrompt, Math.ceil(wordLimit * 1.3));

  return {
    proposal,
    characterCount: proposal.length,
  };
}
