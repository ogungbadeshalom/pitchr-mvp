let _config: { publicKey: string; secretKey: string; baseUrl: string } | null = null;

export function getFlutterwaveConfig() {
  if (!_config) {
    _config = {
      publicKey: process.env.FLUTTERWAVE_PUBLIC_KEY || 'pk_placeholder',
      secretKey: process.env.FLUTTERWAVE_SECRET_KEY || 'sk_placeholder',
      baseUrl: 'https://api.flutterwave.com/v3',
    };
  }
  return _config;
}
