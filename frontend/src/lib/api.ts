import axios from 'axios';

// Empty baseURL — relies on Next.js rewrites (Docker) or Caddy proxy (production)
const api = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export async function generateProposal(data: {
  job_description: string;
  platform: string;
  length: string;
  session_token?: string;
  profile_text?: string;
}) {
  const response = await api.post('/api/proposals/generate', data);
  return response.data;
}

export async function initSessionPayment(plan: string, email: string) {
  const response = await api.post('/api/payments/init-session', { plan, email });
  return response.data;
}

export async function initSubscriptionPayment(plan: string, billingPeriod: string = 'monthly') {
  const response = await api.post('/api/payments/init-subscription', { plan, billing_period: billingPeriod });
  return response.data;
}

export async function confirmSubscription(reference: string) {
  const response = await api.post('/api/payments/confirm-subscription', { reference });
  return response.data;
}

export async function fetchActiveSession(): Promise<{
  token: string;
  plan: 'flash' | 'power';
  expiresAt: number;
  proposalsUsed: number;
  proposalsLimit: number;
} | null> {
  const response = await api.get('/api/sessions/active');
  return response.data.session || null;
}

export default api;
