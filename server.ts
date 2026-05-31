import express from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { initDb } from './src/db';
import authRouter from './src/routes/auth.routes';
import delegacoesRouter from './src/routes/delegacoes.routes';
import esportesRouter from './src/routes/esportes.routes';
import participantesRouter from './src/routes/participantes.routes';
import equipesRouter from './src/routes/equipes.routes';
import partidasRouter from './src/routes/partidas.routes';
import usuariosRouter from './src/routes/usuarios.routes';
import publicRouter from './src/routes/public.routes';
import logsRouter from './src/routes/logs.routes';

dotenv.config();

export async function createServer() {
  const app = express();

  const isTestEnv = process.env.NODE_ENV === 'test' || process.env.JWT_SECRET === 'super-secret-jwt-key';

  // Basic security and parsing middlewares
  app.use(helmet({
    contentSecurityPolicy: isTestEnv ? false : undefined,
    hsts: isTestEnv ? false : undefined,
  }));
  app.use(express.json());
  app.use(cookieParser());

  // --- API ROUTING MODULARIZATION ---
  app.use('/api', authRouter);
  app.use('/api/delegacoes', delegacoesRouter);
  app.use('/api/esportes', esportesRouter);
  app.use('/api/participantes', participantesRouter);
  app.use('/api/equipes', equipesRouter);
  app.use('/api/partidas', partidasRouter);
  app.use('/api/usuarios', usuariosRouter);
  app.use('/api/logs', logsRouter);
  app.use('/api/public', publicRouter);

  return app;
}

if (process.env.NODE_ENV !== 'test') {
  createServer().then(async (app) => {
    const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
    
    // Database schema execution and seeding verify
    try {
      await initDb();
    } catch (error) {
      console.error('Failed to initialize PostgreSQL Database:', error);
      process.exit(1);
    }

    // Vite middleware for development or Static File Serving for Production
    if (process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "test") {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  });
}
