export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  subscription_tier: 'free' | 'starter' | 'pro';
  subscription_started_at: Date | null;
  subscription_ended_at: Date | null;
  proposal_count_this_month: number;
  proposal_limit_this_month: number | null;
  billing_period: 'monthly' | 'annual' | null;
  created_at: Date;
  deleted_at: Date | null;
}

export interface Session {
  id: string;
  token: string;
  plan: 'flash' | 'power';
  email: string;
  user_id?: string | null;
  expires_at: Date;
  proposals_used: number;
  proposals_limit: number;
  payment_reference: string | null;
  payment_status: 'pending' | 'completed' | 'failed';
}

export interface Proposal {
  id: string;
  user_id: string | null;
  session_id: string | null;
  job_description: string;
  platform: 'upwork' | 'fiverr' | 'other';
  length: 'short' | 'standard' | 'detailed';
  generated_proposal: string;
  saved: boolean;
  created_at: Date;
}

export interface Payment {
  id: string;
  user_id: string | null;
  session_id: string | null;
  amount: number;
  currency: string;
  payment_type: 'one_time' | 'subscription';
  payment_method?: string | null;
  flutterwave_reference: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
}

export interface GenerateProposalRequest {
  job_description: string;
  platform: 'upwork' | 'fiverr' | 'other';
  length: 'short' | 'standard' | 'detailed';
  user_context?: string;
}

export interface GenerateProposalResponse {
  proposal: string;
  character_count: number;
}

export interface InitSessionPaymentRequest {
  plan: 'flash' | 'power';
  email: string;
}

export interface InitSubscriptionRequest {
  plan: 'starter' | 'pro';
  billing_period?: 'monthly' | 'annual';
}
