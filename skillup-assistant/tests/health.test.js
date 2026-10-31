import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildApp, LYZR_TEST_KEY } from './helpers.js';

describe('GET /health', () => {
  it('returns the documented healthy payload and nothing else', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ success: true, service: 'skillup-assistant', status: 'healthy' });
  });

  it('does not expose credentials or configuration', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/health');
    const text = JSON.stringify(res.body) + JSON.stringify(res.headers);

    expect(text).not.toContain(LYZR_TEST_KEY);
    expect(text).not.toContain('agent_test_123');
    expect(text).not.toContain('lyzr.test');
  });

  it('does not require the internal service key', async () => {
    const { app } = buildApp({ env: { INTERNAL_API_KEY: 'a-very-long-internal-key-1234' } });
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('returns a JSON 404 for unknown routes', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/nope');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ success: false, error: { code: 'NOT_FOUND', message: 'Resource not found.' } });
  });
});
