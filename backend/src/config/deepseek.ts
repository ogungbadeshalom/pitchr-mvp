let _config: { apiKey: string; baseUrl: string; model: string; temperature: number } | null = null;

export function getDeepseekConfig() {
  if (!_config) {
    _config = {
      apiKey: process.env.DEEPSEEK_API_KEY || 'sk-placeholder',
      baseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
      model: 'deepseek-chat',
      temperature: 0.7,
    };
  }
  return _config;
}
