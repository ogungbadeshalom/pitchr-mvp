import crypto from 'crypto';
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
  if (!SESSION_PRICES[plan]) logger.warn(`Unknown session plan "${plan}", falling back to default price`);
  return SESSION_PRICES[plan] || 500;
}

export function getSubscriptionPrice(plan: string): number {
  if (!SUBSCRIPTION_PRICES[plan]) logger.warn(`Unknown subscription plan "${plan}", falling back to default price`);
  return SUBSCRIPTION_PRICES[plan] || 1500;
}

export function getAnnualPrice(plan: string): number {
  if (!ANNUAL_PRICES[plan]) logger.warn(`Unknown annual plan "${plan}", falling back to default price`);
  return ANNUAL_PRICES[plan] || 15000;
}

async function callFlutterwave(amount: number, txRef: string, email: string, name: string, redirectUrl: string) {
  const cfg = getFlutterwaveConfig();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  const response = await fetch(`${cfg.baseUrl}/payments`, {
    signal: controller.signal,
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
  clearTimeout(timeout);

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    logger.error('Flutterwave API error', { status: response.status, body: body.slice(0, 500) });
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
    const name = email ? email.split('@')[0] : 'Customer';
    return await callFlutterwave(amount, txRef, email, name, redirectUrl);
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
    const name = email ? email.split('@')[0] : 'Customer';
    return await callFlutterwave(amount, txRef, email, name, redirectUrl);
  } catch (error) {
    logger.error('Flutterwave subscription payment init failed', { error: String(error) });
    throw new PaymentError('Failed to initiate payment. Please try again.');
  }
}

export async function verifyFlutterwaveTransaction(txRef: string): Promise<{ status: string; amount: number; email: string } | null> {
  const cfg = getFlutterwaveConfig();

  if (cfg.secretKey === 'sk_placeholder') {
    if (process.env.NODE_ENV === 'production') {
      throw new PaymentError('Flutterwave not configured in production');
    }
    return { status: 'successful', amount: 500, email: 'mock@pitchr.ng' };
  }

  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2000));

    try {
      const response = await fetch(
        `${cfg.baseUrl}/transactions/verify_by_reference?tx_ref=${encodeURIComponent(txRef)}`,
        {
          headers: { Authorization: `Bearer ${cfg.secretKey}` },
        }
      );

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        logger.warn('Flutterwave verify failed', { status: response.status, txRef, attempt, body: body.slice(0, 200) });
        if (response.status >= 400 && response.status < 500) return null;
        continue;
      }

      const data = await response.json() as {
        status: string;
        message?: string;
        data?: { status: string; amount: number; tx_ref: string; customer?: { email: string; name: string } };
      };

      if (data.status === 'success' && data.data) {
        logger.info('Flutterwave verify: transaction found', {
          txRef,
          txStatus: data.data.status,
          amount: data.data.amount,
          attempt,
        });
        return {
          status: data.data.status,
          amount: data.data.amount,
          email: data.data.customer?.email || '',
        };
      }

      if (data.status !== 'success') {
        logger.warn('Flutterwave verify: API returned non-success', { txRef, status: data.status, message: data.message, attempt });
      }

      return null;
    } catch (error) {
      logger.error('Flutterwave verify error', { txRef, error: String(error), attempt });
      if (attempt >= 2) return null;
    }
  }

  return null;
}

export function verifyWebhookSignature(body: string, signature: string): boolean {
  if (getFlutterwaveConfig().secretKey === 'sk_placeholder') {
    if (process.env.NODE_ENV !== 'production') return true;
    logger.error('Webhook verification impossible: Flutterwave not configured in production');
    return false;
  }
  const hash = crypto.createHmac('sha256', getFlutterwaveConfig().secretKey)
    .update(body)
    .digest('hex');
  return hash === signature;
}
