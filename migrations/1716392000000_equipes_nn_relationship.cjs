exports.up = (pgm) => {
  pgm.sql(`
    -- 1. Create the associative table for N:N relationship
    CREATE TABLE IF NOT EXISTS equipe_participantes (
      equipe_id TEXT NOT NULL REFERENCES equipes(id) ON DELETE CASCADE,
      participante_id TEXT NOT NULL REFERENCES participantes(id) ON DELETE CASCADE,
      PRIMARY KEY (equipe_id, participante_id)
    );

    -- 2. Migrate existing data from the old array column into the new N:N table
    INSERT INTO equipe_participantes (equipe_id, participante_id)
    SELECT id, unnest(participante_ids)
    FROM equipes
    ON CONFLICT DO NOTHING;

    -- 3. Drop the old array column from equipes table
    ALTER TABLE equipes DROP COLUMN IF EXISTS participante_ids;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    -- 1. Restore the array column on equipes table
    ALTER TABLE equipes ADD COLUMN IF NOT EXISTS participante_ids TEXT[];

    -- 2. Populate the restored array column with data from the N:N table
    UPDATE equipes e
    SET participante_ids = ARRAY(
      SELECT ep.participante_id
      FROM equipe_participantes ep
      WHERE ep.equipe_id = e.id
    );

    -- 3. Drop the N:N associative table
    DROP TABLE IF EXISTS equipe_participantes;
  `);
};
