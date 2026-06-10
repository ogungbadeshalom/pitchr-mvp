import { describe, it, expect, vi } from 'vitest';

vi.mock('../../config/email', () => ({
  getEmailConfig: vi.fn(() => ({ apiKey: 'placeholder', from: 'noreply@pitchr.ng', fromName: 'Pitchr' })),
}));

vi.mock('../../utils/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { sendReceipt, sendWelcomeEmail } from '../emailService';
import { logger } from '../../utils/logger';

describe('emailService', () => {
  it('should log and skip email when apiKey is placeholder', async () => {
    await sendReceipt('test@example.com', 'starter', 2000, 'PROP_SUB_starter_test');
    expect(logger.info).toHaveBeenCalledWith(
      'ZeptoMail not configured, skipping email',
      expect.any(Object),
    );
  });

  it('should log and skip welcome email when apiKey is placeholder', async () => {
    await sendWelcomeEmail('test@example.com', 'Test User');
    expect(logger.info).toHaveBeenCalledWith(
      'ZeptoMail not configured, skipping email',
      expect.any(Object),
    );
  });
});
