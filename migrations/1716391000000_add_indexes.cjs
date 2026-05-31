exports.up = (pgm) => {
  pgm.sql(`
    -- Create indexes on users table
    CREATE INDEX IF NOT EXISTS idx_users_delegacao_id ON users(delegacao_id);

    -- Create indexes on participantes table
    CREATE INDEX IF NOT EXISTS idx_participantes_delegacao_id ON participantes(delegacao_id);

    -- Create indexes on equipes table
    CREATE INDEX IF NOT EXISTS idx_equipes_delegacao_id ON equipes(delegacao_id);
    CREATE INDEX IF NOT EXISTS idx_equipes_esporte_id ON equipes(esporte_id);

    -- Create indexes on partidas table
    CREATE INDEX IF NOT EXISTS idx_partidas_esporte_id ON partidas(esporte_id);
    CREATE INDEX IF NOT EXISTS idx_partidas_equipe1_id ON partidas(equipe1_id);
    CREATE INDEX IF NOT EXISTS idx_partidas_equipe2_id ON partidas(equipe2_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_partidas_equipe2_id;
    DROP INDEX IF EXISTS idx_partidas_equipe1_id;
    DROP INDEX IF EXISTS idx_partidas_esporte_id;
    DROP INDEX IF EXISTS idx_equipes_esporte_id;
    DROP INDEX IF EXISTS idx_equipes_delegacao_id;
    DROP INDEX IF EXISTS idx_participantes_delegacao_id;
    DROP INDEX IF EXISTS idx_users_delegacao_id;
  `);
};
