import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const { Pool } = pg;
export const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is missing.');
  process.exit(1);
}

// Initialize PostgreSQL Connection Pool
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/gestao_esportiva'
});

// Database Initialization (Verify connection and ensure default Admin seed)
export const initDb = async () => {
  let retries = 5;
  while (retries > 0) {
    try {
      await pool.query('SELECT 1');
      console.log('Successfully connected to PostgreSQL');
      break;
    } catch (err) {
      console.log(`Failed to connect to PostgreSQL, retries left: ${retries - 1}. Error:`, err);
      retries--;
      if (retries === 0) throw err;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Seed default admin (Assumes tables are created by migrations beforehand)
  const existingAdmin = await pool.query('SELECT * FROM users WHERE cpf = $1 AND deleted_at IS NULL', ['admin']);
  if (existingAdmin.rows.length === 0) {
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await pool.query(
      'INSERT INTO users (id, nome, cpf, password, role) VALUES ($1, $2, $3, $4, $5)',
      ['1', 'Admin Geral', 'admin', hashedPassword, 'ADMIN_GERAL']
    );
  }

  console.log('Database connection verified and default admin check completed');
};

// Database Access Abstraction
export const db = {
  // Logs System
  logUpdate: async (tipoEntidade: string, entidadeId: string, usuarioId: string, changes: any) => {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO log_updates (id, tipo_entidade, entidade_id, usuario_id, changes) VALUES ($1, $2, $3, $4, $5)',
      [id, tipoEntidade, entidadeId, usuarioId, JSON.stringify(changes)]
    );
  },

  logDelete: async (tipoEntidade: string, entidadeId: string, usuarioId: string) => {
    const id = uuidv4();
    await pool.query(
      'INSERT INTO log_deletes (id, tipo_entidade, entidade_id, usuario_id) VALUES ($1, $2, $3, $4)',
      [id, tipoEntidade, entidadeId, usuarioId]
    );
  },

  getLogUpdates: async (search?: string, tipoEntidade?: string) => {
    let queryStr = `
      SELECT lu.*, u.nome as usuario_nome, u.cpf as usuario_cpf 
      FROM log_updates lu
      JOIN users u ON lu.usuario_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (tipoEntidade) {
      params.push(tipoEntidade);
      conditions.push(`lu.tipo_entidade = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.nome ILIKE $${params.length} OR u.cpf ILIKE $${params.length} OR lu.entidade_id ILIKE $${params.length} OR lu.tipo_entidade ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY lu.created_at DESC';
    const res = await pool.query(queryStr, params);
    return res.rows.map(r => ({
      id: r.id,
      tipoEntidade: r.tipo_entidade,
      entidadeId: r.entidade_id,
      usuarioId: r.usuario_id,
      usuarioNome: r.usuario_nome,
      usuarioCpf: r.usuario_cpf,
      changes: r.changes,
      createdAt: r.created_at
    }));
  },

  getLogDeletes: async (search?: string, tipoEntidade?: string) => {
    let queryStr = `
      SELECT ld.*, u.nome as usuario_nome, u.cpf as usuario_cpf 
      FROM log_deletes ld
      JOIN users u ON ld.usuario_id = u.id
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (tipoEntidade) {
      params.push(tipoEntidade);
      conditions.push(`ld.tipo_entidade = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(u.nome ILIKE $${params.length} OR u.cpf ILIKE $${params.length} OR ld.entidade_id ILIKE $${params.length} OR ld.tipo_entidade ILIKE $${params.length})`);
    }

    if (conditions.length > 0) {
      queryStr += ' WHERE ' + conditions.join(' AND ');
    }

    queryStr += ' ORDER BY ld.created_at DESC';
    const res = await pool.query(queryStr, params);
    return res.rows.map(r => ({
      id: r.id,
      tipoEntidade: r.tipo_entidade,
      entidadeId: r.entidade_id,
      usuarioId: r.usuario_id,
      usuarioNome: r.usuario_nome,
      usuarioCpf: r.usuario_cpf,
      createdAt: r.created_at
    }));
  },

  // Users
  getUserById: async (id: string) => {
    const res = await pool.query('SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (res.rows.length === 0) return null;
    const u = res.rows[0];
    return { id: u.id, nome: u.nome, cpf: u.cpf, password: u.password, role: u.role, delegacaoId: u.delegacao_id };
  },
  getUserByCpf: async (cpf: string) => {
    const res = await pool.query('SELECT * FROM users WHERE cpf = $1 AND deleted_at IS NULL', [cpf]);
    if (res.rows.length === 0) return null;
    const u = res.rows[0];
    return { id: u.id, nome: u.nome, cpf: u.cpf, password: u.password, role: u.role, delegacaoId: u.delegacao_id };
  },
  updateUserPassword: async (id: string, newPass: string) => {
    const hashedPassword = await bcrypt.hash(newPass, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, id]);
  },
  getUsuarios: async () => {
    const res = await pool.query('SELECT * FROM users WHERE deleted_at IS NULL');
    return res.rows.map(u => ({
      id: u.id,
      nome: u.nome,
      cpf: u.cpf,
      password: u.password,
      role: u.role,
      delegacaoId: u.delegacao_id
    }));
  },
  createUser: async (user: any) => {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const delegacaoId = user.delegacaoId === '' || user.delegacaoId === undefined ? null : user.delegacaoId;
    await pool.query(
      'INSERT INTO users (id, nome, cpf, password, role, delegacao_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [user.id, user.nome, user.cpf, hashedPassword, user.role, delegacaoId]
    );
    return user;
  },
  updateUser: async (id: string, u: any) => {
    const delegacaoId = u.delegacaoId === '' || u.delegacaoId === undefined ? null : u.delegacaoId;
    if (u.password) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      await pool.query(
        'UPDATE users SET nome = $1, role = $2, delegacao_id = $3, password = $4 WHERE id = $5',
        [u.nome, u.role, delegacaoId, hashedPassword, id]
      );
    } else {
      await pool.query(
        'UPDATE users SET nome = $1, role = $2, delegacao_id = $3 WHERE id = $4',
        [u.nome, u.role, delegacaoId, id]
      );
    }
  },
  deleteUser: async (id: string, usuarioId: string) => {
    await pool.query('UPDATE users SET deleted_at = NOW() WHERE id = $1', [id]);
    await db.logDelete('user', id, usuarioId);
  },

  // Delegacoes
  getDelegacaoById: async (id: string) => {
    const res = await pool.query('SELECT * FROM delegacoes WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (res.rows.length === 0) return null;
    return res.rows[0];
  },
  getDelegacoes: async () => {
    const res = await pool.query('SELECT * FROM delegacoes WHERE deleted_at IS NULL');
    return res.rows;
  },
  createDelegacao: async (d: any) => {
    await pool.query('INSERT INTO delegacoes (id, nome) VALUES ($1, $2)', [d.id, d.nome]);
    return d;
  },
  updateDelegacao: async (id: string, d: any) => {
    await pool.query('UPDATE delegacoes SET nome = $1 WHERE id = $2', [d.nome, id]);
  },
  deleteDelegacao: async (id: string, usuarioId: string) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE delegacoes SET deleted_at = NOW() WHERE id = $1', [id]);
      await client.query('UPDATE users SET deleted_at = NOW() WHERE delegacao_id = $1 AND deleted_at IS NULL', [id]);
      await client.query('UPDATE participantes SET deleted_at = NOW() WHERE delegacao_id = $1 AND deleted_at IS NULL', [id]);
      await client.query('UPDATE equipes SET deleted_at = NOW() WHERE delegacao_id = $1 AND deleted_at IS NULL', [id]);
      
      const logId = uuidv4();
      await client.query(
        'INSERT INTO log_deletes (id, tipo_entidade, entidade_id, usuario_id) VALUES ($1, $2, $3, $4)',
        [logId, 'delegacao', id, usuarioId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Esportes
  getEsporteById: async (id: string) => {
    const res = await pool.query('SELECT * FROM esportes WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (res.rows.length === 0) return null;
    const e = res.rows[0];
    return {
      id: e.id,
      nome: e.nome,
      categoria: e.categoria,
      turno: e.turno,
      data: e.data,
      minParticipantes: e.min_participantes,
      maxParticipantes: e.max_participantes
    };
  },
  getEsportes: async () => {
    const res = await pool.query('SELECT * FROM esportes WHERE deleted_at IS NULL');
    return res.rows.map(e => ({
      id: e.id,
      nome: e.nome,
      categoria: e.categoria,
      turno: e.turno,
      data: e.data,
      minParticipantes: e.min_participantes,
      maxParticipantes: e.max_participantes
    }));
  },
  createEsporte: async (e: any) => {
    await pool.query(
      'INSERT INTO esportes (id, nome, categoria, turno, data, min_participantes, max_participantes) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [e.id, e.nome, e.categoria, e.turno, e.data, e.minParticipantes, e.maxParticipantes]
    );
    return e;
  },
  updateEsporte: async (id: string, e: any) => {
    await pool.query(
      'UPDATE esportes SET nome = $1, categoria = $2, turno = $3, data = $4, min_participantes = $5, max_participantes = $6 WHERE id = $7',
      [e.nome, e.categoria, e.turno, e.data, e.minParticipantes, e.maxParticipantes, id]
    );
  },
  deleteEsporte: async (id: string, usuarioId: string) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE esportes SET deleted_at = NOW() WHERE id = $1', [id]);
      await client.query('UPDATE equipes SET deleted_at = NOW() WHERE esporte_id = $1 AND deleted_at IS NULL', [id]);
      await client.query('UPDATE partidas SET deleted_at = NOW() WHERE esporte_id = $1 AND deleted_at IS NULL', [id]);
      
      const logId = uuidv4();
      await client.query(
        'INSERT INTO log_deletes (id, tipo_entidade, entidade_id, usuario_id) VALUES ($1, $2, $3, $4)',
        [logId, 'esporte', id, usuarioId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Participantes
  getParticipanteById: async (id: string) => {
    const res = await pool.query('SELECT * FROM participantes WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (res.rows.length === 0) return null;
    const p = res.rows[0];
    return {
      id: p.id,
      nomeCompleto: p.nome_completo,
      nomeAbreviado: p.nome_abreviado,
      cpf: p.cpf,
      dataNascimento: p.data_nascimento,
      idade: p.idade,
      sexo: p.sexo,
      celular: p.celular,
      tipo: p.tipo,
      delegacaoId: p.delegacao_id
    };
  },
  getParticipanteByCpf: async (cpf: string) => {
    const res = await pool.query('SELECT * FROM participantes WHERE cpf = $1 AND deleted_at IS NULL', [cpf]);
    if (res.rows.length === 0) return null;
    const p = res.rows[0];
    return {
      id: p.id,
      nomeCompleto: p.nome_completo,
      nomeAbreviado: p.nome_abreviado,
      cpf: p.cpf,
      dataNascimento: p.data_nascimento,
      idade: p.idade,
      sexo: p.sexo,
      celular: p.celular,
      tipo: p.tipo,
      delegacaoId: p.delegacao_id
    };
  },
  getParticipantes: async () => {
    const res = await pool.query('SELECT * FROM participantes WHERE deleted_at IS NULL');
    return res.rows.map(p => ({
      id: p.id,
      nomeCompleto: p.nome_completo,
      nomeAbreviado: p.nome_abreviado,
      cpf: p.cpf,
      dataNascimento: p.data_nascimento,
      idade: p.idade,
      sexo: p.sexo,
      celular: p.celular,
      tipo: p.tipo,
      delegacaoId: p.delegacao_id
    }));
  },
  createParticipante: async (p: any) => {
    const delegacaoId = p.delegacaoId === '' || p.delegacaoId === undefined ? null : p.delegacaoId;
    await pool.query(
      'INSERT INTO participantes (id, nome_completo, nome_abreviado, cpf, data_nascimento, idade, sexo, celular, tipo, delegacao_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [p.id, p.nomeCompleto, p.nomeAbreviado, p.cpf, p.dataNascimento, p.idade, p.sexo, p.celular, p.tipo, delegacaoId]
    );
    return p;
  },
  updateParticipante: async (id: string, p: any) => {
    const delegacaoId = p.delegacaoId === '' || p.delegacaoId === undefined ? null : p.delegacaoId;
    await pool.query(
      'UPDATE participantes SET nome_completo = $1, nome_abreviado = $2, cpf = $3, data_nascimento = $4, idade = $5, sexo = $6, celular = $7, tipo = $8, delegacao_id = $9 WHERE id = $10',
      [p.nomeCompleto, p.nomeAbreviado, p.cpf, p.dataNascimento, p.idade, p.sexo, p.celular, p.tipo, delegacaoId, id]
    );
  },
  deleteParticipante: async (id: string, usuarioId: string) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE participantes SET deleted_at = NOW() WHERE id = $1', [id]);
      await client.query('DELETE FROM equipe_participantes WHERE participante_id = $1', [id]);
      
      const logId = uuidv4();
      await client.query(
        'INSERT INTO log_deletes (id, tipo_entidade, entidade_id, usuario_id) VALUES ($1, $2, $3, $4)',
        [logId, 'participante', id, usuarioId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Equipes
  getEquipeById: async (id: string) => {
    const res = await pool.query(`
      SELECT 
        e.id, 
        e.nome, 
        e.delegacao_id, 
        e.esporte_id, 
        COALESCE(array_remove(array_agg(ep.participante_id), NULL), '{}') AS participante_ids
      FROM equipes e
      LEFT JOIN equipe_participantes ep ON e.id = ep.equipe_id
      LEFT JOIN participantes p ON ep.participante_id = p.id AND p.deleted_at IS NULL
      WHERE e.id = $1 AND e.deleted_at IS NULL
      GROUP BY e.id, e.nome, e.delegacao_id, e.esporte_id
    `, [id]);
    if (res.rows.length === 0) return null;
    const e = res.rows[0];
    return {
      id: e.id,
      nome: e.nome,
      delegacaoId: e.delegacao_id,
      esporteId: e.esporte_id,
      participanteIds: e.participante_ids
    };
  },
  getEquipes: async () => {
    const res = await pool.query(`
      SELECT 
        e.id, 
        e.nome, 
        e.delegacao_id, 
        e.esporte_id, 
        COALESCE(array_remove(array_agg(ep.participante_id), NULL), '{}') AS participante_ids
      FROM equipes e
      LEFT JOIN equipe_participantes ep ON e.id = ep.equipe_id
      LEFT JOIN participantes p ON ep.participante_id = p.id AND p.deleted_at IS NULL
      WHERE e.deleted_at IS NULL
      GROUP BY e.id, e.nome, e.delegacao_id, e.esporte_id
    `);
    return res.rows.map(e => ({
      id: e.id,
      nome: e.nome,
      delegacaoId: e.delegacao_id,
      esporteId: e.esporte_id,
      participanteIds: e.participante_ids
    }));
  },
  createEquipe: async (e: any) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'INSERT INTO equipes (id, nome, delegacao_id, esporte_id) VALUES ($1, $2, $3, $4)',
        [e.id, e.nome, e.delegacaoId, e.esporteId]
      );
      if (e.participanteIds && e.participanteIds.length > 0) {
        for (const partId of e.participanteIds) {
          await client.query(
            'INSERT INTO equipe_participantes (equipe_id, participante_id) VALUES ($1, $2)',
            [e.id, partId]
          );
        }
      }
      await client.query('COMMIT');
      return e;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
  updateEquipe: async (id: string, e: any) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        'UPDATE equipes SET nome = $1, delegacao_id = $2, esporte_id = $3 WHERE id = $4',
        [e.nome, e.delegacaoId, e.esporteId, id]
      );
      await client.query('DELETE FROM equipe_participantes WHERE equipe_id = $1', [id]);
      if (e.participanteIds && e.participanteIds.length > 0) {
        for (const partId of e.participanteIds) {
          await client.query(
            'INSERT INTO equipe_participantes (equipe_id, participante_id) VALUES ($1, $2)',
            [id, partId]
          );
        }
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },
  deleteEquipe: async (id: string, usuarioId: string) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('UPDATE equipes SET deleted_at = NOW() WHERE id = $1', [id]);
      await client.query('UPDATE partidas SET deleted_at = NOW() WHERE (equipe1_id = $1 OR equipe2_id = $1) AND deleted_at IS NULL', [id]);
      
      const logId = uuidv4();
      await client.query(
        'INSERT INTO log_deletes (id, tipo_entidade, entidade_id, usuario_id) VALUES ($1, $2, $3, $4)',
        [logId, 'equipe', id, usuarioId]
      );
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  },

  // Partidas
  getPartidaById: async (id: string) => {
    const res = await pool.query('SELECT * FROM partidas WHERE id = $1 AND deleted_at IS NULL', [id]);
    if (res.rows.length === 0) return null;
    const p = res.rows[0];
    return {
      id: p.id,
      esporteId: p.esporte_id,
      equipe1Id: p.equipe1_id,
      equipe2Id: p.equipe2_id,
      placar1: p.placar1,
      placar2: p.placar2,
      equipeVencedoraId: p.equipe_vencedora_id,
      fase: p.fase,
      medalhaEquipe1: p.medalha_equipe1,
      medalhaEquipe2: p.medalha_equipe2
    };
  },
  getPartidas: async () => {
    const res = await pool.query('SELECT * FROM partidas WHERE deleted_at IS NULL');
    return res.rows.map(p => ({
      id: p.id,
      esporteId: p.esporte_id,
      equipe1Id: p.equipe1_id,
      equipe2Id: p.equipe2_id,
      placar1: p.placar1,
      placar2: p.placar2,
      equipeVencedoraId: p.equipe_vencedora_id,
      fase: p.fase,
      medalhaEquipe1: p.medalha_equipe1,
      medalhaEquipe2: p.medalha_equipe2
    }));
  },
  createPartida: async (p: any) => {
    await pool.query(
      'INSERT INTO partidas (id, esporte_id, equipe1_id, equipe2_id, placar1, placar2, equipe_vencedora_id, fase, medalha_equipe1, medalha_equipe2) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)',
      [p.id, p.esporteId, p.equipe1Id, p.equipe2Id, p.placar1, p.placar2, p.equipeVencedoraId, p.fase, p.medalhaEquipe1, p.medalhaEquipe2]
    );
    return p;
  },
  updatePartida: async (id: string, p: any) => {
    await pool.query(
      'UPDATE partidas SET esporte_id = $1, equipe1_id = $2, equipe2_id = $3, placar1 = $4, placar2 = $5, equipe_vencedora_id = $6, fase = $7, medalha_equipe1 = $8, medalha_equipe2 = $9 WHERE id = $10',
      [p.esporteId, p.equipe1Id, p.equipe2Id, p.placar1, p.placar2, p.equipeVencedoraId, p.fase, p.medalhaEquipe1, p.medalhaEquipe2, id]
    );
  },
  deletePartida: async (id: string, usuarioId: string) => {
    await pool.query('UPDATE partidas SET deleted_at = NOW() WHERE id = $1', [id]);
    await db.logDelete('partida', id, usuarioId);
  }
};
