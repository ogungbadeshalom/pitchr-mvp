import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

vi.mock('../../config/database', () => ({
  query: vi.fn(),
}));

vi.mock('supertokens-node/framework/express', () => ({ middleware: () => (req: any, res: any, next: any) => next() }));
vi.mock('../../config/supertokens', () => ({ initSuperTokens: () => {} }));

import { createApp } from '../../server';
import { query } from '../../config/database';

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return ok when database is healthy', async () => {
    (query as any).mockResolvedValue({ rows: [{ '?column?': 1 }] });
    const app = createApp();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.database).toBe('ok');
  });

  it('should return degraded when database fails', async () => {
    (query as any).mockRejectedValue(new Error('DB down'));
    const app = createApp();

    const res = await request(app).get('/api/health');

    expect(res.status).toBe(503);
    expect(res.body.status).toBe('degraded');
    expect(res.body.database).toBe('error');
  });
});
