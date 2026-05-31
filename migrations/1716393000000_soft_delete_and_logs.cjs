exports.up = (pgm) => {
  pgm.sql(`
    -- Add soft delete columns
    ALTER TABLE delegacoes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
    ALTER TABLE esportes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
    ALTER TABLE participantes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
    ALTER TABLE equipes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;
    ALTER TABLE partidas ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE NULL;

    -- Create log_updates table
    CREATE TABLE IF NOT EXISTS log_updates (
      id TEXT PRIMARY KEY,
      tipo_entidade TEXT NOT NULL,
      entidade_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      changes JSONB NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create log_deletes table
    CREATE TABLE IF NOT EXISTS log_deletes (
      id TEXT PRIMARY KEY,
      tipo_entidade TEXT NOT NULL,
      entidade_id TEXT NOT NULL,
      usuario_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create indexes on log tables for quick searches
    CREATE INDEX IF NOT EXISTS idx_log_updates_usuario_id ON log_updates(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_log_updates_tipo_entidade ON log_updates(tipo_entidade);
    CREATE INDEX IF NOT EXISTS idx_log_updates_entidade_id ON log_updates(entidade_id);
    CREATE INDEX IF NOT EXISTS idx_log_deletes_usuario_id ON log_deletes(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_log_deletes_tipo_entidade ON log_deletes(tipo_entidade);
    CREATE INDEX IF NOT EXISTS idx_log_deletes_entidade_id ON log_deletes(entidade_id);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_log_deletes_entidade_id;
    DROP INDEX IF EXISTS idx_log_deletes_tipo_entidade;
    DROP INDEX IF EXISTS idx_log_deletes_usuario_id;
    DROP INDEX IF EXISTS idx_log_updates_entidade_id;
    DROP INDEX IF EXISTS idx_log_updates_tipo_entidade;
    DROP INDEX IF EXISTS idx_log_updates_usuario_id;

    DROP TABLE IF EXISTS log_deletes;
    DROP TABLE IF EXISTS log_updates;

    ALTER TABLE partidas DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE equipes DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE participantes DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE esportes DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE users DROP COLUMN IF EXISTS deleted_at;
    ALTER TABLE delegacoes DROP COLUMN IF EXISTS deleted_at;
  `);
};
