import { getEmailConfig } from '../config/email';
import { logger } from '../utils/logger';

const ZEPTO_BASE = 'https://api.zeptomail.com/v1.1';

const BRAND = {
  primary: '#059669',
  primaryLight: '#d1fae5',
  bg: '#f9fafb',
  card: '#ffffff',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
};

function buildLayout(title: string, bodyHtml: string, ctaText?: string, ctaUrl?: string): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg}">
    <tr><td align="center" style="padding:40px 20px">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%">

        <!-- Header -->
        <tr>
          <td align="center" style="padding:0 0 8px 0">
            <span style="font-size:28px;font-weight:800;color:${BRAND.primary};letter-spacing:-0.5px">Pitchr</span>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding:0 0 32px 0;font-size:14px;color:${BRAND.muted}">
            AI proposals for Nigerian freelancers
          </td>
        </tr>

        <!-- Card -->
        <tr>
          <td style="background-color:${BRAND.card};border-radius:12px;padding:40px 36px;border:1px solid ${BRAND.border}">

            <!-- Title -->
            <h1 style="margin:0 0 8px 0;font-size:24px;font-weight:700;color:${BRAND.text}">${title}</h1>

            <!-- Body -->
            ${bodyHtml}

            <!-- CTA -->
            ${ctaText && ctaUrl ? `
            <div style="text-align:center;margin-top:28px">
              <a href="${ctaUrl}" style="display:inline-block;background-color:${BRAND.primary};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600">${ctaText}</a>
            </div>` : ''}

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td align="center" style="padding:32px 20px 0 20px;font-size:12px;color:${BRAND.muted};line-height:1.6">
            Pitchr &middot; AI proposals for Nigerian freelancers<br>
            You received this because you use Pitchr.
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function formatPlan(plan: string): string {
  const labels: Record<string, string> = {
    starter: 'Starter (Monthly)',
    pro: 'Pro (Monthly)',
    starter_annual: 'Starter (Annual)',
    pro_annual: 'Pro (Annual)',
    session_flash: 'Flash Session',
    session_power: 'Power Session',
    flash: 'Flash Session',
    power: 'Power Session',
  };
  return labels[plan] || plan;
}

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
  const label = formatPlan(plan);
  const html = buildLayout(
    'Payment Confirmed',
    `
    <p style="margin:16px 0 0 0;font-size:15px;color:${BRAND.muted};line-height:1.6">
      Thanks for your payment. Your <strong style="color:${BRAND.text}">${label}</strong> is now active.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 0 0;width:100%">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
          <span style="font-size:14px;color:${BRAND.muted}">Plan</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right">
          <span style="font-size:14px;font-weight:600;color:${BRAND.text}">${label}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border}">
          <span style="font-size:14px;color:${BRAND.muted}">Amount</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid ${BRAND.border};text-align:right">
          <span style="font-size:14px;font-weight:600;color:${BRAND.text}">₦${amount.toLocaleString()}</span>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 0">
          <span style="font-size:14px;color:${BRAND.muted}">Reference</span>
        </td>
        <td style="padding:12px 0;text-align:right">
          <span style="font-size:13px;color:${BRAND.muted};font-family:monospace">${reference}</span>
        </td>
      </tr>
    </table>`,
    'Start Generating',
    process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/session` : 'http://localhost:3000/session'
  );
  await sendZeptoMail(email, `Pitchr Receipt — ${label}`, html);
}

export async function sendWelcomeEmail(email: string, name: string) {
  const displayName = name || 'there';
  const html = buildLayout(
    'Welcome to Pitchr!',
    `
    <p style="margin:16px 0 0 0;font-size:15px;color:${BRAND.muted};line-height:1.6">
      Hey ${displayName},
    </p>
    <p style="font-size:15px;color:${BRAND.muted};line-height:1.6">
      Welcome aboard. Pitchr helps you write winning proposals for Upwork and Fiverr in under 30 seconds.
    </p>
    <p style="font-size:15px;color:${BRAND.muted};line-height:1.6">
      Paste a job description, pick your platform, and get a proposal written from your real experience. No templates, no clichés, no wasted connects.
    </p>
    <div style="margin:24px 0 0 0;padding:20px;background-color:${BRAND.primaryLight};border-radius:8px">
      <p style="margin:0;font-size:14px;color:${BRAND.primary};line-height:1.6">
        <strong>Getting started:</strong> Purchase a session to try it out, or subscribe for monthly access. No lock-in, cancel anytime.
      </p>
    </div>`,
    'Try Pitchr Now',
    process.env.FRONTEND_URL ? `${process.env.FRONTEND_URL}/#pricing` : 'http://localhost:3000/#pricing'
  );
  await sendZeptoMail(email, 'Welcome to Pitchr!', html);
}
