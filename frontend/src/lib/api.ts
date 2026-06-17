import axios from 'axios';

function getApiUrl() {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;
    return `http://${hostname}:5001`;
  }
  return 'http://localhost:5001';
}

const api = axios.create({
  baseURL: getApiUrl(),
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

export default api;
