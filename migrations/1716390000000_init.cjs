exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS delegacoes (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      delegacao_id TEXT NULL REFERENCES delegacoes(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS esportes (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      categoria TEXT NOT NULL,
      turno INTEGER NOT NULL,
      data TEXT NOT NULL,
      min_participantes INTEGER NOT NULL,
      max_participantes INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS participantes (
      id TEXT PRIMARY KEY,
      nome_completo TEXT NOT NULL,
      nome_abreviado TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      data_nascimento TEXT NOT NULL,
      idade INTEGER NOT NULL,
      sexo TEXT NOT NULL,
      celular TEXT NOT NULL,
      tipo TEXT NOT NULL,
      delegacao_id TEXT REFERENCES delegacoes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS equipes (
      id TEXT PRIMARY KEY,
      nome TEXT NOT NULL,
      delegacao_id TEXT NOT NULL REFERENCES delegacoes(id) ON DELETE CASCADE,
      esporte_id TEXT NOT NULL REFERENCES esportes(id) ON DELETE CASCADE,
      participante_ids TEXT[] NOT NULL
    );

    CREATE TABLE IF NOT EXISTS partidas (
      id TEXT PRIMARY KEY,
      esporte_id TEXT NOT NULL REFERENCES esportes(id) ON DELETE CASCADE,
      equipe1_id TEXT REFERENCES equipes(id) ON DELETE SET NULL,
      equipe2_id TEXT REFERENCES equipes(id) ON DELETE SET NULL,
      placar1 INTEGER,
      placar2 INTEGER,
      equipe_vencedora_id TEXT REFERENCES equipes(id) ON DELETE SET NULL,
      fase TEXT NOT NULL,
      medalha_equipe1 TEXT,
      medalha_equipe2 TEXT
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP TABLE IF EXISTS partidas;
    DROP TABLE IF EXISTS equipes;
    DROP TABLE IF EXISTS participantes;
    DROP TABLE IF EXISTS esportes;
    DROP TABLE IF EXISTS users;
    DROP TABLE IF EXISTS delegacoes;
  `);
};
