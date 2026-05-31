/**
 * @vitest-environment node
 */
import { vi, describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createServer } from '../../../server';
import bcrypt from 'bcryptjs';

// Mock the pg driver connection Pool
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

describe('API Integration Tests - Comprehensive Business Rules', () => {
  let app: any;
  const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key';
  
  const generateToken = (userId: string, role: string) => {
    const jwt = require('jsonwebtoken');
    return jwt.sign({ userId, role }, JWT_SECRET);
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    // Recreate a clean app instance for each test
    app = await createServer();
  });

  describe('POST /api/login', () => {
    it('returns a JWT token and user info when login credentials are correct', async () => {
      const plainPassword = 'mypassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '123',
          nome: 'Test Manager',
          cpf: '12345678901',
          password: hashedPassword,
          role: 'MANAGER',
          delegacao_id: 'del-1'
        }]
      });

      const res = await request(app)
        .post('/api/login')
        .send({ cpf: '12345678901', password: plainPassword });

      expect(res.status).toBe(200);
      expect(res.body.nome).toBe('Test Manager');
      expect(res.body.role).toBe('MANAGER');
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('token=');
    });

    it('returns 401 when password does not match', async () => {
      const hashedPassword = await bcrypt.hash('secret', 10);
      
      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: '123',
          nome: 'Test Manager',
          cpf: '12345678901',
          password: hashedPassword,
          role: 'MANAGER'
        }]
      });

      const res = await request(app)
        .post('/api/login')
        .send({ cpf: '12345678901', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciais inválidas');
    });

    it('returns 401 when user is not found in database', async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/login')
        .send({ cpf: '99999999999', password: 'password' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Credenciais inválidas');
    });

    it('returns 403 when trying to log in as a PARTICIPANTE (admins only)', async () => {
      const plainPassword = 'mypassword';
      const hashedPassword = await bcrypt.hash(plainPassword, 10);

      mockQuery.mockResolvedValueOnce({
        rows: [{
          id: 'part-1',
          nome: 'Atleta',
          cpf: '11111111111',
          password: hashedPassword,
          role: 'PARTICIPANTE'
        }]
      });

      const res = await request(app)
        .post('/api/login')
        .send({ cpf: '11111111111', password: plainPassword });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Acesso apenas para Administradores');
    });
  });

  describe('POST /api/logout', () => {
    it('clears the cookie and returns success', async () => {
      const res = await request(app).post('/api/logout');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.headers['set-cookie'][0]).toContain('token=;');
    });
  });

  describe('GET /api/me', () => {
    it('returns current user info if authenticated', async () => {
      const token = generateToken('user-123', 'ADMIN_GERAL');
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-123', nome: 'Admin User', cpf: '000', role: 'ADMIN_GERAL' }]
      });

      const res = await request(app)
        .get('/api/me')
        .set('Cookie', [`token=${token}`]);

      expect(res.status).toBe(200);
      expect(res.body.nome).toBe('Admin User');
      expect(res.body.role).toBe('ADMIN_GERAL');
    });

    it('returns 401 if token is missing', async () => {
      const res = await request(app).get('/api/me');
      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Unauthorized');
    });
  });

  describe('PUT /api/me/password', () => {
    it('fails when current password is wrong', async () => {
      const token = generateToken('user-123', 'ADMIN_GERAL');
      const realPasswordHashed = await bcrypt.hash('realpass', 10);
      
      // 1. mock requireAuth user lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-123', nome: 'Admin User', password: realPasswordHashed, role: 'ADMIN_GERAL' }]
      });
      // 2. mock db.getUserById inside route
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-123', nome: 'Admin User', password: realPasswordHashed, role: 'ADMIN_GERAL' }]
      });

      const res = await request(app)
        .put('/api/me/password')
        .set('Cookie', [`token=${token}`])
        .send({ currentPassword: 'wrongpass', newPassword: 'newpass' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Senha atual incorreta');
    });

    it('succeeds when current password is correct and updates database', async () => {
      const token = generateToken('user-123', 'ADMIN_GERAL');
      const realPasswordHashed = await bcrypt.hash('realpass', 10);

      // 1. mock requireAuth user lookup
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-123', nome: 'Admin User', password: realPasswordHashed, role: 'ADMIN_GERAL' }]
      });
      // 2. mock db.getUserById inside route
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: 'user-123', nome: 'Admin User', password: realPasswordHashed, role: 'ADMIN_GERAL' }]
      });
      // 3. mock update query success
      mockQuery.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .put('/api/me/password')
        .set('Cookie', [`token=${token}`])
        .send({ currentPassword: 'realpass', newPassword: 'newpass' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
  });

  describe('Delegações API', () => {
    describe('GET /api/delegacoes', () => {
      it('returns all delegations for ADMIN_GERAL', async () => {
        const token = generateToken('admin-1', 'ADMIN_GERAL');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'del-1', nome: 'Brasil' }, { id: 'del-2', nome: 'Argentina' }]
        });

        const res = await request(app)
          .get('/api/delegacoes')
          .set('Cookie', [`token=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(2);
      });

      it('returns only the own delegation for MODERADOR', async () => {
        const token = generateToken('mod-1', 'MODERADOR');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'mod-1', role: 'MODERADOR', delegacao_id: 'del-1' }]
        });
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'del-1', nome: 'Brasil' }, { id: 'del-2', nome: 'Argentina' }]
        });

        const res = await request(app)
          .get('/api/delegacoes')
          .set('Cookie', [`token=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe('del-1');
      });
    });

    describe('POST /api/delegacoes', () => {
      it('fails when user is MODERADOR', async () => {
        const token = generateToken('mod-1', 'MODERADOR');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'mod-1', role: 'MODERADOR' }]
        });

        const res = await request(app)
          .post('/api/delegacoes')
          .set('Cookie', [`token=${token}`])
          .send({ nome: 'Chile' });

        expect(res.status).toBe(403);
      });

      it('succeeds when user is ADMIN_GERAL', async () => {
        const token = generateToken('admin-1', 'ADMIN_GERAL');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });
        mockQuery.mockResolvedValueOnce({ rows: [] }); // insert success

        const res = await request(app)
          .post('/api/delegacoes')
          .set('Cookie', [`token=${token}`])
          .send({ nome: 'Uruguai' });

        expect(res.status).toBe(200);
        expect(res.body.nome).toBe('Uruguai');
        expect(res.body.id).toBeDefined();
      });
    });
  });

  describe('Esportes API', () => {
    describe('POST /api/esportes', () => {
      it('fails when date is missing', async () => {
        const token = generateToken('admin-1', 'ADMIN_GERAL');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });

        const res = await request(app)
          .post('/api/esportes')
          .set('Cookie', [`token=${token}`])
          .send({ nome: 'Basquete', categoria: 'MASCULINO', turno: 1, minParticipantes: 5, maxParticipantes: 10 });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('O esporte deve ter uma data.');
      });

      it('succeeds with all valid data', async () => {
        const token = generateToken('admin-1', 'ADMIN_GERAL');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });
        mockQuery.mockResolvedValueOnce({ rows: [] }); // insert success

        const res = await request(app)
          .post('/api/esportes')
          .set('Cookie', [`token=${token}`])
          .send({ nome: 'Basquete', categoria: 'MASCULINO', turno: 1, data: '2026-06-01', minParticipantes: 5, maxParticipantes: 10 });

        expect(res.status).toBe(200);
        expect(res.body.nome).toBe('Basquete');
        expect(res.body.data).toBe('2026-06-01');
      });
    });
  });

  describe('Participantes API', () => {
    describe('GET /api/participantes', () => {
      it('filters out participants of other delegations for MODERADOR', async () => {
        const token = generateToken('mod-1', 'MODERADOR');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'mod-1', role: 'MODERADOR', delegacao_id: 'del-1' }]
        });
        // Mock getParticipantes
        mockQuery.mockResolvedValueOnce({
          rows: [
            { id: 'p1', nome_completo: 'P1', delegacao_id: 'del-1' },
            { id: 'p2', nome_completo: 'P2', delegacao_id: 'del-2' }
          ]
        });
        // Mock getDelegacoes
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'del-1', nome: 'Brasil' }, { id: 'del-2', nome: 'Argentina' }]
        });

        const res = await request(app)
          .get('/api/participantes')
          .set('Cookie', [`token=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].id).toBe('p1');
        expect(res.body[0].delegacaoNome).toBe('Brasil');
      });
    });

    describe('POST /api/participantes', () => {
      it('fails when MODERADOR tries to create participant in other delegation', async () => {
        const token = generateToken('mod-1', 'MODERADOR');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'mod-1', role: 'MODERADOR', delegacao_id: 'del-1' }]
        });

        const res = await request(app)
          .post('/api/participantes')
          .set('Cookie', [`token=${token}`])
          .send({ nomeCompleto: 'Atleta', cpf: '000', delegacaoId: 'del-2' });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Só pode cadastrar da própria delegação');
      });

      it('automatically creates a login account when registering a MODERADOR participant', async () => {
        const token = generateToken('admin-1', 'ADMIN_GERAL');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });
        // 1. Mock createParticipante
        mockQuery.mockResolvedValueOnce({ rows: [] });
        // 2. Mock createUser
        mockQuery.mockResolvedValueOnce({ rows: [] });

        const res = await request(app)
          .post('/api/participantes')
          .set('Cookie', [`token=${token}`])
          .send({ nomeCompleto: 'Moderador Delegação', cpf: '33333333333', tipo: 'MODERADOR', delegacaoId: 'del-1' });

        expect(res.status).toBe(200);
        expect(res.body.nomeCompleto).toBe('Moderador Delegação');
      });
    });
  });

  describe('Partidas API', () => {
    describe('POST /api/partidas', () => {
      it('fails when role is MODERADOR', async () => {
        const token = generateToken('mod-1', 'MODERADOR');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'mod-1', role: 'MODERADOR' }]
        });

        const res = await request(app)
          .post('/api/partidas')
          .set('Cookie', [`token=${token}`])
          .send({ esporteId: 'esp-1', equipe1Id: 'eq-1', equipe2Id: 'eq-2', placar1: 0, placar2: 0, fase: 'FINAL' });

        expect(res.status).toBe(403);
      });

      it('succeeds when role is MANAGER', async () => {
        const token = generateToken('manager-1', 'MANAGER');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'manager-1', role: 'MANAGER' }]
        });
        mockQuery.mockResolvedValueOnce({ rows: [] }); // insert success

        const res = await request(app)
          .post('/api/partidas')
          .set('Cookie', [`token=${token}`])
          .send({ esporteId: 'esp-1', equipe1Id: 'eq-1', equipe2Id: 'eq-2', placar1: 3, placar2: 2, fase: 'FINAL' });

        expect(res.status).toBe(200);
        expect(res.body.placar1).toBe(3);
      });
    });
  });

  describe('Usuários API', () => {
    describe('GET /api/usuarios', () => {
      it('excludes ADMIN_GERAL users from listing when requester is MANAGER', async () => {
        const token = generateToken('manager-1', 'MANAGER');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'manager-1', role: 'MANAGER' }]
        });
        // getUsuarios
        mockQuery.mockResolvedValueOnce({
          rows: [
            { id: 'u1', nome: 'Admin', role: 'ADMIN_GERAL', cpf: '111', password: '1' },
            { id: 'u2', nome: 'Moderador', role: 'MODERADOR', cpf: '222', password: '1' }
          ]
        });
        // getDelegacoes
        mockQuery.mockResolvedValueOnce({
          rows: []
        });

        const res = await request(app)
          .get('/api/usuarios')
          .set('Cookie', [`token=${token}`]);

        expect(res.status).toBe(200);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].role).toBe('MODERADOR');
      });
    });

    describe('POST /api/usuarios', () => {
      it('fails when MANAGER tries to create a MANAGER user', async () => {
        const token = generateToken('manager-1', 'MANAGER');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'manager-1', role: 'MANAGER' }]
        });

        const res = await request(app)
          .post('/api/usuarios')
          .set('Cookie', [`token=${token}`])
          .send({ nome: 'M2', cpf: '444', password: '123', role: 'MANAGER' });

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Managers só podem criar contas de Moderadores');
      });

      it('fails when CPF is already registered', async () => {
        const token = generateToken('admin-1', 'ADMIN_GERAL');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });
        // getUserByCpf returning existing user
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'exist', cpf: '123' }]
        });

        const res = await request(app)
          .post('/api/usuarios')
          .set('Cookie', [`token=${token}`])
          .send({ nome: 'User', cpf: '123', password: '123', role: 'MODERADOR' });

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('CPF já cadastrado');
      });
    });

    describe('DELETE /api/usuarios/:id', () => {
      it('fails when user tries to delete their own account', async () => {
        const token = generateToken('admin-1', 'ADMIN_GERAL');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });
        // target user lookup (returns same user)
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });

        const res = await request(app)
          .delete('/api/usuarios/admin-1')
          .set('Cookie', [`token=${token}`]);

        expect(res.status).toBe(400);
        expect(res.body.error).toBe('Não é possível excluir a própria conta aqui');
      });

      it('fails when ADMIN_GERAL tries to delete another ADMIN_GERAL', async () => {
        const token = generateToken('admin-1', 'ADMIN_GERAL');
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-1', role: 'ADMIN_GERAL' }]
        });
        // target user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'admin-2', role: 'ADMIN_GERAL' }]
        });

        const res = await request(app)
          .delete('/api/usuarios/admin-2')
          .set('Cookie', [`token=${token}`]);

        expect(res.status).toBe(403);
        expect(res.body.error).toBe('Não é possível excluir outro ADMIN_GERAL');
      });
    });
  });

  describe('Tabela de Medalhas / Ranking API', () => {
    it('correctly calculates standing ordered by Gold, then Silver, then Bronze, then Total', async () => {
      // 1. db.getDelegacoes()
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'del-br', nome: 'Brasil' },
          { id: 'del-ar', nome: 'Argentina' },
          { id: 'del-ch', nome: 'Chile' }
        ]
      });
      // 2. db.getPartidas()
      mockQuery.mockResolvedValueOnce({
        rows: [
          // D1 vs D2: D1 gets GOLD, D2 gets SILVER
          { id: 'p1', equipe1_id: 'eq-br', equipe2_id: 'eq-ar', medalha_equipe1: 'OURO', medalha_equipe2: 'PRATA' },
          // D2 vs D3: D3 gets GOLD, D2 gets BRONZE
          { id: 'p2', equipe1_id: 'eq-ch', equipe2_id: 'eq-ar', medalha_equipe1: 'OURO', medalha_equipe2: 'BRONZE' }
        ]
      });
      // 3. db.getEquipes()
      mockQuery.mockResolvedValueOnce({
        rows: [
          { id: 'eq-br', delegacao_id: 'del-br' },
          { id: 'eq-ar', delegacao_id: 'del-ar' },
          { id: 'eq-ch', delegacao_id: 'del-ch' }
        ]
      });

      const res = await request(app).get('/api/public/ranking');

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(3);
      
      // Expected ranking:
      // Brasil: 1 Gold, 0 Silver, 0 Bronze (total 1)
      // Chile: 1 Gold, 0 Silver, 0 Bronze (total 1)
      // Argentina: 0 Gold, 1 Silver, 1 Bronze (total 2)
      expect(res.body[0].delegacaoNome).toBe('Brasil');
      expect(res.body[1].delegacaoNome).toBe('Chile');
      expect(res.body[2].delegacaoNome).toBe('Argentina');
      expect(res.body[2].prata).toBe(1);
      expect(res.body[2].bronze).toBe(1);
    });
  });

  describe('Business Rules Constraints', () => {
    describe('POST /api/equipes (Teams constraints)', () => {
      it('fails to create a team when participant count is less than minParticipants', async () => {
        const token = generateToken('user-manager', 'MANAGER');

        // 1. Mock requireAuth user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'user-manager', nome: 'Manager', cpf: '111', role: 'MANAGER' }]
        });

        // 2. Mock db.getEsportes in API route
        mockQuery.mockResolvedValueOnce({
          rows: [{
            id: 'esp-futebol',
            nome: 'Futebol',
            categoria: 'MASCULINO',
            turno: 1,
            data: '2026-05-30',
            min_participantes: 5,
            max_participantes: 11
          }]
        });

        const res = await request(app)
          .post('/api/equipes')
          .set('Cookie', [`token=${token}`])
          .send({
            nome: 'Brasil FC',
            delegacaoId: 'del-1',
            esporteId: 'esp-futebol',
            participanteIds: ['p1', 'p2', 'p3'] // Only 3 participants, min is 5!
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('exige entre 5 e 11 participantes');
      });

      it('fails to create a team when a participant has a date and shift conflict', async () => {
        const token = generateToken('user-manager', 'MANAGER');

        // 1. Mock requireAuth user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'user-manager', nome: 'Manager', cpf: '111', role: 'MANAGER' }]
        });

        // 2. Mock db.getEsportes inside route
        mockQuery.mockResolvedValueOnce({
          rows: [
            { id: 'esp-futebol', nome: 'Futebol', categoria: 'MASCULINO', turno: 1, data: '2026-05-30', min_participantes: 1, max_participantes: 5 },
            { id: 'esp-basquete', nome: 'Basquete', categoria: 'MASCULINO', turno: 1, data: '2026-05-30', min_participantes: 1, max_participantes: 5 }
          ]
        });

        // 3. Mock db.getEquipes to fetch existing teams
        mockQuery.mockResolvedValueOnce({
          rows: [{
            id: 'eq-basquete',
            nome: 'Basquete Team',
            delegacao_id: 'del-1',
            esporte_id: 'esp-basquete',
            participante_ids: ['pele-id'] // Pele is already in this team
          }]
        });

        // 4. Mock db.getParticipantes to fetch participant info
        mockQuery.mockResolvedValueOnce({
          rows: [{
            id: 'pele-id',
            nome_completo: 'Edson Arantes (Pelé)'
          }]
        });

        const res = await request(app)
          .post('/api/equipes')
          .set('Cookie', [`token=${token}`])
          .send({
            nome: 'Futebol Team',
            delegacaoId: 'del-1',
            esporteId: 'esp-futebol',
            participanteIds: ['pele-id'] // Trying to register Pele again on same date/shift!
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('já está na equipe Basquete Team');
        expect(res.body.error).toContain('mesma data (2026-05-30) e turno (1)');
      });
    });

    describe('DELETE /api/usuarios/:id (Hierarchy constraints)', () => {
      it('fails when a MANAGER tries to delete another MANAGER (Forbidden)', async () => {
        const token = generateToken('user-manager-1', 'MANAGER');

        // 1. Mock requireAuth user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'user-manager-1', nome: 'Manager 1', cpf: '111', role: 'MANAGER' }]
        });

        const res = await request(app)
          .delete('/api/usuarios/user-manager-2')
          .set('Cookie', [`token=${token}`]);

        expect(res.status).toBe(403);
      });

      it('fails when a MANAGER tries to delete a MODERADOR (Forbidden)', async () => {
        const token = generateToken('user-manager-1', 'MANAGER');

        // 1. Mock requireAuth user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'user-manager-1', nome: 'Manager 1', cpf: '111', role: 'MANAGER' }]
        });

        const res = await request(app)
          .delete('/api/usuarios/user-moderador')
          .set('Cookie', [`token=${token}`]);

        expect(res.status).toBe(403);
      });
    });

    describe('Zod Schema Validation Failure Tests', () => {
      it('returns 400 Bad Request when trying to login with an empty CPF', async () => {
        const res = await request(app)
          .post('/api/login')
          .send({ cpf: '', password: 'password' });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Erro de validação');
      });

      it('returns 400 Bad Request when creating a user with an invalid role enum', async () => {
        const token = generateToken('user-admin', 'ADMIN_GERAL');

        // Mock requireAuth user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'user-admin', nome: 'Admin User', cpf: '000', role: 'ADMIN_GERAL' }]
        });

        const res = await request(app)
          .post('/api/usuarios')
          .set('Cookie', [`token=${token}`])
          .send({
            nome: 'Novo Usuario',
            cpf: '12345678901',
            password: 'secretpass',
            role: 'SUPER_ADMIN', // Invalid role
            delegacaoId: 'del-1'
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Erro de validação');
        expect(res.body.error).toContain('role');
      });

      it('returns 400 Bad Request when creating an esporte with an invalid turno', async () => {
        const token = generateToken('user-admin', 'ADMIN_GERAL');

        // Mock requireAuth user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'user-admin', nome: 'Admin User', cpf: '000', role: 'ADMIN_GERAL' }]
        });

        const res = await request(app)
          .post('/api/esportes')
          .set('Cookie', [`token=${token}`])
          .send({
            nome: 'Futebol Novo',
            categoria: 'MASCULINO',
            turno: 5, // Invalid turno (should be 1, 2, or 3)
            data: '2026-05-30',
            minParticipantes: 5,
            maxParticipantes: 11
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Erro de validação');
        expect(res.body.error).toContain('turno');
      });

      it('returns 400 Bad Request when creating an esporte where maxParticipantes is less than minParticipantes', async () => {
        const token = generateToken('user-admin', 'ADMIN_GERAL');

        // Mock requireAuth user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'user-admin', nome: 'Admin User', cpf: '000', role: 'ADMIN_GERAL' }]
        });

        const res = await request(app)
          .post('/api/esportes')
          .set('Cookie', [`token=${token}`])
          .send({
            nome: 'Futebol Novo',
            categoria: 'MASCULINO',
            turno: 1,
            data: '2026-05-30',
            minParticipantes: 10,
            maxParticipantes: 5 // Invalid (max < min)
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Erro de validação');
      });

      it('returns 400 Bad Request when creating a team with invalid participanteIds type', async () => {
        const token = generateToken('user-moderador', 'MODERADOR');

        // Mock requireAuth user lookup
        mockQuery.mockResolvedValueOnce({
          rows: [{ id: 'user-moderador', nome: 'Moderador 1', cpf: '111', role: 'MODERADOR', delegacaoId: 'del-1' }]
        });

        const res = await request(app)
          .post('/api/equipes')
          .set('Cookie', [`token=${token}`])
          .send({
            nome: 'Equipe Vazia',
            delegacaoId: 'del-1',
            esporteId: 'esp-futebol',
            participanteIds: 'not-an-array' // Invalid type (should be an array of strings)
          });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('Erro de validação');
        expect(res.body.error).toContain('participanteIds');
      });
    });
  });
});
