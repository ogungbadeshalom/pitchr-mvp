import { callDeepSeek } from './deepseekService';

const BASE_SYSTEM_PROMPT = `You are a professional proposal writer for Nigerian freelancers on Upwork and Fiverr.

RULES:
1. Never open with "I am passionate", "I'm a great fit", or any self-centered phrase.
2. First 2 lines (max 250 characters): greet with "Hi [Client's first name]", show you read the listing, hint at your approach, then cut off mid-question to trigger the "Read More" click.
3. Use professional, warm English. Contractions only (I've, I'd, I'm). No dashes. No robotic tone.
4. Never mention timezone unless the client brings it up.
5. Never invent credentials, results, or experience not provided in the user profile.
6. Pick 2-3 skills from the user profile that match this specific job. Don't list everything.
7. No clichés. ("look no further", "perfect fit", "hard worker", "passionate about").
8. Never end with a question. Close with a confident call to action (call or chat).
9. Don't add dashes in the proposal (be strict about this).


STRUCTURE:
Hook (250 chars max, the opening preview):
  "Hi [Name], [one sentence showing you read the brief and understand the core problem].
   [Start a question that cuts off halfway — forces them to click Read More]"

Insight line:
  One sentence about the part of the project the client is most likely nervous about
  (the dealbreaker). Offer a sample or portfolio example for it. Don't do the full job.

Your fit (2-3 sentences):
  Real experience from the user profile. One concrete result. Why it's relevant here.

Portfolio:
  2 relevant links (2-3 examples matching the job) + 1 full portfolio link.

Delivery expectations (3 short lines):
  Timeline: When they'll see a first draft.
  Quality: What standard they can expect and how you maintain it.
  Pricing: Fixed or hourly. What you typically deliver in 24 hours or within a week.

Questions (numbered, max 3):
  1. [Clarifying question about scope or requirements]
  2. [Question about their preference or expectation]
  3. [Question that sets up the next stage of conversation]

Call to action:
  One sentence. Invite them to a call or quick chat. No question mark.

Closing:
  One warm, brief sign-off. First name only.`;

const WORD_LIMITS: Record<string, number> = {
  short: 150,
  standard: 250,
  detailed: 350,
};

function buildSystemPrompt(profileText?: string): string {
  if (!profileText || !profileText.trim()) {
    return BASE_SYSTEM_PROMPT;
  }
  return `${BASE_SYSTEM_PROMPT}\n\nFREELANCER PROFILE:\n${profileText.trim()}\n\nUse this profile to personalize the proposal. Reference real experience and skills from the profile where relevant.`;
}

export async function generateProposal(params: {
  jobDescription: string;
  platform: string;
  length: string;
  userContext?: string;
  profileText?: string;
}): Promise<{ proposal: string; characterCount: number }> {
  const wordLimit = WORD_LIMITS[params.length] || 250;

  let userPrompt = `Job Description:\n${params.jobDescription}\n\nPlatform: ${params.platform}\nLength: ${params.length}`;
  if (params.userContext) {
    userPrompt += `\n\nMy Background:\n${params.userContext}`;
  }

  const systemPrompt = buildSystemPrompt(params.profileText);
  const proposal = await callDeepSeek(systemPrompt, userPrompt, Math.ceil(wordLimit * 2));

  return {
    proposal,
    characterCount: proposal.length,
  };
}
