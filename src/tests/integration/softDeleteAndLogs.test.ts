/**
 * @vitest-environment node
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../server';

const { mockQuery } = vi.hoisted(() => {
  return { mockQuery: vi.fn() };
});

vi.mock('pg', () => {
  return {
    default: {
      Pool: vi.fn(() => ({
        query: mockQuery
      }))
    }
  };
});

describe('Soft Delete and Audit Logs Integration Tests', () => {
  let app: any;
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
  
  const generateToken = (userId: string, role: string) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId, role }, JWT_SECRET);
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    app = await createServer();
  });

  describe('GET /api/logs/updates and /api/logs/deletes permissions', () => {
    it('returns 403 Forbidden for MODERADOR role', async () => {
      const token = generateToken('moderator-id', 'MODERADOR');
      
      // Mock db.getUserById inside requireAuth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'moderator-id', nome: 'Mod', role: 'MODERADOR', delegacao_id: 'del-1' }]
      });

      const res = await request(app)
        .get('/api/logs/updates')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(403);
    });

    it('returns 200 OK for ADMIN_GERAL role', async () => {
      const token = generateToken('admin-id', 'ADMIN_GERAL');
      
      // 1. Mock db.getUserById inside requireAuth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'admin-id', nome: 'Admin', role: 'ADMIN_GERAL' }]
      });
      // 2. Mock db.getLogUpdates
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'log-1',
            tipo_entidade: 'delegacao',
            entidade_id: 'del-1',
            usuario_id: 'admin-id',
            usuario_nome: 'Admin',
            usuario_cpf: '123',
            changes: { nome: { old: 'A', new: 'B' } },
            created_at: new Date().toISOString()
          }
        ]
      });

      const res = await request(app)
        .get('/api/logs/updates')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0].tipoEntidade).toBe('delegacao');
    });
  });

  describe('PUT and DELETE /api/delegacoes/:id', () => {
    it('allows ADMIN_GERAL to update a delegation and logs the action', async () => {
      const token = generateToken('admin-id', 'ADMIN_GERAL');
      
      // 1. Mock db.getUserById inside requireAuth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'admin-id', nome: 'Admin', role: 'ADMIN_GERAL' }]
      });
      // 2. Mock db.getDelegacaoById
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'del-1', nome: 'Canadá' }]
      });
      // 3. Mock db.updateDelegacao
      mockQuery.mockResolvedValueOnce({ rows: [] });
      // 4. Mock db.logUpdate
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/delegacoes/del-1')
        .set('Cookie', [`token=${token}`])
        .send({ nome: 'Canadá Melhorado' });

      expect(res.status).toBe(200);
      expect(res.body.nome).toBe('Canadá Melhorado');
      
      const calls = mockQuery.mock.calls;
      expect(calls.some(c => c[0].includes('UPDATE delegacoes'))).toBe(true);
      expect(calls.some(c => c[0].includes('INSERT INTO log_updates'))).toBe(true);
    });

    it('denies MODERADOR from deleting a delegation', async () => {
      const token = generateToken('moderator-id', 'MODERADOR');
      
      // Mock db.getUserById inside requireAuth
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'moderator-id', nome: 'Mod', role: 'MODERADOR', delegacao_id: 'del-1' }]
      });

      const res = await request(app)
        .delete('/api/delegacoes/del-1')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(403);
    });
  });
});
