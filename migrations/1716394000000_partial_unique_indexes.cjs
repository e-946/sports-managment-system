exports.up = (pgm) => {
  pgm.sql(`
    -- Drop existing UNIQUE constraints on users and participantes tables
    -- They are usually named table_column_key by default in postgres
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_cpf_key;
    ALTER TABLE participantes DROP CONSTRAINT IF EXISTS participantes_cpf_key;

    -- Drop indexes if they were created as simple indexes instead of constraints
    DROP INDEX IF EXISTS users_cpf_key;
    DROP INDEX IF EXISTS participantes_cpf_key;

    -- Create new partial unique indexes that ignore soft-deleted records
    CREATE UNIQUE INDEX users_cpf_unique_active_idx ON users (cpf) WHERE deleted_at IS NULL;
    CREATE UNIQUE INDEX participantes_cpf_unique_active_idx ON participantes (cpf) WHERE deleted_at IS NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    -- Drop partial indexes
    DROP INDEX IF EXISTS users_cpf_unique_active_idx;
    DROP INDEX IF EXISTS participantes_cpf_unique_active_idx;

    -- Re-add the unique constraints (warning: will fail if duplicates exist including deleted ones)
    ALTER TABLE users ADD CONSTRAINT users_cpf_key UNIQUE (cpf);
    ALTER TABLE participantes ADD CONSTRAINT participantes_cpf_key UNIQUE (cpf);
  `);
};
