import { vi, describe, it, expect } from 'vitest';
import { requireAuth } from '../../../middlewares/auth';
import { validateBody } from '../../../middlewares/validation';
import { z } from 'zod';

describe('Backend Middlewares', () => {
  describe('requireAuth', () => {
    it('returns 401 if no token is provided', () => {
      const middleware = requireAuth();
      const req: any = { cookies: {} };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
    });
  });

  describe('validateBody', () => {
    it('calls next if validation passes', async () => {
      const schema = z.object({ name: z.string() });
      const middleware = validateBody(schema);
      const req: any = { body: { name: 'Test' } };
      const res: any = {};
      const next = vi.fn();

      await middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('returns 400 if validation fails', async () => {
      const schema = z.object({ name: z.string() });
      const middleware = validateBody(schema);
      const req: any = { body: { name: 123 } };
      const res: any = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn()
      };
      const next = vi.fn();

      await middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.stringContaining('Erro de validação') }));
    });
  });
});
