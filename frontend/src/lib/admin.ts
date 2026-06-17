import axios from 'axios';

const adminApi = axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

export interface AnalyticsOverview {
  total_users: number;
  total_proposals: number;
  total_revenue: number;
  signups_24h: number;
  proposals_24h: number;
  payments_24h: number;
  revenue_24h: number;
}

export interface TrendPoint {
  date: string;
  count?: number;
  amount?: number;
}

export interface AnalyticsResponse {
  overview: AnalyticsOverview;
  signup_trend: TrendPoint[];
  proposal_trend: TrendPoint[];
  revenue_trend: TrendPoint[];
}

export interface AdminUser {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_tier: string;
  proposal_count_this_month: number;
  proposal_limit_this_month: number;
  billing_period: string | null;
  created_at: string;
  deleted_at?: string | null;
}

export interface UsersResponse {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
}

export async function fetchAnalytics(): Promise<AnalyticsResponse> {
  const res = await adminApi.get('/api/admin/analytics');
  return res.data;
}

export async function fetchUsers(search?: string, page = 1, limit = 20): Promise<UsersResponse> {
  const params: Record<string, string | number> = { page, limit };
  if (search) params.search = search;
  const res = await adminApi.get('/api/admin/users', { params });
  return res.data;
}

export async function updateUser(
  id: string,
  data: {
    subscription_tier?: string;
    proposal_limit_this_month?: number;
    proposal_count_this_month?: number;
    deleted_at?: string | null;
  }
): Promise<{ user: AdminUser }> {
  const res = await adminApi.patch(`/api/admin/users/${id}`, data);
  return res.data;
}
