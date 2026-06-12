import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001',
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

export default api;
