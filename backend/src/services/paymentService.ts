import { getFlutterwaveConfig } from '../config/flutterwave';
import { logger } from '../utils/logger';
import { PaymentError } from '../utils/errors';

const SESSION_PRICES: Record<string, number> = {
  flash: 500,
  power: 1200,
};

const SUBSCRIPTION_PRICES: Record<string, number> = {
  starter: 1500,
  pro: 3500,
};

const ANNUAL_PRICES: Record<string, number> = {
  starter: 15000,
  pro: 35000,
};

export function getSessionPrice(plan: string): number {
  return SESSION_PRICES[plan] || 500;
}

export function getSubscriptionPrice(plan: string): number {
  return SUBSCRIPTION_PRICES[plan] || 1500;
}

export function getAnnualPrice(plan: string): number {
  return ANNUAL_PRICES[plan] || 15000;
}

async function callFlutterwave(amount: number, txRef: string, email: string, name: string, redirectUrl: string) {
  const cfg = getFlutterwaveConfig();
  const response = await fetch(`${cfg.baseUrl}/payments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.secretKey}`,
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency: 'NGN',
      payment_options: 'card,ussd,bank_transfer',
      customer: { email, name },
      customizations: {
        title: 'Pitchr',
        description: 'AI Proposal credits',
      },
      redirect_url: redirectUrl,
    }),
  });

  if (!response.ok) {
    throw new Error(`Flutterwave error: ${response.status}`);
  }

  const data = await response.json() as { data: { link: string } };
  return { payment_link: data.data.link, reference: txRef };
}

export async function initSessionPayment(plan: string, email: string, frontendUrl: string) {
  const amount = getSessionPrice(plan);
  const txRef = `PROP_${plan}_${Date.now()}`;

  if (getFlutterwaveConfig().secretKey === 'sk_placeholder') {
    logger.warn('Flutterwave not configured, returning mock payment link');
    return {
      payment_link: `${frontendUrl}/session/success?reference=${txRef}`,
      reference: txRef,
    };
  }

  try {
    const redirectUrl = `${frontendUrl}/session/success?reference=${txRef}`;
    return await callFlutterwave(amount, txRef, email, email.split('@')[0], redirectUrl);
  } catch (error) {
    logger.error('Flutterwave payment init failed', { error: String(error) });
    throw new PaymentError('Failed to initiate payment. Please try again.');
  }
}

export async function initSubscriptionPayment(plan: string, email: string, frontendUrl: string, userId: string, billingPeriod: string = 'monthly') {
  const amount = billingPeriod === 'annual' ? getAnnualPrice(plan) : getSubscriptionPrice(plan);
  const txRef = `PROP_SUB_${plan}_${billingPeriod}_${Date.now()}`;

  if (getFlutterwaveConfig().secretKey === 'sk_placeholder') {
    logger.warn('Flutterwave not configured, returning mock payment link');
    return {
      payment_link: `${frontendUrl}/dashboard/subscription?reference=${txRef}`,
      reference: txRef,
    };
  }

  try {
    const redirectUrl = `${frontendUrl}/dashboard/subscription?reference=${txRef}`;
    return await callFlutterwave(amount, txRef, email, email.split('@')[0], redirectUrl);
  } catch (error) {
    logger.error('Flutterwave subscription payment init failed', { error: String(error) });
    throw new PaymentError('Failed to initiate payment. Please try again.');
  }
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (getFlutterwaveConfig().secretKey === 'sk_placeholder') return true;
  const crypto = require('crypto');
  const hash = crypto.createHmac('sha256', getFlutterwaveConfig().secretKey)
    .update(body)
    .digest('hex');
  return hash === signature;
}
