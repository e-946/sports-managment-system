import { Router } from 'express';
import { db } from '../db';
import { requireAuth } from '../middlewares/auth';

const router = Router();

router.get('/updates', requireAuth(['ADMIN_GERAL']), async (req: any, res) => {
  try {
    const { search, tipo } = req.query;
    const logs = await db.getLogUpdates(search as string, tipo as string);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

router.get('/deletes', requireAuth(['ADMIN_GERAL']), async (req: any, res) => {
  try {
    const { search, tipo } = req.query;
    const logs = await db.getLogDeletes(search as string, tipo as string);
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

export default router;
