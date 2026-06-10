import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getDeepseekConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return defaults when env vars are not set', async () => {
    const { getDeepseekConfig } = await import('../deepseek');
    const cfg = getDeepseekConfig();
    expect(cfg.apiKey).toBe('');
    expect(cfg.baseUrl).toBe('https://api.deepseek.com/v1');
    expect(cfg.model).toBe('deepseek-chat');
    expect(cfg.temperature).toBe(0.7);
  });

  it('should return env values when set', async () => {
    vi.stubEnv('DEEPSEEK_API_KEY', 'sk-real-key');
    vi.stubEnv('DEEPSEEK_BASE_URL', 'https://custom.example.com');
    const { getDeepseekConfig } = await import('../deepseek');
    const cfg = getDeepseekConfig();
    expect(cfg.apiKey).toBe('sk-real-key');
    expect(cfg.baseUrl).toBe('https://custom.example.com');
    vi.unstubAllEnvs();
  });
});

describe('getFlutterwaveConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return defaults when env vars are not set', async () => {
    const { getFlutterwaveConfig } = await import('../flutterwave');
    const cfg = getFlutterwaveConfig();
    expect(cfg.publicKey).toBe('pk_placeholder');
    expect(cfg.secretKey).toBe('sk_placeholder');
    expect(cfg.baseUrl).toBe('https://api.flutterwave.com/v3');
  });
});

describe('getEmailConfig', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should return defaults when env vars are not set', async () => {
    const { getEmailConfig } = await import('../email');
    const cfg = getEmailConfig();
    expect(cfg.apiKey).toBe('placeholder');
    expect(cfg.from).toBe('noreply@pitchr.ng');
    expect(cfg.fromName).toBe('Pitchr');
  });
});
