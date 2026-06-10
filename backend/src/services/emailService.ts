import { getEmailConfig } from '../config/email';
import { logger } from '../utils/logger';

const ZEPTO_BASE = 'https://api.zeptomail.com/v1.1';

async function sendZeptoMail(to: string, subject: string, htmlBody: string) {
  const cfg = getEmailConfig();
  if (cfg.apiKey === 'placeholder') {
    logger.info('ZeptoMail not configured, skipping email', { to, subject });
    return;
  }

  try {
    const response = await fetch(`${ZEPTO_BASE}/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Zoho-enczapikey ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        from: { address: cfg.from, name: cfg.fromName },
        to: [{ email_address: { address: to } }],
        subject,
        htmlbody: htmlBody,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ZeptoMail error: ${response.status} ${text}`);
    }

    logger.info('Email sent via ZeptoMail', { to, subject });
  } catch (error) {
    logger.error('Failed to send email via ZeptoMail', { error: String(error), to });
  }
}

export async function sendReceipt(email: string, plan: string, amount: number, reference: string) {
  await sendZeptoMail(
    email,
    `Pitchr ${plan} Receipt`,
    `<h2>Payment Confirmed</h2><p>Plan: ${plan}</p><p>Amount: ₦${amount}</p><p>Reference: ${reference}</p>`
  );
}

export async function sendWelcomeEmail(email: string, name: string) {
  await sendZeptoMail(
    email,
    'Welcome to Pitchr!',
    `<h2>Welcome, ${name}!</h2><p>Start generating winning proposals today.</p>`
  );
}
